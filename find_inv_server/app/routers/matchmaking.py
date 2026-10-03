"""Matchmaking społeczny — autotagger, dopasowanie innowacji, voice-fix, RAG chat.

Każda funkcja ma warstwy, od najlepszej do zawsze działającej:
  LLM: rdzeń A1 (app.llm / app.utils) → prywatny klient OpenRouter (app.matchmaking_llm,
       gdy jest OPENROUTER_API_KEY) → lokalne reguły (app.local_matching).
  Dopasowanie: ChromaDB A1 + baza od A3 → ranking leksykalny na mockach.
Interfejs odpowiedzi jest ten sam niezależnie od warstwy.
"""

import asyncio
import inspect
import json
import logging
import re
from typing import AsyncIterator

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from app import knowledge_store, matchmaking_llm
from app.local_matching import TAXONOMY_TAGS, local_chat_answer, local_tag_result, rank_locally

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["matchmaking"])

try:
    from app import llm as core_llm
    from app.utils import run_autotagger as core_autotagger
except ImportError:
    core_llm = core_autotagger = None

try:
    from app.embeddings import similarity_search
except ImportError:
    similarity_search = None


def _llm_chat():
    """Funkcja chat(messages, stream) z najlepszej dostępnej warstwy albo None."""
    if core_llm is not None:
        return core_llm.chat
    if matchmaking_llm.enabled():
        return matchmaking_llm.chat
    return None


async def _autotag(text: str) -> dict:
    if core_autotagger is not None:
        return await core_autotagger(text)
    if matchmaking_llm.enabled():
        return await matchmaking_llm.autotag(text)
    return local_tag_result(text)

TOP_N = 5
TAG_BOOST = 0.1
# Limity chronią budżet LLM przed bardzo długimi wejściami.
MAX_TEXT = 2000
MAX_CHAT_MESSAGES = 20


# ── Schematy ─────────────────────────────────────────────


class TagRequest(BaseModel):
    text: str


class MatchRequest(BaseModel):
    text: str
    tags: list[str] = Field(default_factory=list)
    limit: int = Field(default=TOP_N, ge=1, le=20)


class VoiceFixRequest(BaseModel):
    transcript: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    # A4 wysyła context_innovation_ids — przyjmujemy obie nazwy.
    model_config = ConfigDict(populate_by_name=True)

    messages: list[ChatMessage]
    innovation_ids: list[int] = Field(default_factory=list, alias="context_innovation_ids")
    tags: list[str] = Field(default_factory=list)


# ── Pomocnicze ───────────────────────────────────────────


def _ok(data):
    return {"data": data, "error": None}


def _err(msg: str):
    return {"data": None, "error": msg}


def _sse(chunk: str) -> str:
    # Chunk jako JSON {"content": ...}: znaki nowej linii nie łamią ramek SSE (ustalone z A4).
    return f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"


def _innovation_to_dict(innov) -> dict:
    tags = innov.tags
    if isinstance(tags, str):
        try:
            tags = json.loads(tags)
        except json.JSONDecodeError:
            tags = []
    return {
        "id": innov.id,
        "title": innov.title,
        "short_desc": innov.short_desc,
        "full_desc": innov.full_desc,
        "category": innov.category,
        "area": innov.area,
        "target_group": innov.target_group,
        "location": innov.location,
        "status": innov.status,
        "cost_level": innov.cost_level,
        "implementation_time_months": innov.implementation_time_months,
        "testers_count": innov.testers_count,
        "where_implemented": innov.where_implemented,
        "source_url": innov.source_url,
        "tags": tags or [],
        "embedding_id": innov.embedding_id,
        "is_unmaintained": innov.status == "unmaintained",
    }


async def _fetch_innovations(where) -> list[dict]:
    """SELECT innowacji z SQLite. Zwraca [] jeśli DB/modele nie są jeszcze gotowe."""
    try:
        from sqlalchemy import select

        from app.database import SessionLocal
        from app.models import Innovation
    except ImportError:
        return []
    try:
        async with SessionLocal() as db:
            rows = (await db.execute(select(Innovation).where(where(Innovation)))).scalars().all()
    except Exception:  # brak tabel / seedu → wołający spada na mocki
        log.exception("innovations select failed")
        return []
    return [_innovation_to_dict(r) for r in rows]


async def _log_search(query: str, tags: list[str]) -> None:
    """Log do search_logs rdzenia (A1). Bez rdzenia loguje _log_search_zasobnik z /api/match."""
    try:
        from app.database import SessionLocal
        from app.models import SearchLog
    except ImportError:
        return
    try:
        async with SessionLocal() as db:
            db.add(SearchLog(query=query, tags=json.dumps(tags, ensure_ascii=False)))
            await db.commit()
    except Exception:  # logowanie trendów nie może psuć odpowiedzi
        log.exception("search_logs insert failed")


def _log_search_zasobnik(query: str, results: int) -> None:
    """Zapis do SearchLog Zasobnika — trafia do /api/admin/trends (top_queries, zero_result_queries)."""
    try:
        from sqlmodel import Session

        from app.db import engine
        from app.models import SearchLog

        with Session(engine) as session:
            session.add(SearchLog(query=query.lower()[:200], results=results))
            session.commit()
    except Exception:
        log.exception("zasobnik search log failed")


HIDDEN_STATUSES = {"archived", "pending"}


def _admin_statuses() -> dict[int, str]:
    """Statusy ustawione w panelu admina (A5): archiwizacja ma od razu zniknąć z wyników."""
    try:
        from app import admin_store
    except ImportError:
        return {}
    try:
        return {i["id"]: i["status"] for i in admin_store.list_innovations()}
    except Exception:
        log.exception("admin_store statuses failed")
        return {}


def _catalog() -> list[dict]:
    """Innowacje ROPS z data/parsed_innovations.json (A3); bez pliku knowledge_store zwraca mocki."""
    statuses = _admin_statuses()
    catalog = []
    for innov in knowledge_store.load_innovations():
        status = statuses.get(innov["id"], innov.get("status"))
        if status not in HIDDEN_STATUSES:
            catalog.append(knowledge_store.public({**innov, "status": status}, full=True))
    return catalog


def _log_search_admin(query: str, tags: list[str], results: int) -> None:
    """Trendy panelu admina (A5, admin_store.log_search) — rosną na żywo podczas demo."""
    try:
        from app import admin_store
    except ImportError:
        return
    try:
        admin_store.log_search(query, tags, results)
    except Exception:
        log.exception("admin_store.log_search failed")


def _local_match(text: str, tags: list[str], limit: int = TOP_N) -> dict:
    """Ranking bez embeddingów na katalogu ROPS, dopóki A1/A3 nie wystawią ChromaDB i bazy."""
    ranked = rank_locally(text, tags, _catalog())
    return {"innovations": ranked[:limit], "total_found": len(ranked)}


# ── Endpointy ────────────────────────────────────────────


@router.post("/tag")
async def tag(body: TagRequest, background: BackgroundTasks):
    text = body.text.strip()[:MAX_TEXT]
    if not text:
        return _err("Pusty opis problemu")
    try:
        result = await _autotag(text)
        result["tags"] = [t for t in result.get("tags", []) if t in TAXONOMY_TAGS]
    except Exception:
        log.exception("autotagger failed, using local tagger")
        result = local_tag_result(text)
    background.add_task(_log_search, text, result["tags"])
    return _ok(result)


@router.post("/match")
async def match(body: MatchRequest, background: BackgroundTasks):
    text = body.text.strip()[:MAX_TEXT]
    if not text:
        return _err("Pusty opis problemu")
    innovations = []
    if similarity_search is not None:
        try:
            results = await similarity_search(text, n_results=50)
            score_map = {r["id"]: r["score"] for r in results}
            innovations = await _fetch_innovations(lambda I: I.embedding_id.in_(list(score_map)))
        except Exception:
            log.exception("similarity_search failed, using local ranking")
    if not innovations:  # brak ChromaDB albo seedu od A3 → ranking lokalny, żeby demo działało
        result = _local_match(text, body.tags, body.limit)
        background.add_task(_log_search_zasobnik, text, result["total_found"])
        background.add_task(_log_search_admin, text, body.tags, result["total_found"])
        return _ok(result)

    query_tags = set(body.tags)
    for innov in innovations:
        cosine = score_map.get(innov["embedding_id"], 0.0)
        innov["match_score"] = round(cosine + TAG_BOOST * len(set(innov["tags"]) & query_tags), 4)
    innovations.sort(key=lambda i: i["match_score"], reverse=True)
    background.add_task(_log_search_admin, text, body.tags, len(innovations))
    return _ok({"innovations": innovations[: body.limit], "total_found": len(innovations)})


VOICE_FIX_PROMPT = (
    "Poprawiasz transkrypcję mowy po polsku. Popraw gramatykę, interpunkcję i oczywiste błędy "
    "rozpoznawania mowy, NIE zmieniaj sensu ani nie dopisuj treści. "
    'Odpowiedz wyłącznie JSON: {"corrected": "...", "confidence": 0.0-1.0}'
)


@router.post("/voice-fix")
async def voice_fix(body: VoiceFixRequest):
    transcript = body.transcript.strip()[:MAX_TEXT]
    llm_chat = _llm_chat()
    if llm_chat is None or not transcript:
        return _ok({"corrected": transcript, "confidence": 1.0})

    try:
        raw = await llm_chat(
            [
                {"role": "system", "content": VOICE_FIX_PROMPT},
                {"role": "user", "content": transcript},
            ]
        )
        parsed = matchmaking_llm.parse_json_object(raw)
        return _ok(
            {
                "corrected": parsed.get("corrected") or transcript,
                "confidence": float(parsed.get("confidence", 0.8)),
            }
        )
    except Exception:
        log.exception("voice-fix failed")
        return _ok({"corrected": transcript, "confidence": 0.5})


CHAT_SYSTEM_PROMPT = (
    "Jesteś asystentem platformy findinv, która łączy mieszkańców, NGO i urzędników z Małopolski "
    "ze sprawdzonymi innowacjami społecznymi z bazy ROPS Kraków. Odpowiadaj po polsku, krótko "
    "i konkretnie, prostym językiem. Opieraj się WYŁĄCZNIE na innowacjach poniżej — jeśli czegoś "
    "w nich nie ma, powiedz to wprost. Odwołuj się do innowacji po tytule. Pisz zwykłym "
    "tekstem, bez formatowania Markdown (bez gwiazdek i nagłówków).\n\n"
    "Innowacje dopasowane do problemu użytkownika:\n{context}"
)


def _rag_context(innovations: list[dict]) -> str:
    if not innovations:
        return "(brak — poproś użytkownika o dokładniejszy opis problemu)"
    parts = []
    for i in innovations:
        parts.append(
            f"### {i['title']}\n{i['short_desc']}\n{i['full_desc']}\n"
            f"Grupa docelowa: {i['target_group']} | Koszt: {i['cost_level']} | "
            f"Czas wdrożenia: {i['implementation_time_months']} mies. | "
            f"Gdzie wdrożono: {i['where_implemented']}"
            + (" | UWAGA: innowacja nieaktualna" if i.get("is_unmaintained") else "")
        )
    return "\n\n".join(parts)


@router.post("/chat")
async def chat(body: ChatRequest):
    async def gen() -> AsyncIterator[str]:
        ids = body.innovation_ids
        innovations = await _fetch_innovations(lambda I: I.id.in_(ids)) if ids else []
        if not innovations and ids:
            innovations = [i for i in _catalog() if i["id"] in ids]

        async def local_answer() -> AsyncIterator[str]:
            question = next((m.content for m in reversed(body.messages) if m.role == "user"), "")
            question = question.split("Pytanie:")[-1]  # pierwsza wiadomość niesie też opis problemu
            # Słowo po słowie, żeby frontend dostał ten sam efekt pisania co z LLM.
            for word in re.split(r"(?<=\s)", local_chat_answer(question, innovations)):
                yield _sse(word)
                await asyncio.sleep(0.02)

        llm_chat = _llm_chat()
        if llm_chat is None:
            async for event in local_answer():
                yield event
            yield "data: [DONE]\n\n"
            return

        messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT.format(context=_rag_context(innovations))}]
        history = [m for m in body.messages if m.role in ("user", "assistant")][-MAX_CHAT_MESSAGES:]
        messages += [{"role": m.role, "content": m.content[:MAX_TEXT]} for m in history]
        sent = False
        try:
            stream = llm_chat(messages, stream=True)
            if inspect.isawaitable(stream):
                stream = await stream
            async for chunk in stream:
                if chunk:
                    sent = True
                    yield _sse(chunk)
        except Exception:
            log.exception("chat stream failed")
            if sent:  # urwane w połowie — nie mieszamy dwóch odpowiedzi
                yield _sse("\n(Odpowiedź przerwana. Zapytaj jeszcze raz.)")
            else:
                async for event in local_answer():
                    yield event
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

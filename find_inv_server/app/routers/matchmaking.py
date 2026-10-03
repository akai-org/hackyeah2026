"""Matchmaking społeczny — autotagger, dopasowanie innowacji, voice-fix, RAG chat.

Każda funkcja ma warstwy, od najlepszej do zawsze działającej:
  LLM: rdzeń A1 (app.llm / app.utils), gdy jest OPENROUTER_API_KEY → lokalne reguły (app.local_matching).
  Katalog: tabela innovations (A1, seed z data/parsed_innovations.json od A3) → JSON A3 → mocki.
  Dopasowanie: ChromaDB (embeddingi, wymagają klucza) → ranking TF-IDF + tagi na katalogu.
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

from app import knowledge_store
from app.config import settings
from app.local_matching import (
    TAXONOMY_TAGS,
    condense_locally,
    local_chat_answer,
    local_tag_result,
    rank_locally,
    strip_fillers,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["matchmaking"])

TOP_N = 5
TAG_BOOST = 0.1
# Limity chronią budżet LLM przed bardzo długimi wejściami.
MAX_TEXT = 2000
MAX_CHAT_MESSAGES = 20
HIDDEN_STATUSES = {"archived", "pending"}


def _llm_enabled() -> bool:
    # Bez klucza każde wywołanie LLM/embeddingu kończy się błędem sieci — nie czekamy na niego przy każdym żądaniu.
    return bool(settings.openrouter_api_key)


def _llm_chat():
    """Funkcja chat(messages, stream) z rdzenia A1 albo None, gdy LLM jest niedostępny."""
    if not _llm_enabled():
        return None
    try:
        from app import llm
    except ImportError:
        return None
    return llm.chat


async def _autotag(text: str) -> dict:
    if _llm_enabled():
        from app.utils import run_autotagger

        return await run_autotagger(text)
    return local_tag_result(text)


def _parse_json_object(raw: str) -> dict:
    """LLM czasem owija JSON w ```json … ``` albo dopisuje zdanie — wycinamy sam obiekt."""
    return json.loads(raw[raw.find("{") : raw.rfind("}") + 1])


# ── Schematy ─────────────────────────────────────────────


class TagRequest(BaseModel):
    text: str


class MatchRequest(BaseModel):
    text: str
    tags: list[str] = Field(default_factory=list)
    limit: int = Field(default=TOP_N, ge=1, le=20)


class VoiceFixRequest(BaseModel):
    transcript: str
    # Wyszukiwarka: wypowiedź „naokoło” skracamy do sedna (kto, co, gdzie). Kreator zostawia pełny tekst.
    condense: bool = False


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    # A4 wysyła context_innovation_ids, frontend z main innovation_ids — przyjmujemy obie nazwy.
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
        "tags": innov.tags_list(),
        "embedding_id": innov.embedding_id,
        "is_unmaintained": innov.status == "unmaintained",
    }


async def _fetch_innovations(where=None) -> list[dict]:
    """SELECT innowacji z bazy rdzenia (A1). Zwraca [], jeśli baza nie jest gotowa."""
    try:
        from sqlalchemy import select

        from app.database import get_db
        from app.models import Innovation

        query = select(Innovation)
        if where is not None:
            query = query.where(where(Innovation))
        async with get_db() as db:
            rows = (await db.execute(query)).scalars().all()
    except Exception:  # brak tabel / seedu → wołający spada na JSON A3 albo mocki
        log.exception("innovations select failed")
        return []
    return [_innovation_to_dict(r) for r in rows]


def _admin_statuses() -> dict[int, str]:
    """Statusy z panelu admina A5 (admin_store), jeśli moduł jest w aplikacji."""
    try:
        from app import admin_store
    except ImportError:
        return {}
    try:
        return {i["id"]: i["status"] for i in admin_store.list_innovations()}
    except Exception:
        log.exception("admin_store statuses failed")
        return {}


async def _catalog() -> list[dict]:
    """Widoczne innowacje: baza (A1) → JSON ROPS (A3) → mocki. Archiwalne i oczekujące są ukryte."""
    innovations = await _fetch_innovations()
    if not innovations:
        innovations = [knowledge_store.public(i, full=True) for i in knowledge_store.load_innovations()]
    statuses = _admin_statuses()
    visible = []
    for innov in innovations:
        status = statuses.get(innov["id"], innov.get("status"))
        if status not in HIDDEN_STATUSES:
            visible.append({**innov, "status": status, "is_unmaintained": status == "unmaintained"})
    return visible


async def _log_search(query: str, tags: list[str], results: int) -> None:
    """search_logs rdzenia — z nich liczy /api/admin/trends (A1)."""
    try:
        from app.database import get_db
        from app.models import SearchLog

        async with get_db() as db:
            db.add(SearchLog(query=query[:500], tags=json.dumps(tags, ensure_ascii=False), results_count=results))
            await db.commit()
    except Exception:  # logowanie trendów nie może psuć odpowiedzi
        log.exception("search_logs insert failed")


def _log_search_zasobnik(query: str, results: int) -> None:
    """SearchLog Zasobnika — trafia do /api/zasobnik/admin/trends (top_queries, zero_result_queries)."""
    try:
        from sqlmodel import Session

        from app.zasobnik.db import engine
        from app.zasobnik.models import SearchLog

        with Session(engine) as session:
            session.add(SearchLog(query=query.lower()[:200], results=results))
            session.commit()
    except Exception:
        log.exception("zasobnik search log failed")


def _log_search_admin(query: str, tags: list[str], results: int) -> None:
    """Trendy panelu admina A5 (admin_store.log_search), jeśli moduł jest w aplikacji."""
    try:
        from app import admin_store
    except ImportError:
        return
    try:
        admin_store.log_search(query, tags, results)
    except Exception:
        log.exception("admin_store.log_search failed")


def _schedule_logs(background: BackgroundTasks, text: str, tags: list[str], results: int) -> None:
    background.add_task(_log_search, text, tags, results)
    background.add_task(_log_search_zasobnik, text, results)
    background.add_task(_log_search_admin, text, tags, results)


# ── Endpointy ────────────────────────────────────────────


@router.post("/tag")
async def tag(body: TagRequest):
    text = body.text.strip()[:MAX_TEXT]
    if not text:
        return _err("Pusty opis problemu")
    try:
        result = await _autotag(text)
        result["tags"] = [t for t in result.get("tags", []) if t in TAXONOMY_TAGS]
        result.setdefault("is_relevant", True)
    except Exception:
        log.exception("autotagger failed, using local tagger")
        result = local_tag_result(text)
    return _ok(result)


@router.post("/match")
async def match(body: MatchRequest, background: BackgroundTasks):
    text = body.text.strip()[:MAX_TEXT]
    if not text:
        return _err("Pusty opis problemu")

    catalog = await _catalog()
    ranked: list[dict] = []
    if _llm_enabled():
        try:
            from app.embeddings import similarity_search

            score_map = {r["id"]: r["score"] for r in await similarity_search(text, n_results=50)}
            query_tags = set(body.tags)
            for innov in catalog:
                if innov.get("embedding_id") in score_map:
                    cosine = score_map[innov["embedding_id"]]
                    score = cosine + TAG_BOOST * len(set(innov["tags"]) & query_tags)
                    ranked.append({**innov, "match_score": round(score, 4)})
            ranked.sort(key=lambda i: i["match_score"], reverse=True)
        except Exception:
            log.exception("similarity_search failed, using local ranking")
            ranked = []
    if not ranked:  # brak klucza, pusta ChromaDB albo błąd → ranking lokalny na tym samym katalogu
        ranked = rank_locally(text, body.tags, catalog)

    _schedule_logs(background, text, body.tags, len(ranked))
    return _ok({"innovations": ranked[: body.limit], "total_found": len(ranked)})


VOICE_FIX_PROMPT = (
    "Poprawiasz transkrypcję mowy po polsku. Popraw gramatykę, interpunkcję i oczywiste błędy "
    "rozpoznawania mowy, NIE zmieniaj sensu ani nie dopisuj treści. "
    "Usuń wtrącenia mowy potocznej bez treści, np. „yyy”, „no”, „ten no”, „tak jakby”, „jakby”, „wiesz”, „w sumie”, "
    "„generalnie”, „znaczy”, „po prostu”. "
    'Odpowiedz wyłącznie JSON: {"corrected": "...", "confidence": 0.0-1.0}'
)


def _tidy_transcript(text: str) -> str:
    """Poprawka bez LLM: wielka litera na początku, kropka na końcu, bez spacji przed interpunkcją."""
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    if not text:
        return text
    text = text[0].upper() + text[1:]
    return text if text[-1] in ".!?…" else f"{text}."


VOICE_CONDENSE_PROMPT = (
    "Dostajesz transkrypcję mowy po polsku: ktoś opisuje problem społeczny, często chaotycznie, z dygresjami, "
    "powtórzeniami i wtrąceniami. Popraw gramatykę i błędy rozpoznawania mowy, a jeśli wypowiedź krąży wokół tematu, "
    "streść ją do sedna: kogo dotyczy problem, co się dzieje, gdzie — 1–2 krótkie zdania, najwyżej 40 słów. "
    "Zawsze usuń wtrącenia bez treści, np. „yyy”, „no”, „ten no”, „tak jakby”, „jakby”, „wiesz”, „w sumie”. "
    "Pisz z perspektywy mówiącego, jego słowami. NIE dodawaj informacji, których nie było, NIE oceniaj. "
    "Krótkiej i rzeczowej wypowiedzi nie skracaj, tylko popraw. "
    'Odpowiedz wyłącznie JSON: {"corrected": "...", "condensed": true|false, "confidence": 0.0-1.0}'
)


def _local_fix(transcript: str, condense: bool) -> dict:
    condensed = False
    if condense:
        transcript, condensed = condense_locally(transcript)
    # Wtrącenia („ten no tak jakby”, „yyy”) wypadają zawsze, także z krótkich wypowiedzi.
    transcript = strip_fillers(transcript) or transcript
    return {"corrected": _tidy_transcript(transcript), "condensed": condensed, "confidence": 0.6, "source": "rules"}


@router.post("/voice-fix")
async def voice_fix(body: VoiceFixRequest):
    transcript = body.transcript.strip()[:MAX_TEXT]
    llm_chat = _llm_chat()
    if not transcript:
        return _ok({"corrected": transcript, "condensed": False, "confidence": 1.0, "source": "none"})
    if llm_chat is None:
        return _ok(_local_fix(transcript, body.condense))

    try:
        raw = await llm_chat(
            [
                {"role": "system", "content": VOICE_CONDENSE_PROMPT if body.condense else VOICE_FIX_PROMPT},
                {"role": "user", "content": transcript},
            ]
        )
        parsed = _parse_json_object(raw)
        corrected = (parsed.get("corrected") or transcript).strip()
        return _ok(
            {
                "corrected": corrected,
                "condensed": bool(parsed.get("condensed")) and len(corrected.split()) < len(transcript.split()),
                "confidence": float(parsed.get("confidence", 0.8)),
                "source": "llm",
            }
        )
    except Exception:
        log.exception("voice-fix failed")
        return _ok({**_local_fix(transcript, body.condense), "confidence": 0.5})


CHAT_SYSTEM_PROMPT = (
    "Jesteś asystentem platformy HubMI.pl, która łączy mieszkańców, NGO i urzędników z Małopolski "
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
            f"### {i['title']}\n{i['short_desc']}\n{i.get('full_desc') or ''}\n"
            f"Grupa docelowa: {i.get('target_group')} | Koszt: {i.get('cost_level')} | "
            f"Czas wdrożenia: {i.get('implementation_time_months')} mies. | "
            f"Gdzie wdrożono: {i.get('where_implemented')}"
            + (" | UWAGA: innowacja nieaktualna" if i.get("is_unmaintained") else "")
        )
    return "\n\n".join(parts)


@router.post("/chat")
async def chat(body: ChatRequest):
    async def gen() -> AsyncIterator[str]:
        ids = set(body.innovation_ids)
        innovations = [i for i in await _catalog() if i["id"] in ids] if ids else []

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

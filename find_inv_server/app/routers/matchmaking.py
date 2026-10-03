"""Matchmaking społeczny — autotagger, dopasowanie innowacji, voice-fix, RAG chat.

Do czasu Push 2 od A1 (llm.py / embeddings.py / utils.py) i seedu od A3 endpointy
zwracają mocki z data/mock_data.py. Gdy moduły pojawią się na main, router sam
przełącza się na realne wywołania — interfejs odpowiedzi zostaje ten sam.
"""

import inspect
import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.local_matching import local_tag_result, rank_locally
from data.mock_data import MOCK_INNOVATIONS

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["matchmaking"])

try:
    from app import llm
    from app.embeddings import similarity_search
    from app.utils import TAXONOMY_TAGS, run_autotagger

    REAL_BACKEND = True
except ImportError:
    REAL_BACKEND = False

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


class VoiceFixRequest(BaseModel):
    transcript: str


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    innovation_ids: list[int] = Field(default_factory=list)


# ── Pomocnicze ───────────────────────────────────────────


def _ok(data):
    return {"data": data, "error": None}


def _err(msg: str):
    return {"data": None, "error": msg}


def _sse(chunk: str) -> str:
    # Wieloliniowy chunk → kilka linii "data:" (zgodnie ze specyfikacją SSE klient skleja je "\n").
    return "".join(f"data: {line}\n" for line in chunk.split("\n")) + "\n"


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


def _local_match(text: str, tags: list[str]) -> dict:
    """Ranking bez embeddingów: na mockach, dopóki A3 nie zaseeduje bazy."""
    ranked = rank_locally(text, tags, MOCK_INNOVATIONS)
    return {"innovations": ranked[:TOP_N], "total_found": len(ranked)}


# ── Endpointy ────────────────────────────────────────────


@router.post("/tag")
async def tag(body: TagRequest, background: BackgroundTasks):
    text = body.text.strip()[:MAX_TEXT]
    if not text:
        return _err("Pusty opis problemu")
    if not REAL_BACKEND:
        return _ok(local_tag_result(text))

    try:
        result = await run_autotagger(text)
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
    if not REAL_BACKEND:
        result = _local_match(text, body.tags)
        background.add_task(_log_search_zasobnik, text, result["total_found"])
        return _ok(result)

    try:
        results = await similarity_search(text, n_results=50)
    except Exception:
        log.exception("similarity_search failed, using local ranking")
        return _ok(_local_match(text, body.tags))

    score_map = {r["id"]: r["score"] for r in results}
    innovations = await _fetch_innovations(lambda I: I.embedding_id.in_(list(score_map)))
    if not innovations:  # brak seedu od A3 → mocki, żeby demo działało
        return _ok(_local_match(text, body.tags))

    query_tags = set(body.tags)
    for innov in innovations:
        cosine = score_map.get(innov["embedding_id"], 0.0)
        innov["match_score"] = round(cosine + TAG_BOOST * len(set(innov["tags"]) & query_tags), 4)
    innovations.sort(key=lambda i: i["match_score"], reverse=True)
    return _ok({"innovations": innovations[:TOP_N], "total_found": len(innovations)})


VOICE_FIX_PROMPT = (
    "Poprawiasz transkrypcję mowy po polsku. Popraw gramatykę, interpunkcję i oczywiste błędy "
    "rozpoznawania mowy, NIE zmieniaj sensu ani nie dopisuj treści. "
    'Odpowiedz wyłącznie JSON: {"corrected": "...", "confidence": 0.0-1.0}'
)


@router.post("/voice-fix")
async def voice_fix(body: VoiceFixRequest):
    transcript = body.transcript.strip()[:MAX_TEXT]
    if not REAL_BACKEND or not transcript:
        return _ok({"corrected": transcript, "confidence": 1.0})

    try:
        raw = await llm.chat(
            [
                {"role": "system", "content": VOICE_FIX_PROMPT},
                {"role": "user", "content": transcript},
            ]
        )
        parsed = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
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
        if not REAL_BACKEND:
            yield _sse("Oto przykładowa odpowiedź o innowacjach społecznych.")
            yield "data: [DONE]\n\n"
            return

        ids = body.innovation_ids
        innovations = await _fetch_innovations(lambda I: I.id.in_(ids)) if ids else []
        if not innovations and ids:
            innovations = [i for i in MOCK_INNOVATIONS if i["id"] in ids]

        messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT.format(context=_rag_context(innovations))}]
        history = [m for m in body.messages if m.role in ("user", "assistant")][-MAX_CHAT_MESSAGES:]
        messages += [{"role": m.role, "content": m.content[:MAX_TEXT]} for m in history]
        try:
            stream = llm.chat(messages, stream=True)
            if inspect.isawaitable(stream):
                stream = await stream
            async for chunk in stream:
                if chunk:
                    yield _sse(chunk)
        except Exception:
            log.exception("chat stream failed")
            yield _sse("Przepraszam, asystent jest chwilowo niedostępny.")
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

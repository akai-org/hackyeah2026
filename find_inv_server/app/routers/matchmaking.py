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

from data.mock_data import MOCK_INNOVATIONS, MOCK_TAG_RESPONSE

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
    try:
        from app.database import SessionLocal
        from app.models import SearchLog

        async with SessionLocal() as db:
            db.add(SearchLog(query=query, tags=json.dumps(tags, ensure_ascii=False)))
            await db.commit()
    except Exception:  # logowanie trendów nie może psuć odpowiedzi
        log.exception("search_logs insert failed")


def _mock_match(tags: list[str]) -> list[dict]:
    query_tags = set(tags)
    ranked = sorted(
        MOCK_INNOVATIONS,
        key=lambda i: i["match_score"] + TAG_BOOST * len(set(i["tags"]) & query_tags),
        reverse=True,
    )
    return ranked[:TOP_N]


# ── Endpointy ────────────────────────────────────────────


@router.post("/tag")
async def tag(body: TagRequest, background: BackgroundTasks):
    text = body.text.strip()
    if not text:
        return _err("Pusty opis problemu")
    if not REAL_BACKEND:
        return _ok(MOCK_TAG_RESPONSE)

    try:
        result = await run_autotagger(text)
    except Exception:
        log.exception("autotagger failed")
        return _err("Nie udało się przeanalizować opisu")
    result["tags"] = [t for t in result.get("tags", []) if t in TAXONOMY_TAGS]
    background.add_task(_log_search, text, result["tags"])
    return _ok(result)


@router.post("/match")
async def match(body: MatchRequest):
    text = body.text.strip()
    if not text:
        return _err("Pusty opis problemu")
    if not REAL_BACKEND:
        innovations = _mock_match(body.tags)
        return _ok({"innovations": innovations, "total_found": len(innovations)})

    try:
        results = await similarity_search(text, n_results=50)
    except Exception:
        log.exception("similarity_search failed")
        return _err("Wyszukiwanie chwilowo niedostępne")

    score_map = {r["id"]: r["score"] for r in results}
    innovations = await _fetch_innovations(lambda I: I.embedding_id.in_(list(score_map)))
    if not innovations:  # brak seedu od A3 → mocki, żeby demo działało
        innovations = _mock_match(body.tags)
        return _ok({"innovations": innovations, "total_found": len(innovations)})

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
    transcript = body.transcript.strip()
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
        messages += [m.model_dump() for m in body.messages if m.role in ("user", "assistant")]
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

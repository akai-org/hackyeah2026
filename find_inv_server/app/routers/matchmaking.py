import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from data.mock_data import MOCK_INNOVATIONS, MOCK_TAG_RESPONSE

router = APIRouter(prefix="/api", tags=["matchmaking"])


@router.post("/tag")
async def tag(body: dict):
    try:
        from app.utils import run_autotagger
        from app.database import get_db
        from app.models import SearchLog
        result = await run_autotagger(body.get("text", ""))
        asyncio.create_task(_log_search(body.get("text", ""), result))
        return {"data": result}
    except Exception:
        return {"data": MOCK_TAG_RESPONSE}


async def _log_search(query: str, tag_result: dict):
    try:
        async with get_db() as db:
            log = SearchLog(
                query=query,
                tags=json.dumps(tag_result.get("tags", []), ensure_ascii=False),
                results_count=5,
            )
            db.add(log)
            await db.commit()
    except Exception:
        pass


@router.post("/match")
async def match(body: dict):
    try:
        from app.embeddings import similarity_search
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select

        text = body.get("text", "")
        query_tags = set(body.get("tags", []))

        results = await similarity_search(text, n_results=50)
        if not results:
            raise ValueError("no results — ChromaDB empty, fall to mock")

        ids = [r["id"] for r in results]
        score_map = {r["id"]: r["score"] for r in results}

        async with get_db() as db:
            rows = await db.execute(
                select(Innovation).where(Innovation.embedding_id.in_(ids))
            )
            innovations = rows.scalars().all()

        ranked = []
        for innov in innovations:
            innov_tags = set(innov.tags_list())
            score = score_map.get(innov.embedding_id, 0) + 0.1 * len(innov_tags & query_tags)
            ranked.append({
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
                "match_score": round(score, 4),
                "is_unmaintained": innov.status == "unmaintained",
            })

        ranked.sort(key=lambda x: x["match_score"], reverse=True)
        return {"data": {"innovations": ranked[:5], "total_found": len(ranked)}}

    except Exception:
        # ChromaDB empty or error — tag-based fallback from SQLite
        try:
            from app.database import get_db
            from app.models import Innovation
            from sqlalchemy import select

            query_tags = set(body.get("tags", []))
            async with get_db() as db:
                rows = await db.execute(select(Innovation).limit(100))
                all_items = rows.scalars().all()

            if not all_items:
                raise ValueError("empty DB")

            text_lower = text.lower()
            words = [w for w in text_lower.split() if len(w) > 2]

            ranked = []
            for innov in all_items:
                innov_tags = set(innov.tags_list())
                tag_score = len(innov_tags & query_tags) * 0.15

                haystack = f"{innov.title} {innov.short_desc or ''} {innov.full_desc or ''}".lower()
                text_hits = sum(1 for w in words if w in haystack)
                text_score = min(text_hits * 0.08, 0.4)

                ranked.append({
                    "id": innov.id, "title": innov.title, "short_desc": innov.short_desc,
                    "full_desc": innov.full_desc, "category": innov.category, "area": innov.area,
                    "target_group": innov.target_group, "location": innov.location, "status": innov.status,
                    "cost_level": innov.cost_level, "implementation_time_months": innov.implementation_time_months,
                    "testers_count": innov.testers_count, "where_implemented": innov.where_implemented,
                    "source_url": innov.source_url, "tags": innov.tags_list(),
                    "match_score": round(0.4 + tag_score + text_score, 4),
                    "is_unmaintained": innov.status == "unmaintained",
                })

            ranked.sort(key=lambda x: (-x["match_score"], x["title"]))
            return {"data": {"innovations": ranked[:5], "total_found": len(ranked)}}

        except Exception:
            mock = [dict(i, is_unmaintained=i.get("status") == "unmaintained") for i in MOCK_INNOVATIONS]
            return {"data": {"innovations": mock[:5], "total_found": len(mock)}}


@router.post("/voice-fix")
async def voice_fix(body: dict):
    transcript = body.get("transcript", "")
    try:
        from app.llm import chat
        fixed = await chat(
            messages=[
                {
                    "role": "system",
                    "content": "Popraw gramatykę i interpunkcję poniższego tekstu po polsku. Zwróć TYLKO poprawiony tekst, bez komentarzy.",
                },
                {"role": "user", "content": transcript},
            ]
        )
        return {"data": {"corrected": fixed, "confidence": 0.9}}
    except Exception:
        return {"data": {"corrected": transcript, "confidence": 1.0}}


@router.post("/chat")
async def chat_endpoint(body: dict):
    async def mock_gen():
        yield "data: Oto przykładowe innowacje dopasowane do Twojego problemu.\n\n"
        await asyncio.sleep(0.05)
        yield "data: Możesz zapytać o szczegóły każdej z nich.\n\n"
        yield "data: [DONE]\n\n"

    try:
        from app.llm import chat as llm_chat
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select

        messages = body.get("messages", [])
        innovation_ids = [str(i) for i in body.get("innovation_ids", [])]

        context = ""
        if innovation_ids:
            async with get_db() as db:
                rows = await db.execute(
                    select(Innovation).where(Innovation.id.in_([int(i) for i in innovation_ids if i.isdigit()]))
                )
                innovations = rows.scalars().all()
                parts = [f"### {inn.title}\n{inn.full_desc or inn.short_desc}" for inn in innovations]
                context = "\n\n".join(parts)

        system = (
            "Jesteś asystentem platformy HubMI.pl — pomagasz znaleźć odpowiednie innowacje społeczne z Małopolski.\n"
            + (f"Kontekst — innowacje pokazane użytkownikowi:\n\n{context}" if context else "")
        )

        all_messages = [{"role": "system", "content": system}] + messages

        async def gen():
            gen_obj = await llm_chat(all_messages, stream=True)
            async for chunk in gen_obj:
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(gen(), media_type="text/event-stream")

    except Exception:
        return StreamingResponse(mock_gen(), media_type="text/event-stream")

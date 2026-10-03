import asyncio
import json
import uuid

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/middleman", tags=["middleman"])

MOCK_PLAN = {
    "type": "plan",
    "content": {
        "staff_needed": "1 koordynator (0.5 etatu) + 3-5 wolontariuszy",
        "estimated_cost": "5–10 tys. zł rocznie",
        "location_suggestions": "Dom Kultury, biblioteka gminna lub świetlica wiejska",
        "steps": [
            "Rekrutacja i szkolenie koordynatora (tydzień 1-2)",
            "Rekrutacja wolontariuszy z lokalnej społeczności (tydzień 3-4)",
            "Kampania informacyjna w gminie (tydzień 5-6)",
            "Pilotaż z pierwszą grupą beneficjentów (miesiąc 2-3)",
            "Ewaluacja i rozszerzenie programu (miesiąc 3-4)",
        ],
        "timeline": "3-4 miesiące do pełnego uruchomienia",
        "funding_hints": "PFRON (niepełnosprawność), FIO (NGO), EFS+ (aktywizacja), budżet gminy",
    },
}


@router.post("/start")
async def start(body: dict):
    try:
        from app.database import get_db
        from app.models import Innovation
        from sqlalchemy import select
        from app.llm import chat

        innovation_id = body.get("innovation_id")
        problem_desc = body.get("problem_desc", "")
        session_id = str(uuid.uuid4())

        async with get_db() as db:
            row = await db.execute(select(Innovation).where(Innovation.id == int(innovation_id)))
            inn = row.scalar_one_or_none()

        if inn is None:
            raise ValueError("not found")

        system = (
            "Jesteś ekspertem od wdrażania innowacji społecznych w Polsce. "
            "Znasz realia małych gmin, OPS i NGO. "
            "Zadajesz MAX 3 krótkie, praktyczne pytania zanim dajesz konkretny plan. "
            "Bądź konkretny — podaj realne koszty i źródła finansowania."
        )
        first_q = await chat([
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                    f"Innowacja: {inn.title}\n{inn.full_desc or inn.short_desc}\n\n"
                    f"Problem instytucji: {problem_desc}\n\n"
                    "Zadaj pierwsze pytanie, żeby lepiej dopasować plan wdrożenia."
                ),
            },
        ])
        return {"data": {"session_id": session_id, "first_question": first_q}}

    except Exception:
        return {"data": {
            "session_id": str(uuid.uuid4()),
            "first_question": "Ile osób zatrudnia Wasza instytucja i jakim budżetem rocznym dysponujecie na nowe projekty?",
        }}


@router.post("/answer")
async def answer(body: dict):
    async def mock_gen():
        await asyncio.sleep(0.1)
        yield f"data: {json.dumps(MOCK_PLAN, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    try:
        from app.llm import chat

        messages = body.get("messages", [])
        answer_text = body.get("answer", "")
        if not messages:
            raise ValueError("no messages")

        if answer_text:
            messages = messages + [{"role": "user", "content": answer_text}]

        system = (
            "Jesteś ekspertem od wdrażania innowacji społecznych w Polsce. "
            "Na podstawie rozmowy zadajesz MAX 3 krótkie pytania. "
            "Gdy masz wystarczająco informacji (po 1-3 wymianach), odpowiedz TYLKO obiektem JSON:\n"
            '{"type":"plan","content":{"staff_needed":"...","estimated_cost":"...","location_suggestions":"...",'
            '"steps":["..."],"timeline":"...","funding_hints":"..."}}\n'
            "Jeśli potrzebujesz jeszcze informacji, zadaj kolejne pytanie jako zwykły tekst."
        )

        all_messages = [{"role": "system", "content": system}] + messages

        async def real_gen():
            gen_obj = await chat(all_messages, stream=True)
            async for chunk in gen_obj:
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(real_gen(), media_type="text/event-stream")

    except Exception:
        return StreamingResponse(mock_gen(), media_type="text/event-stream")

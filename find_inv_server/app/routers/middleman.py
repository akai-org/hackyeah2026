"""Middleman AI (A5): zamienia innowację w konkretny plan wdrożenia dla instytucji.

Przebieg: /start → pierwsze pytanie; /answer (SSE) → kolejne pytanie albo plan.
Maks. 3 pytania, potem zawsze plan. Klient może poprosić o plan wcześniej (`finish: true`).

Zdarzenia SSE (każde `data:` to JSON, koniec `data: [DONE]`):
  {"type": "delta",    "content": "fragment tekstu"}          ← pisanie na żywo
  {"type": "question", "content": "pełne pytanie", "index": 2, "max_questions": 3}
  {"type": "plan",     "content": { ...PLAN... }}
  {"type": "error",    "content": "komunikat"}

Bez klucza OPENROUTER_API_KEY albo przy błędzie LLM działa lokalny generator planu z danych
innowacji i odpowiedzi użytkownika, więc demo nie staje.
"""

import asyncio
import json
import logging
import re
import uuid
from collections import OrderedDict
from typing import AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.analytics import as_int, log_event
from data.mock_data import MOCK_INNOVATIONS

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/middleman", tags=["middleman"])

try:  # A1 Push 2 — bez klucza OpenRouter od razu tryb lokalny (bez tracebacku przy każdym pytaniu)
    from app import llm
    from app.config import settings

    if not settings.openrouter_api_key:
        llm = None
except ImportError:
    llm = None

MAX_QUESTIONS = 3
MAX_SESSIONS = 500
MAX_ANSWER = 1500

SYSTEM_PROMPT = (
    "Jesteś ekspertem od wdrażania innowacji społecznych w Polsce. Znasz realia małych gmin, "
    "OPS i NGO. Zadajesz MAX 3 krótkie pytania zanim dajesz konkretny plan w formacie JSON. "
    "Bądź praktyczny i konkretny — podaj realne koszty, źródła finansowania (PFRON, FIO, EFS+)."
)

FORMAT_PROMPT = """Odpowiadasz WYŁĄCZNIE jednym obiektem JSON, bez markdown.
Jeśli potrzebujesz jeszcze informacji (i zadano mniej niż 3 pytania):
{"type": "question", "content": "jedno krótkie pytanie po polsku"}
W przeciwnym razie plan:
{"type": "plan", "content": {
  "goal": "cel w 1 zdaniu",
  "staff_needed": "kto realizuje",
  "estimated_cost": "np. 8–12 tys. zł rocznie",
  "location_suggestions": "gdzie zorganizować",
  "steps": ["krok 1", "krok 2", "..."],
  "phases": [{"label": "Pierwsze 30 dni", "items": ["..."]}, {"label": "Dni 31–60", "items": ["..."]}, {"label": "Dni 61–90", "items": ["..."]}],
  "timeline": "np. 3 miesiące do startu",
  "funding_hints": "konkretne programy i źródła",
  "risks": ["ryzyko i jak mu zapobiec"],
  "missing": ["czego jeszcze brakuje do decyzji"]
}}"""


# ── Sesje (w pamięci, wystarczy na demo) ─────────────────

_sessions: "OrderedDict[str, dict]" = OrderedDict()


def _save_session(session: dict) -> None:
    _sessions[session["id"]] = session
    _sessions.move_to_end(session["id"])
    while len(_sessions) > MAX_SESSIONS:
        _sessions.popitem(last=False)


# ── Schematy ─────────────────────────────────────────────


class StartRequest(BaseModel):
    innovation_id: int | str | None = None
    problem_desc: str = ""
    institution: str | None = None  # np. "GOPS w gminie wiejskiej"
    institution_type: str | None = None  # front A4: "Gmina wiejska", "Ośrodek pomocy społecznej"…
    location: str | None = None  # miejscowość / gmina
    # Front może dosłać opis, gdy innowacja nie pochodzi z bazy (np. mock frontendu).
    innovation_title: str | None = None
    innovation_desc: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str = ""


class AnswerRequest(BaseModel):
    session_id: str | None = None
    answer: str = ""
    finish: bool = False  # „Pokaż plan teraz” — bez kolejnych pytań
    # Bez session_id (np. po restarcie serwera) sesję odtwarzamy z historii rozmowy frontu.
    innovation_id: int | str | None = None
    messages: list[ChatMessage] = Field(default_factory=list)


# ── Pomocnicze ───────────────────────────────────────────


def _ok(data):
    return {"data": data, "error": None}


def _err(msg: str):
    return {"data": None, "error": msg}


def _event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _innovation_to_dict(row) -> dict:
    try:
        tags = json.loads(row.tags or "[]")
    except (TypeError, json.JSONDecodeError):
        tags = []
    return {
        "id": row.id,
        "title": row.title,
        "short_desc": row.short_desc,
        "full_desc": row.full_desc,
        "target_group": row.target_group,
        "cost_level": row.cost_level,
        "implementation_time_months": row.implementation_time_months,
        "where_implemented": row.where_implemented,
        "tags": tags,
    }


async def _load_innovation(innovation_id: int) -> dict | None:
    """Innowacja z SQLite (A1/A3); przy pustej bazie albo błędzie — wspólne mocki."""
    try:
        from sqlalchemy import select

        from app.database import get_db
        from app.models import Innovation

        async with get_db() as db:
            row = (await db.execute(select(Innovation).where(Innovation.id == innovation_id))).scalar_one_or_none()
        if row is not None:
            return _innovation_to_dict(row)
    except Exception:  # noqa: BLE001 — baza niedostępna → mocki, demo musi działać
        log.exception("Middleman: nie udało się wczytać innowacji %s z bazy", innovation_id)
    return next((dict(i) for i in MOCK_INNOVATIONS if i["id"] == innovation_id), None)


async def _find_innovation(body: StartRequest) -> dict:
    try:
        wanted = int(body.innovation_id) if body.innovation_id is not None else None
    except (TypeError, ValueError):
        wanted = None
    found = await _load_innovation(wanted) if wanted is not None else None
    if found:
        return found
    title = body.innovation_title or "Innowacja społeczna"
    desc = body.innovation_desc or ""
    return {
        "id": body.innovation_id,
        "title": title,
        "short_desc": desc,
        "full_desc": desc,
        "target_group": "",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "where_implemented": "",
        "tags": [],
    }


def _innovation_brief(innov: dict) -> str:
    parts = [
        f"Tytuł: {innov.get('title')}",
        f"Opis: {innov.get('full_desc') or innov.get('short_desc')}",
        f"Grupa docelowa: {innov.get('target_group') or 'brak danych'}",
        f"Poziom kosztów: {innov.get('cost_level') or 'brak danych'}",
        f"Czas wdrożenia (mies.): {innov.get('implementation_time_months') or 'brak danych'}",
        f"Gdzie wdrożono: {innov.get('where_implemented') or 'brak danych'}",
    ]
    return "\n".join(parts)


async def _type_out(text: str) -> AsyncIterator[str]:
    """Wysyła tekst kawałkami po słowach — efekt pisania na żywo."""
    words = re.findall(r"\S+\s*", text)
    for i in range(0, len(words), 2):
        yield _event({"type": "delta", "content": "".join(words[i : i + 2])})
        await asyncio.sleep(0.03)


# ── Lokalny Middleman (bez LLM) ──────────────────────────

_QUESTION_TEMPLATES = [
    "Jaka instytucja chce wdrożyć „{title}” i ile osób z zespołu może się tym zająć (choćby na część etatu)?",
    "Jakim budżetem dysponujecie na pierwszy rok i czy macie już partnera, np. NGO, bibliotekę albo szkołę?",
    "Ile osób z grupy „{target}” chcecie objąć na start i czy macie salę albo inne miejsce na spotkania?",
]


def _local_question(session: dict, index: int) -> str:
    innov = session["innovation"]
    template = _QUESTION_TEMPLATES[min(index, len(_QUESTION_TEMPLATES)) - 1]
    target = innov.get("target_group") or "odbiorców"
    return template.format(title=innov.get("title", "tej innowacji"), target=target)


_COST = {
    "low": ("3–8 tys. zł rocznie", "materiały, poczęstunek, ubezpieczenie wolontariuszy, drobne dojazdy"),
    "medium": ("15–40 tys. zł rocznie", "część etatu koordynatora, wynajem sali, sprzęt, promocja"),
    "high": ("80–200 tys. zł rocznie", "etaty specjalistów, adaptacja lokalu, transport, szkolenia"),
}


def _parse_people(text: str) -> int | None:
    match = re.search(r"\d+", text)
    return int(match.group()) if match else None


def _funding(tags: set[str]) -> str:
    hints = []
    if tags & {"niepełnosprawność", "dostępność"}:
        hints.append("PFRON (program „Aktywny samorząd”, zadania zlecane)")
    if "seniorzy" in tags:
        hints.append("program „Senior+” (moduł Klub Senior+)")
    if tags & {"dzieci", "młodzież", "rodzina"}:
        hints.append("Fundusz Pomocy, programy MRPiPS dla rodzin")
    if tags & {"wykluczenie_cyfrowe", "edukacja"}:
        hints.append("FEM 2021–2027 (EFS+, oś włączenia społecznego)")
    hints.append("FIO — Fundusz Inicjatyw Obywatelskich (przez partnera NGO)")
    hints.append("budżet gminy: zadanie w Gminnej Strategii Rozwiązywania Problemów Społecznych")
    return "; ".join(hints)


def _local_plan(session: dict) -> dict:
    innov = session["innovation"]
    answers = [a for a in session["answers"] if a.strip()]
    institution = (session.get("institution") or "").lower()
    place = session.get("location") or ""
    joined = " ".join(answers + [institution]).lower()
    tags = set(innov.get("tags") or [])
    cost_range, cost_items = _COST.get(innov.get("cost_level") or "medium", _COST["medium"])
    months = innov.get("implementation_time_months") or 3
    title = innov.get("title", "innowacji")
    target = innov.get("target_group") or "odbiorców"
    rural = "gmin" in joined and "wiej" in joined or "gmina_wiejska" in tags or "wieś" in joined or "wsi" in joined

    has_partner = any(word in joined for word in ("ngo", "fundacj", "stowarzysz", "bibliotek", "szkoł", "kgw", "koło gospodyń", "parafi"))
    has_room = any(word in joined for word in ("sala", "salę", "świetlic", "dom kultury", "gok", "bibliotek", "lokal"))
    people = _parse_people(answers[2]) if len(answers) >= 3 else None

    staff = "1 koordynator (ok. 1/4 etatu, np. pracownik socjalny OPS) + 4–6 przeszkolonych wolontariuszy"
    if innov.get("cost_level") == "high":
        staff = "koordynator na 1/2 etatu + 2 specjalistów (umowy zlecenia) + wolontariusze wspierający"

    location = (
        "Świetlica wiejska, remiza OSP albo filia biblioteki — blisko przystanku, bez barier architektonicznych"
        if rural
        else "Dom kultury, biblioteka albo klub seniora — parter, dostęp dla wózków, dobra komunikacja"
    )
    if place:
        location = f"{place}: " + location[0].lower() + location[1:]
    if has_room:
        location += ". Wasze miejsce sprawdźcie przed startem: próg, toaleta, dojazd"

    missing = []
    if not has_partner:
        missing.append("partner lokalny (NGO, KGW, biblioteka) — ułatwia wniosek do FIO")
    if people is None:
        missing.append("liczba uczestników na start — potrzebna do budżetu")
    if not re.search(r"\d", joined):
        missing.append("dokładny budżet na pierwszy rok")
    missing.append("uchwała lub zarządzenie wójta/burmistrza, jeśli zadanie ma iść z budżetu gminy")

    return {
        "goal": f"Uruchomić „{title}” dla grupy: {target}"
        + (f" — na start ok. {people} osób" if people else "")
        + (f" ({place})" if place else "")
        + f", z pierwszymi zajęciami w ciągu {months} mies.",
        "staff_needed": staff,
        "estimated_cost": f"{cost_range} ({cost_items})",
        "location_suggestions": location,
        "steps": [
            "Zgoda kierownika i wpisanie zadania do planu pracy instytucji",
            "Wybór koordynatora i partnera lokalnego",
            "Rekrutacja i szkolenie wolontariuszy / zespołu",
            "Dotarcie do odbiorców: sołtysi, parafia, przychodnia, plakaty",
            "Pilotaż z małą grupą i zebranie opinii",
            "Ocena po 3 miesiącach i decyzja o stałym finansowaniu",
        ],
        "phases": [
            {"label": "Pierwsze 30 dni", "items": ["Zgoda i zespół", "Partner i miejsce", "Wniosek o dofinansowanie (jeśli jest nabór)"]},
            {"label": "Dni 31–60", "items": ["Szkolenie zespołu", "Rekrutacja uczestników", "Pierwsze spotkania pilotażowe"]},
            {"label": "Dni 61–90", "items": ["Pilotaż w pełnym zakresie", "Ankieta wśród uczestników", "Raport dla wójta i ROPS"]},
        ],
        "timeline": f"start po {months} mies., ocena pilotażu po 90 dniach",
        "funding_hints": _funding(tags),
        "risks": [
            "Wypalenie wolontariuszy — grafik dyżurów i spotkanie raz w miesiącu",
            "Niska frekwencja na starcie — osobiste zaproszenia przez sołtysa i pracownika socjalnego",
            "Brak ciągłości po grancie — wpisz zadanie do gminnej strategii już na etapie pilotażu",
        ],
        "missing": missing,
        "source": {"innovation_id": innov.get("id"), "title": title, "where_implemented": innov.get("where_implemented")},
    }


# ── LLM (po Push 2 od A1) ────────────────────────────────


def _parse_llm_json(text: str) -> dict | None:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        return None
    if data.get("type") in ("question", "plan") and data.get("content"):
        return data
    return None


def _llm_messages(session: dict, force_plan: bool) -> list[dict]:
    innov = session["innovation"]
    context = (
        f"Innowacja z Biblioteki ROPS:\n{_innovation_brief(innov)}\n\n"
        f"Problem / potrzeba instytucji: {session['problem'] or 'nie podano'}\n"
        f"Instytucja: {session['institution'] or 'nie podano'}\n"
        f"Miejscowość: {session.get('location') or 'nie podano'}"
    )
    messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n\n" + FORMAT_PROMPT}, {"role": "user", "content": context}]
    for question, answer in zip(session["questions"], session["answers"]):
        messages.append({"role": "assistant", "content": json.dumps({"type": "question", "content": question}, ensure_ascii=False)})
        messages.append({"role": "user", "content": answer or "(brak odpowiedzi)"})
    if force_plan:
        messages.append({"role": "user", "content": "Wystarczy pytań. Podaj teraz finalny plan (type=plan)."})
    return messages


async def _llm_step(session: dict, force_plan: bool) -> dict | None:
    if llm is None:
        return None
    try:
        reply = await llm.chat(_llm_messages(session, force_plan))
    except Exception:  # noqa: BLE001 — każdy błąd LLM → lokalny plan, demo musi działać
        log.exception("Middleman: LLM niedostępny, używam lokalnego planu")
        return None
    data = _parse_llm_json(reply if isinstance(reply, str) else str(reply))
    if data and force_plan and data["type"] != "plan":
        return None
    return data


async def _session_from_messages(body: AnswerRequest) -> dict:
    """Odtwarza sesję z historii czatu (pytania asystenta / odpowiedzi użytkownika).

    Ostatnia wiadomość użytkownika to bieżąca odpowiedź — /answer dopisze ją sam.
    """
    history = [m for m in body.messages if m.content.strip()]
    if history and history[-1].role == "user":
        history = history[:-1]
    innov = await _find_innovation(StartRequest(innovation_id=body.innovation_id))
    session = {
        "id": str(uuid.uuid4()),
        "innovation": innov,
        "problem": "",
        "institution": "",
        "location": "",
        "questions": [m.content for m in history if m.role == "assistant"][:MAX_QUESTIONS],
        "answers": [m.content[:MAX_ANSWER] for m in history if m.role == "user"],
        "plan": None,
    }
    if not session["questions"]:
        session["questions"].append(_local_question(session, 1))
    _save_session(session)
    return session


# ── Endpointy ────────────────────────────────────────────


@router.post("/start")
async def start(body: StartRequest):
    innov = await _find_innovation(body)
    session = {
        "id": str(uuid.uuid4()),
        "innovation": innov,
        "problem": body.problem_desc.strip()[:MAX_ANSWER],
        "institution": (body.institution or body.institution_type or "").strip()[:200],
        "location": (body.location or "").strip()[:120],
        "questions": [],
        "answers": [],
        "plan": None,
    }

    step = await _llm_step(session, force_plan=False)
    question = step["content"] if step and step["type"] == "question" else _local_question(session, 1)
    session["questions"].append(question)
    _save_session(session)
    await log_event("middleman_start", as_int(innov.get("id")))

    return _ok(
        {
            "session_id": session["id"],
            "first_question": question,
            "question_index": 1,
            "max_questions": MAX_QUESTIONS,
            "innovation": {"id": innov.get("id"), "title": innov.get("title"), "short_desc": innov.get("short_desc")},
            "mode": "llm" if step else "local",
        }
    )


@router.post("/answer")
async def answer(body: AnswerRequest):
    session = _sessions.get(body.session_id) if body.session_id else None
    if session is None and body.messages:
        session = await _session_from_messages(body)

    async def gen() -> AsyncIterator[str]:
        if session is None:
            yield _event({"type": "error", "content": "Sesja wygasła. Zacznij od nowa."})
            yield "data: [DONE]\n\n"
            return

        if len(session["answers"]) < len(session["questions"]):
            session["answers"].append(body.answer.strip()[:MAX_ANSWER])
        force_plan = body.finish or len(session["questions"]) >= MAX_QUESTIONS

        step = await _llm_step(session, force_plan)
        if step is None:
            step = {"type": "plan", "content": _local_plan(session)} if force_plan else {
                "type": "question",
                "content": _local_question(session, len(session["questions"]) + 1),
            }
            await asyncio.sleep(0.4)  # lokalny tryb też „myśli” — spójny rytm z trybem LLM

        if step["type"] == "question":
            session["questions"].append(step["content"])
            async for chunk in _type_out(step["content"]):
                yield chunk
            yield _event(
                {"type": "question", "content": step["content"], "index": len(session["questions"]), "max_questions": MAX_QUESTIONS}
            )
        else:
            plan = step["content"]
            plan.setdefault("source", {"innovation_id": session["innovation"].get("id"), "title": session["innovation"].get("title")})
            session["plan"] = plan
            await log_event("middleman_plan", as_int(session["innovation"].get("id")))
            intro = "Mam wszystko, czego potrzebuję. Oto szkic planu wdrożenia."
            async for chunk in _type_out(intro):
                yield chunk
            yield _event({"type": "plan", "content": plan})
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if session is None:
        return _err("Sesja wygasła. Zacznij od nowa.")
    return _ok(
        {
            "session_id": session["id"],
            "innovation": {"id": session["innovation"].get("id"), "title": session["innovation"].get("title")},
            "questions": session["questions"],
            "answers": session["answers"],
            "plan": session["plan"],
        }
    )

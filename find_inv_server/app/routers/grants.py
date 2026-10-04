"""Generator wniosków grantowych: nabory z terminami, wypełnianie wniosku z fiszki i składanie wniosku.

GET  /api/grants                         → nabory (status upcoming|open|closed, terminy) z sekcjami wzoru wniosku
POST /api/grants/fill                    { grant_id, idea } → { grant_id, sections: {id: tekst}, missing: [id], source }
POST /api/grants/{grant_id}/applications { applicant_name, applicant_email, organization?, sections }
                                         → { id, grant_id, submitted_at } — TYLKO gdy nabór jest otwarty

Wniosek można złożyć wyłącznie w okresie naboru (opens_at ≤ teraz ≤ closes_at, pilnuje tego backend).
Przed otwarciem naboru wniosek da się przygotować i wydrukować, po zamknięciu — ani uzupełnić, ani złożyć.

`idea` to tekst opisu albo fiszka z kreatora ({title, short_desc, essence, problem, for_whom, place, stage,
budget, partners, tags}). Z kluczem OpenRouter sekcje pisze LLM (JSON mode), bez klucza albo przy błędzie —
szablon z pól fiszki. Wzory są uproszczone: przed złożeniem trzeba sprawdzić aktualny regulamin naboru.
"""

import json
import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.idea_analysis import analyze_locally
from app.models import GrantApplication

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/grants", tags=["grants"])

MAX_IDEA_TEXT = 6000

# Wzory wniosków. Każda sekcja: id, nazwa z formularza, podpowiedź, limit znaków, pola fiszki do szablonu bez LLM.
TEMPLATES: list[dict] = [
    {
        "id": "oferta-zadania-publicznego",
        "name": "Oferta realizacji zadania publicznego (otwarty konkurs ofert gminy lub powiatu)",
        "organizer": "Gmina, powiat lub samorząd województwa",
        "description": (
            "Uproszczony układ oferty według wzoru do ustawy o działalności pożytku publicznego i o wolontariacie. "
            "Tak wyglądają konkursy ofert ogłaszane przez gminy i powiaty dla organizacji pozarządowych."
        ),
        "source_url": None,
        "sections": [
            {"id": "tytul", "label": "Tytuł zadania publicznego", "hint": "Krótko i konkretnie, do 200 znaków.",
             "max_chars": 200, "fields": ["title"]},
            {"id": "opis", "label": "Syntetyczny opis zadania",
             "hint": "Co zrobicie, gdzie i jak. Grupa docelowa, sposób rozwiązania problemu, miejsce realizacji.",
             "max_chars": 3000, "fields": ["essence", "place"]},
            {"id": "potrzeby", "label": "Potrzeby i grupa docelowa",
             "hint": "Jaki problem rozwiązuje zadanie, kogo dotyczy i skąd o nim wiecie.",
             "max_chars": 1500, "fields": ["problem", "for_whom"]},
            {"id": "harmonogram", "label": "Plan i harmonogram działań",
             "hint": "Działania krok po kroku z terminami (np. miesiące realizacji).",
             "max_chars": 2000, "fields": []},
            {"id": "rezultaty", "label": "Zakładane rezultaty",
             "hint": "Co się zmieni dzięki zadaniu i jak to zmierzycie (np. liczba uczestników, spotkań).",
             "max_chars": 1500, "fields": []},
            {"id": "zasoby", "label": "Zasoby kadrowe, rzeczowe i partnerzy",
             "hint": "Kto poprowadzi zadanie, z kim współpracujecie, jakie macie miejsce i sprzęt.",
             "max_chars": 1000, "fields": ["partners", "stage"]},
            {"id": "koszty", "label": "Kalkulacja przewidywanych kosztów",
             "hint": "Główne pozycje kosztów i łączna kwota. Szczegóły wpiszecie w tabeli kosztów.",
             "max_chars": 1000, "fields": ["budget"]},
        ],
    },
    {
        "id": "mikrogrant-lokalny",
        "name": "Mikrogrant na inicjatywę lokalną",
        "organizer": "Fundusze lokalne, fundacje, programy mikrograntów",
        "description": (
            "Ogólny układ krótkiego wniosku o mikrogrant dla grupy nieformalnej lub małej organizacji. "
            "Pytania w konkretnych programach się różnią — dopasuj tekst do formularza naboru."
        ),
        "source_url": None,
        "sections": [
            {"id": "tytul", "label": "Nazwa inicjatywy", "hint": "Do 100 znaków.", "max_chars": 100,
             "fields": ["title"]},
            {"id": "problem", "label": "Jaką potrzebę odpowiada inicjatywa?",
             "hint": "Co chcecie zmienić w swojej okolicy i dlaczego to ważne.", "max_chars": 1000,
             "fields": ["problem", "short_desc"]},
            {"id": "odbiorcy", "label": "Kto skorzysta?", "hint": "Odbiorcy i ich przybliżona liczba.",
             "max_chars": 600, "fields": ["for_whom", "place"]},
            {"id": "dzialania", "label": "Co konkretnie zrobicie?", "hint": "Działania i terminy.",
             "max_chars": 1500, "fields": ["essence"]},
            {"id": "budzet", "label": "Na co przeznaczycie pieniądze?", "hint": "Główne wydatki i kwota.",
             "max_chars": 600, "fields": ["budget"]},
            {"id": "efekty", "label": "Jakie będą efekty?", "hint": "Co zostanie po inicjatywie.",
             "max_chars": 800, "fields": ["partners"]},
        ],
    },
]

_TEMPLATES_BY_ID = {template["id"]: template for template in TEMPLATES}

# Nabory: konkretne konkursy z terminami, każdy korzysta z jednego wzoru wniosku. To DANE PRZYKŁADOWE na demo
# (`demo: True` — front pokazuje to wprost); prawdziwe nabory dodawałby pracownik ROPS w panelu admina.
# Terminy z jawną strefą czasową (czas polski), koniec naboru = ostatnia sekunda dnia.
CALLS: list[dict] = [
    {
        "id": "konkurs-seniorzy-2027",
        "template": "oferta-zadania-publicznego",
        "name": "Otwarty konkurs ofert: aktywizacja i wsparcie seniorów w 2027 r.",
        "organizer": "Przykładowa gmina w Małopolsce",
        "opens_at": "2026-09-15T00:00:00+02:00",
        "closes_at": "2026-10-31T23:59:59+01:00",
        "demo": True,
    },
    {
        "id": "mikrogranty-jesien-2026",
        "template": "mikrogrant-lokalny",
        "name": "Mikrogranty na inicjatywy sąsiedzkie — edycja jesienna 2026",
        "organizer": "Przykładowy fundusz lokalny",
        "opens_at": "2026-09-01T00:00:00+02:00",
        "closes_at": "2026-10-20T23:59:59+02:00",
        "demo": True,
    },
    {
        "id": "konkurs-cyfrowe-wlaczenie-2027",
        "template": "oferta-zadania-publicznego",
        "name": "Otwarty konkurs ofert: przeciwdziałanie wykluczeniu cyfrowemu w 2027 r.",
        "organizer": "Przykładowy powiat w Małopolsce",
        "opens_at": "2026-11-16T00:00:00+01:00",
        "closes_at": "2026-12-14T23:59:59+01:00",
        "demo": True,
    },
    {
        "id": "mikrogranty-wiosna-2026",
        "template": "mikrogrant-lokalny",
        "name": "Mikrogranty na inicjatywy sąsiedzkie — edycja wiosenna 2026",
        "organizer": "Przykładowy fundusz lokalny",
        "opens_at": "2026-03-01T00:00:00+01:00",
        "closes_at": "2026-04-30T23:59:59+02:00",
        "demo": True,
    },
]

_CALLS_BY_ID = {call["id"]: call for call in CALLS}


def call_status(call: dict, now: datetime | None = None) -> str:
    """upcoming — przed otwarciem, open — przyjmuje wnioski, closed — po terminie."""
    now = now or datetime.now(timezone.utc)
    if now < datetime.fromisoformat(call["opens_at"]):
        return "upcoming"
    if now > datetime.fromisoformat(call["closes_at"]):
        return "closed"
    return "open"


def _template(call: dict) -> dict:
    return _TEMPLATES_BY_ID[call["template"]]

_FIELD_LABELS = {
    "title": "", "short_desc": "", "essence": "", "problem": "Problem", "for_whom": "Grupa docelowa",
    "place": "Miejsce realizacji", "stage": "Etap pomysłu", "budget": "Szacowany budżet", "partners": "Partnerzy",
}  # fmt: skip

# Szkielety sekcji, których nie da się wyczytać z fiszki — do uzupełnienia przez wnioskodawcę.
_SCAFFOLDS = {
    "harmonogram": (
        "1. Przygotowanie (miesiąc 1): [do uzupełnienia: rekrutacja uczestników, promocja, zakupy]\n"
        "2. Realizacja (miesiące 2–…): [do uzupełnienia: główne działania i ich częstotliwość]\n"
        "3. Podsumowanie (ostatni miesiąc): [do uzupełnienia: ewaluacja, sprawozdanie]"
    ),
    "rezultaty": "[do uzupełnienia: liczba uczestników, liczba spotkań, co zmieni się u odbiorców i jak to zmierzycie]",
}


class FillRequest(BaseModel):
    grant_id: str
    idea: str | dict


def _summary(call: dict, now: datetime) -> dict:
    template = _template(call)
    return {
        "id": call["id"],
        "name": call["name"],
        "organizer": call["organizer"],
        "opens_at": call["opens_at"],
        "closes_at": call["closes_at"],
        "status": call_status(call, now),
        "demo": call["demo"],
        "template": {key: template[key] for key in ("id", "name", "description", "source_url")},
        "sections": template["sections"],
    }


_STATUS_ORDER = {"open": 0, "upcoming": 1, "closed": 2}


@router.get("")
async def list_grants():
    """Najpierw otwarte (najbliższy termin na górze), potem nadchodzące, na końcu zakończone."""
    now = datetime.now(timezone.utc)
    calls = sorted(CALLS, key=lambda c: (_STATUS_ORDER[call_status(c, now)], datetime.fromisoformat(c["closes_at"])))
    return {"data": [_summary(call, now) for call in calls], "error": None}


def _idea_fields(idea: str | dict) -> tuple[dict, str]:
    """Pola fiszki + tekst do promptu. Z gołego tekstu pola wyciągają reguły kreatora."""
    if isinstance(idea, str):
        text = idea.strip()[:MAX_IDEA_TEXT]
        fields = analyze_locally(text) if len(text) >= 10 else {}
        return {key: str(fields.get(key) or "") for key in _FIELD_LABELS}, text
    fields = {key: str(idea.get(key) or "").strip() for key in _FIELD_LABELS}
    tags = idea.get("tags") or []
    lines = [f"{key}: {value}" for key, value in fields.items() if value]
    if isinstance(tags, list) and tags:
        lines.append(f"tags: {', '.join(str(tag) for tag in tags)}")
    return fields, "\n".join(lines)[:MAX_IDEA_TEXT]


def _trim(text: str, limit: int) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text.rfind(" ", 0, limit - 1)
    return text[: cut if cut > 0 else limit - 1].rstrip(" ,;:") + "…"


def fill_from_template(grant: dict, fields: dict) -> dict[str, str]:
    sections = {}
    for section in grant["sections"]:
        parts = []
        for key in section["fields"]:
            value = fields.get(key, "")
            if value:
                label = _FIELD_LABELS[key]
                parts.append(f"{label}: {value}" if label else value)
        text = "\n\n".join(parts) or _SCAFFOLDS.get(section["id"], "")
        sections[section["id"]] = _trim(text, section["max_chars"])
    return sections


def _prompt(grant: dict) -> str:
    spec = "\n".join(
        f'- "{s["id"]}" ({s["label"]}, maks. {s["max_chars"]} znaków): {s["hint"]}' for s in grant["sections"]
    )
    return (
        f"Piszesz wniosek grantowy: {grant['name']}. Wnioskodawca to organizacja społeczna lub grupa z Małopolski.\n"
        "Na podstawie fiszki pomysłu uzupełnij sekcje wniosku rzeczowym, urzędowym językiem polskim.\n"
        f"Sekcje:\n{spec}\n"
        "Zasady: korzystaj tylko z informacji z fiszki. NIE wymyślaj kwot, liczb uczestników, dat, nazw partnerów "
        "ani wyników — w ich miejsce wstaw „[do uzupełnienia: czego brakuje]”. Plan działań możesz rozpisać na kroki "
        "wynikające z opisu. Odpowiedz WYŁĄCZNIE obiektem JSON {\"<id sekcji>\": \"tekst\"} ze wszystkimi sekcjami."
    )


async def fill_with_llm(grant: dict, idea_text: str) -> dict[str, str]:
    from app.llm import chat

    raw = await chat(
        [{"role": "system", "content": _prompt(grant)}, {"role": "user", "content": idea_text}],
        response_format={"type": "json_object"},
    )
    parsed = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
    return {
        s["id"]: _trim(str(parsed[s["id"]]), s["max_chars"])
        for s in grant["sections"]
        if isinstance(parsed.get(s["id"]), str) and parsed[s["id"]].strip()
    }


@router.post("/fill")
async def fill(body: FillRequest):
    call = _CALLS_BY_ID.get(body.grant_id)
    if call is None:
        return {"data": None, "error": "Nie znaleziono takiego naboru"}
    if call_status(call) == "closed":
        return {"data": None, "error": "Ten nabór jest już zakończony — wybierz otwarty albo nadchodzący nabór"}
    grant = _template(call)
    fields, idea_text = _idea_fields(body.idea)
    if len(idea_text.strip()) < 10:
        return {"data": None, "error": "Opisz pomysł w co najmniej jednym zdaniu albo uzupełnij fiszkę"}

    sections = fill_from_template(grant, fields)
    source = "rules"
    if settings.openrouter_api_key:
        try:
            from_llm = await fill_with_llm(grant, idea_text)
            if from_llm:
                sections.update(from_llm)
                source = "llm"
        except Exception:
            log.exception("grant fill via LLM failed, using template")

    missing = [s["id"] for s in grant["sections"] if not sections[s["id"]] or "[do uzupełnienia" in sections[s["id"]]]
    return {"data": {"grant_id": call["id"], "sections": sections, "missing": missing, "source": source}, "error": None}


class ApplicationRequest(BaseModel):
    applicant_name: str = Field(max_length=256)
    applicant_email: str = Field(max_length=256)
    organization: str | None = Field(default=None, max_length=256)
    sections: dict[str, str]


_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _format_date(value: str) -> str:
    return datetime.fromisoformat(value).strftime("%d.%m.%Y")


@router.post("/{grant_id}/applications")
async def submit_application(grant_id: str, body: ApplicationRequest, request: Request):
    """Złożenie wniosku — tylko w okresie naboru. Termin sprawdzamy tutaj, nie tylko na froncie."""
    call = _CALLS_BY_ID.get(grant_id)
    if call is None:
        return {"data": None, "error": "Nie znaleziono takiego naboru"}
    status = call_status(call)
    if status == "upcoming":
        return {"data": None, "error": f"Nabór jeszcze się nie rozpoczął — wnioski przyjmujemy od {_format_date(call['opens_at'])}"}
    if status == "closed":
        return {"data": None, "error": f"Nabór zakończył się {_format_date(call['closes_at'])} — wniosku nie można już złożyć"}

    name = body.applicant_name.strip()
    email = body.applicant_email.strip()
    if not name:
        return {"data": None, "error": "Podaj imię i nazwisko albo nazwę wnioskodawcy"}
    if not _EMAIL.match(email):
        return {"data": None, "error": "Podaj poprawny adres e-mail do kontaktu w sprawie wniosku"}

    problems = []
    sections = {}
    for section in _template(call)["sections"]:
        text = (body.sections.get(section["id"]) or "").strip()
        if not text or "[do uzupełnienia" in text:
            problems.append(f"{section['label']}: do uzupełnienia")
        elif len(text) > section["max_chars"]:
            problems.append(f"{section['label']}: za długo (limit {section['max_chars']} znaków)")
        sections[section["id"]] = text
    if problems:
        return {"data": None, "error": "Wniosek jest niekompletny. " + "; ".join(problems)}

    user = await get_current_user(request)
    async with get_db() as db:
        application = GrantApplication(
            grant_id=call["id"],
            user_id=user.id if user else None,
            applicant_name=name,
            applicant_email=email,
            organization=(body.organization or "").strip() or None,
            sections=json.dumps(sections, ensure_ascii=False),
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)
    return {
        "data": {"id": application.id, "grant_id": call["id"], "submitted_at": application.submitted_at.isoformat()},
        "error": None,
    }

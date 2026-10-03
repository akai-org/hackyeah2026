"""Generator wniosków grantowych: wzory wniosków (sekcje jako dane) i wypełnianie ich z fiszki pomysłu.

GET  /api/grants       → lista wzorów z sekcjami
POST /api/grants/fill  { grant_id, idea } → { grant_id, sections: {id: tekst}, missing: [id], source }

`idea` to tekst opisu albo fiszka z kreatora ({title, short_desc, essence, problem, for_whom, place, stage,
budget, partners, tags}). Z kluczem OpenRouter sekcje pisze LLM (JSON mode), bez klucza albo przy błędzie —
szablon z pól fiszki. Wzory są uproszczone: przed złożeniem trzeba sprawdzić aktualny regulamin naboru.
"""

import json
import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.idea_analysis import analyze_locally

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/grants", tags=["grants"])

MAX_IDEA_TEXT = 6000

# Każda sekcja: id, nazwa z formularza, podpowiedź dla piszącego, limit znaków, pola fiszki do szablonu bez LLM.
GRANTS: list[dict] = [
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

_GRANTS_BY_ID = {grant["id"]: grant for grant in GRANTS}

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


def _summary(grant: dict) -> dict:
    return {key: grant[key] for key in ("id", "name", "organizer", "description", "source_url", "sections")}


@router.get("")
async def list_grants():
    return {"data": [_summary(grant) for grant in GRANTS], "error": None}


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
    grant = _GRANTS_BY_ID.get(body.grant_id)
    if grant is None:
        return {"data": None, "error": "Nie znaleziono takiego naboru"}
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
    return {"data": {"grant_id": grant["id"], "sections": sections, "missing": missing, "source": source}, "error": None}

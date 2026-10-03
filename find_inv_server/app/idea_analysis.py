"""Rozbicie opisu pomysłu na pola fiszki: tytuł, krótki opis, istota, dla kogo, gdzie, etap, budżet, partnerzy.

Z kluczem OpenRouter robi to LLM (app.llm, odpowiedź JSON). Bez klucza albo przy błędzie LLM — reguły
dla języka polskiego poniżej. Kontrakt odpowiedzi jest ten sam.
"""

import json
import logging
import re

from app.config import settings
from app.local_matching import TARGET_GROUPS, fold, local_tags
from app.utils import TAXONOMY_TAGS

log = logging.getLogger(__name__)

STAGES = [
    "Pomysł, przed pilotażem",
    "Przygotowanie do wdrożenia",
    "Pilotaż",
    "Działa, szukamy rozszerzenia",
]

# Kolejność ma znaczenie: od najbardziej zaawansowanego etapu.
_STAGE_PATTERNS = [
    (STAGES[3], r"dziala od|dzialamy od|prowadzimy od|od \d+ (lat|miesiecy)|wdrozylismy|juz dziala"),
    (STAGES[2], r"pilotaz|pilotazow|testujemy|testowalismy|przetestowalismy|pierwsze spotkania odbyly"),
    (STAGES[1], r"przygotowujemy|mamy partnera|mamy partnerow|szukamy finansowania|piszemy wniosek|mamy zgode"),
]

_INTENT_PREFIX = re.compile(
    r"^(chcę|chcemy|chciałbym|chciałabym|chcielibyśmy|planuję|planujemy|proponuję|proponujemy|"
    r"mój pomysł to|nasz pomysł to|pomysł:|pomysł polega na tym, że)\s+",
    re.IGNORECASE,
)

# „dla seniorów z gminy”, „dla dzieci w wieku 6–10 lat” — do końca zdania albo przecinka.
_FOR_WHOM = re.compile(r"\bdla\s+([^.,;:!?]{3,80})", re.IGNORECASE)
# Miejsce w opisie kończy grupę docelową: „dla rodziców … w Tarnowie” → „rodziców …”.
_TRAILING_PLACE = re.compile(r"\s+(?:w|we|na)\s+(?:[A-ZŁŚŻŹĆ]|gminie|powiecie|mieście|wsi|świetlicy|bibliotece|szkole).*$")

_UPPER = "A-ZĄĆĘŁŃÓŚŹŻ"
_WORD = "A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż-"
# „w gminie Racławice”, „w powiecie tarnowskim” → jednostka w mianowniku.
_ADMIN = re.compile(rf"\b(?:w|we)\s+(gminie|powiecie|mieście|miejscowości|wsi)\s+([{_UPPER}][{_WORD}]+(?:\s+[{_UPPER}][{_WORD}]+)?|[a-ząćęłńóśźż]+(?:skim|ckim|zkim))")
_ADMIN_NOMINATIVE = {"gminie": "gmina", "powiecie": "powiat", "mieście": "miasto", "miejscowości": "miejscowość", "wsi": "wieś"}
# „w świetlicy wiejskiej”, „w domu kultury” → miejsce w mianowniku.
_VENUE = re.compile(
    r"\b(?:w|we|na)\s+(świetlicy|bibliotece|szkole|domu kultury|remizie|ośrodku|parafii|przedszkolu|centrum|osiedlu)"
    r"(\s+[a-ząćęłńóśźż]+(?:ej|iej))?",
    re.IGNORECASE,
)
_VENUE_NOMINATIVE = {"świetlicy": "świetlica", "bibliotece": "biblioteka", "szkole": "szkoła", "domu kultury": "dom kultury",
                     "remizie": "remiza", "ośrodku": "ośrodek", "parafii": "parafia", "przedszkolu": "przedszkole",
                     "centrum": "centrum", "osiedlu": "osiedle"}  # fmt: skip
# „w Tarnowie” (nazwa własna po przyimku, nie na początku zdania)
_TOWN = re.compile(rf"(?<=[{_WORD[:-1]}] )(?:w|we)\s+([{_UPPER}][a-ząćęłńóśźż]+(?:ie|u|ach|y))\b")

_BUDGET = re.compile(
    r"((?:ok\.?|około|do|ponad|nawet)?\s*\d[\d\s.,]*\s*(?:tys\.?|tysięcy|mln|zł|złotych|PLN)(?:\s*zł)?"
    r"(?:\s*(?:rocznie|miesięcznie|na rok|na miesiąc|na start))?)",
    re.IGNORECASE,
)
_PARTNERS = re.compile(
    r"\b(?:we\s+współpracy\s+z|razem\s+z|wspólnie\s+z|z\s+pomocą|partnerem\s+(?:jest|będzie)|partnerami\s+(?:są|będą))"
    r"\s+([^.;:!?]{3,100})",
    re.IGNORECASE,
)


def _place(text: str) -> str:
    parts = []
    venue = _VENUE.search(text)
    if venue:
        noun = _VENUE_NOMINATIVE.get(venue.group(1).lower(), venue.group(1))
        adjective = (venue.group(2) or "").strip()
        # przymiotnik żeński w miejscowniku: „wiejskiej” → „wiejska”
        adjective = re.sub(r"iej$", "a", adjective) if adjective.endswith("iej") else re.sub(r"ej$", "a", adjective)
        parts.append(f"{noun} {adjective}".strip())
    admin = _ADMIN.search(text)
    if admin:
        unit = _ADMIN_NOMINATIVE[admin.group(1).lower()]
        name = admin.group(2)
        if name[0].islower():  # „powiecie tarnowskim” → „powiat tarnowski”
            name = re.sub(r"im$", "i", name)
        parts.append(f"{unit} {name}")
    elif (town := _TOWN.search(text)) is not None:
        parts.append(f"w {town.group(1)}")
    return ", ".join(parts)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", _clean(text)) if s.strip()]


def _trim(text: str, limit: int) -> str:
    text = _clean(text)
    if len(text) <= limit:
        return text
    cut = text.rfind(" ", 0, limit)
    return text[: cut if cut > 0 else limit].rstrip(" ,;:") + "…"


def _capitalize(text: str) -> str:
    return text[:1].upper() + text[1:] if text else text


def _title(first_sentence: str) -> str:
    body = _INTENT_PREFIX.sub("", first_sentence.rstrip(".!?")).split(",")[0]
    words = body.split()
    title = " ".join(words[:9]).rstrip(" ,;:")
    return _capitalize(title) + ("…" if len(words) > 9 else "")


def _first_match(pattern: re.Pattern, text: str) -> str:
    match = pattern.search(text)
    return _clean(match.group(1)).rstrip(" ,;:") if match else ""


def analyze_locally(text: str, chosen_tags: list[str] | None = None) -> dict:
    chosen = [t for t in (chosen_tags or []) if t in TAXONOMY_TAGS]
    suggested = [t for t in local_tags(text) if t not in chosen]
    tags = chosen + suggested
    sentences = _sentences(text) or [_clean(text)]

    for_whom = _TRAILING_PLACE.sub("", _first_match(_FOR_WHOM, text))
    if not for_whom:
        groups = [TARGET_GROUPS[t] for t in tags if t in TARGET_GROUPS]
        for_whom = ", ".join(dict.fromkeys(groups))

    place = _place(text)
    if not place:
        place = "gmina wiejska" if "gmina_wiejska" in tags else "miasto" if "gmina_miejska" in tags else ""

    folded = fold(text)
    stage = next((name for name, pattern in _STAGE_PATTERNS if re.search(pattern, folded)), STAGES[0])

    return {
        "title": _title(sentences[0]),
        "short_desc": _trim(sentences[0], 160),
        "essence": _trim(text, 700),
        "for_whom": for_whom,
        "place": place,
        "stage": stage,
        "budget": _first_match(_BUDGET, text),
        "partners": _first_match(_PARTNERS, text),
        "tags": tags,
        "suggested_tags": suggested,
        "source": "rules",
    }


_LLM_PROMPT = (
    "Rozbijasz opis pomysłu społecznego (Małopolska) na pola fiszki. Odpowiedz WYŁĄCZNIE obiektem JSON:\n"
    '{"title": str, "short_desc": str, "essence": str, "for_whom": str, "place": str, "stage": str, '
    '"budget": str, "partners": str, "tags": [str]}\n'
    "title: do 9 słów, rzeczownikowo (np. „Spotkania cyfrowe młodzieży z seniorami”). "
    "short_desc: jedno zdanie do 160 znaków. essence: na czym polega pomysł, 2–4 zdania, tylko z opisu. "
    "for_whom, place, budget, partners: tylko jeśli wynikają z opisu, inaczej pusty string — NIE zgaduj. "
    f"stage: dokładnie jedna z wartości: {' | '.join(STAGES)}. "
    f"tags: 1–5 z listy: {', '.join(TAXONOMY_TAGS)}."
)


async def analyze_idea(text: str, chosen_tags: list[str] | None = None) -> dict:
    """Fiszka z LLM, gdy jest klucz; reguły lokalne jako zapas. Wybrane przez użytkownika tagi zawsze zostają."""
    local = analyze_locally(text, chosen_tags)
    if not settings.openrouter_api_key:
        return local
    try:
        from app.llm import chat

        raw = await chat(
            [{"role": "system", "content": _LLM_PROMPT}, {"role": "user", "content": text}],
            response_format={"type": "json_object"},
        )
        parsed = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
    except Exception:
        log.exception("idea analysis via LLM failed, using rules")
        return local

    chosen = [t for t in (chosen_tags or []) if t in TAXONOMY_TAGS]
    suggested = [t for t in parsed.get("tags", []) if t in TAXONOMY_TAGS and t not in chosen]
    result = {key: _clean(str(parsed.get(key) or "")) for key in ("title", "short_desc", "essence", "for_whom",
                                                                    "place", "budget", "partners")}
    # Puste pola z LLM uzupełniamy regułami — lepiej mieć propozycję do poprawki niż pustkę.
    for key, value in result.items():
        if not value:
            result[key] = local[key]
    stage = parsed.get("stage")
    return {
        **result,
        "stage": stage if stage in STAGES else local["stage"],
        "tags": chosen + suggested,
        "suggested_tags": suggested,
        "source": "llm",
    }

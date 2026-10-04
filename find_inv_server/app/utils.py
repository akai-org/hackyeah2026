import json

from app.llm import chat

TAXONOMY_TAGS = [
    "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
    "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
    "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
    "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
    "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator",
]

_AUTOTAGGER_SYSTEM = f"""Jesteś klasyfikatorem problemów społecznych dla platformy HubMI.pl.
Zwróć TYLKO obiekt JSON — bez żadnego dodatkowego tekstu.

Dostępne tagi (użyj TYLKO z tej listy): {json.dumps(TAXONOMY_TAGS, ensure_ascii=False)}

Format odpowiedzi:
{{
  "tags": ["tag1", "tag2"],          // 1-5 tagów z listy
  "area": "...",                      // krótki opis obszaru (max 50 znaków)
  "target_group": "...",              // dla kogo (max 50 znaków)
  "location": null,                   // opcjonalnie: powiat/gmina jeśli wymieniony
  "type": "problem",                  // "problem" | "idea" | "question"
  "is_relevant": true                 // false jeśli temat jest całkowicie spoza społecznego
}}"""


_KEYWORD_MAP: dict[str, list[str]] = {
    "senior": ["seniorzy"], "babcia": ["seniorzy"], "dziadek": ["seniorzy"],
    "starszy": ["seniorzy"], "elderly": ["seniorzy"], "65+": ["seniorzy"],
    "internet": ["wykluczenie_cyfrowe"], "smartfon": ["wykluczenie_cyfrowe"],
    "cyfrowy": ["wykluczenie_cyfrowe"], "komputer": ["wykluczenie_cyfrowe"],
    "samotny": ["samotność"], "samotna": ["samotność"], "izolacja": ["samotność"],
    "psycholog": ["zdrowie_psychiczne"], "depresja": ["zdrowie_psychiczne"],
    "kryzys": ["zdrowie_psychiczne"], "psychiatra": ["zdrowie_psychiczne"],
    "niepełnospraw": ["niepełnosprawność"], "asystent": ["niepełnosprawność"],
    "biedny": ["ubóstwo"], "bieda": ["ubóstwo"], "ubóstwo": ["ubóstwo"], "biedna": ["ubóstwo"],
    "dziecko": ["dzieci"], "dzieci": ["dzieci"], "dziecko": ["dzieci"],
    "młodzież": ["młodzież"], "nastolatek": ["młodzież"], "szkoła": ["młodzież"],
    "rodzina": ["rodzina"], "rodzice": ["rodzina"], "wychowanie": ["rodzina"],
    "bezdomn": ["bezdomność"], "noclegownia": ["bezdomność"],
    "uzależni": ["uzależnienia"], "alkohol": ["uzależnienia"], "narkotyki": ["uzależnienia"],
    "migrant": ["migranci"], "cudzoziemiec": ["migranci"], "uchodźca": ["migranci"],
    "wolontariat": ["wolontariat"], "wolontariusz": ["wolontariat"],
    "edukacja": ["edukacja"], "szkolenie": ["edukacja"], "kurs": ["edukacja"],
    "praca": ["rynek_pracy"], "bezrobot": ["rynek_pracy"], "zatrudni": ["rynek_pracy"],
    "transport": ["transport"], "dojazd": ["transport"], "autobus": ["transport"],
    "wieś": ["gmina_wiejska"], "wiejski": ["gmina_wiejska"], "gmina wiejska": ["gmina_wiejska"],
    "miasto": ["gmina_miejska"], "miejski": ["gmina_miejska"],
    "NGO": ["NGO"], "stowarzyszenie": ["NGO"], "fundacja": ["NGO"],
    "urząd": ["samorząd"], "gmina": ["samorząd"], "powiat": ["samorząd"],
    "DPS": ["DPS"], "dom pomocy": ["DPS"],
    "OPS": ["OPS"], "pomoc społeczna": ["OPS"],
    "centrum usług": ["CUS"],
    "inkubator": ["inkubator"],
    "dostępność": ["dostępność"], "dostęp": ["dostępność"], "bariery": ["dostępność"],
}


def _keyword_autotag(text: str) -> list[str]:
    text_lower = text.lower()
    found: set[str] = set()
    for kw, tags in _KEYWORD_MAP.items():
        if kw.lower() in text_lower:
            found.update(tags)
    return [t for t in found if t in TAXONOMY_TAGS][:5]


async def run_autotagger(text: str) -> dict:
    try:
        raw = await chat(
            messages=[
                {"role": "system", "content": _AUTOTAGGER_SYSTEM},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
        )
        # Model potrafi owinąć JSON w ```json … ``` mimo json_object — wycinamy sam obiekt.
        result = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
        result["tags"] = [t for t in result.get("tags", []) if t in TAXONOMY_TAGS]
        result.setdefault("is_relevant", True)
        return result
    except Exception:
        # Keyword fallback bez LLM
        kw_tags = _keyword_autotag(text)
        return {
            "tags": kw_tags,
            "area": "",
            "target_group": "",
            "location": None,
            "type": "problem",
            "is_relevant": True,
        }

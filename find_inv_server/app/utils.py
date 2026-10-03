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


async def run_autotagger(text: str) -> dict:
    raw = await chat(
        messages=[
            {"role": "system", "content": _AUTOTAGGER_SYSTEM},
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},
    )
    try:
        result = json.loads(raw)
        # sanitize — tylko tagi z taksonomii
        result["tags"] = [t for t in result.get("tags", []) if t in TAXONOMY_TAGS]
        result.setdefault("is_relevant", True)
        return result
    except (json.JSONDecodeError, TypeError):
        return {
            "tags": [],
            "area": "",
            "target_group": "",
            "location": None,
            "type": "problem",
            "is_relevant": True,
        }

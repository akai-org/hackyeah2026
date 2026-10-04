"""Język interfejsu wybrany przez użytkownika (nagłówek X-Lang z frontendu).

Middleware w main.py ustawia contextvar na czas requestu; llm.chat dokleja wtedy instrukcję,
żeby odpowiedź AI była w tym języku. Dane w bazie zostają po polsku.
"""

from contextvars import ContextVar

SUPPORTED_LANGS = ("pl", "en", "uk")
DEFAULT_LANG = "pl"

_LANG_NAMES = {"en": "English", "uk": "Ukrainian (українська)"}

current_lang: ContextVar[str] = ContextVar("current_lang", default=DEFAULT_LANG)


def normalize_lang(value: str | None) -> str:
    code = (value or "").split(",")[0].split("-")[0].strip().lower()
    return code if code in SUPPORTED_LANGS else DEFAULT_LANG


def language_instruction() -> str | None:
    """Instrukcja systemowa dla LLM albo None dla polskiego (prompty są po polsku)."""
    name = _LANG_NAMES.get(current_lang.get())
    if not name:
        return None
    return (
        f"IMPORTANT: The user reads the interface in {name}. Write every natural-language text "
        f"meant for the user in {name}, even though the instructions and source data are in Polish. "
        "Keep JSON keys, enum values, ids, tags and proper names (institutions, programmes) unchanged."
    )

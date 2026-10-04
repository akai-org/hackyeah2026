"""Tłumaczenie treści z bazy (pl → en/uk) przez LLM, z trwałym cache.

Dane w bazie zostają po polsku. Gdy frontend wysyła X-Lang=en/uk, middleware w main.py przepuszcza
odpowiedzi JSON przez `translate_payload`: zbiera teksty spod znanych kluczy (tytuły, opisy…), tłumaczy
brakujące jednym wywołaniem LLM na paczkę i podmienia. Każdy tekst tłumaczy się raz — potem idzie z cache
(osobny plik SQLite, żeby nie ruszać modeli). Błąd LLM = oryginał po polsku, nic się nie wysypuje.

Cache rozgrzewa skrypt `python -m data.warm_translations`.
"""

import asyncio
import hashlib
import json
import logging
import re
import sqlite3
import threading
from pathlib import Path
from typing import Any

from app.config import settings
from app.i18n import current_lang

log = logging.getLogger(__name__)

LANG_NAMES = {"en": "English", "uk": "Ukrainian"}

# Klucze, których wartości to treść dla człowieka. Bez identyfikatorów, slugów, tagów, statusów, URL-i,
# nazw powiatów (filtry i adresy) i imion użytkowników.
TRANSLATABLE_KEYS = {
    "title", "short_desc", "full_desc", "category", "area", "target_group", "location", "where_implemented",
    "who_can_use", "description", "indicator_unit", "label", "hint", "name", "top_area", "content", "summary",
    "organizer", "motivation", "what_worked", "improvements", "cost_note", "essence", "for_whom", "place",
    "stage", "budget", "partners", "first_question", "innovation_title", "value",
}

# Ścieżki, których odpowiedzi tłumaczymy (prefiksy). Reszta (auth, eventy, LLM-owe) idzie bez zmian.
INCLUDE_PREFIXES = (
    "/api/innovations", "/api/challenges", "/api/stats", "/api/gmina-pulse", "/api/innovation-gap",
    "/api/forum", "/api/grants", "/api/resources", "/api/areas", "/api/match", "/api/middleman/start",
    "/api/tester/tests", "/api/admin/",
)
# Wyjątki: formularz edycji w panelu (zapisałby tłumaczenie do bazy), listy osób, pliki.
EXCLUDE_PATTERNS = (
    re.compile(r"^/api/admin/innovations/\d+$"),
    re.compile(r"^/api/admin/(users|testers)"),
    re.compile(r"^/api/admin/ideas/\d+/attachments"),
    re.compile(r"^/api/zasobnik/admin"),
    re.compile(r"/rating$"),
    re.compile(r"/tester-status$"),
)

_URL = re.compile(r"^\s*(https?://|www\.)", re.I)
_LETTERS = re.compile(r"[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{2,}")

MAX_CHUNK_CHARS = 6000
MAX_CHUNK_ITEMS = 40
_semaphore = asyncio.Semaphore(6)


# ── Cache ────────────────────────────────────────────────

_db_lock = threading.Lock()
_db_path = Path(getattr(settings, "translations_db", "") or "./translations.db")


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path, check_same_thread=False)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS translations (hash TEXT, lang TEXT, source TEXT, text TEXT, PRIMARY KEY (hash, lang))"
    )
    return conn


_conn = _connect()


def _hash(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def _cached(texts: list[str], lang: str) -> dict[str, str]:
    if not texts:
        return {}
    by_hash = {_hash(t): t for t in texts}
    found: dict[str, str] = {}
    keys = list(by_hash)
    with _db_lock:
        for i in range(0, len(keys), 500):
            part = keys[i : i + 500]
            rows = _conn.execute(
                f"SELECT hash, text FROM translations WHERE lang = ? AND hash IN ({','.join('?' * len(part))})",
                [lang, *part],
            ).fetchall()
            for h, text in rows:
                found[by_hash[h]] = text
    return found


def _store(pairs: dict[str, str], lang: str) -> None:
    if not pairs:
        return
    with _db_lock:
        _conn.executemany(
            "INSERT OR REPLACE INTO translations (hash, lang, source, text) VALUES (?, ?, ?, ?)",
            [(_hash(src), lang, src, dst) for src, dst in pairs.items()],
        )
        _conn.commit()


# ── LLM ──────────────────────────────────────────────────


def _should_translate(text: Any) -> bool:
    return isinstance(text, str) and len(text.strip()) >= 2 and bool(_LETTERS.search(text)) and not _URL.match(text)


def _chunks(texts: list[str]) -> list[list[str]]:
    out: list[list[str]] = []
    current: list[str] = []
    size = 0
    for text in texts:
        if current and (size + len(text) > MAX_CHUNK_CHARS or len(current) >= MAX_CHUNK_ITEMS):
            out.append(current)
            current, size = [], 0
        current.append(text)
        size += len(text)
    if current:
        out.append(current)
    return out


async def _translate_chunk(texts: list[str], lang: str, attempt: int = 0) -> dict[str, str]:
    """Paczka tekstów jako słownik {numer: tekst} — model nie zgubi kolejności, a brakujące numery
    dotłumaczamy osobno (zamiast wyrzucać całą paczkę)."""
    from app import llm

    target = LANG_NAMES[lang]
    system = (
        f"You are a professional translator for a Polish social-innovation platform. Translate every value "
        f"from Polish to {target}. Return ONLY a JSON object with exactly the same keys (\"0\", \"1\", …) and "
        "translated values. Keep Polish place names (municipalities, counties, towns), institution and programme "
        "names (ROPS, OPS, GOPS, MOPS, CUS, DPS, PFRON, FIO, Senior+, GUS), abbreviations, numbers, URLs, "
        "line breaks and the 'Label: text' structure. Translate labels too. No commentary."
    )
    payload = {str(i): text for i, text in enumerate(texts)}
    async with _semaphore:
        reply = await llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": json.dumps(payload, ensure_ascii=False)}],
            response_format={"type": "json_object"},
        )
    match = re.search(r"\{.*\}", reply if isinstance(reply, str) else "", re.DOTALL)
    data = json.loads(match.group()) if match else {}
    if isinstance(data.get("items"), list):  # gdyby model wrócił do listy
        data = {str(i): v for i, v in enumerate(data["items"])}
    result = {
        texts[int(k)]: v for k, v in data.items() if k.isdigit() and int(k) < len(texts) and isinstance(v, str) and v.strip()
    }
    missing = [t for t in texts if t not in result]
    if missing and attempt < 2:
        result.update(await _translate_chunk(missing, lang, attempt + 1))
    return result


async def translate_texts(texts: list[str], lang: str | None = None) -> dict[str, str]:
    """Mapa oryginał → tłumaczenie. Brak tłumaczenia (błąd LLM) = brak klucza, wołający zostawia oryginał."""
    lang = lang or current_lang.get()
    if lang not in LANG_NAMES or not settings.openrouter_api_key:
        return {}
    unique = list(dict.fromkeys(t for t in texts if _should_translate(t)))
    result = _cached(unique, lang)
    missing = [t for t in unique if t not in result]
    if missing:
        outcomes = await asyncio.gather(*(_translate_chunk(c, lang) for c in _chunks(missing)), return_exceptions=True)
        fresh: dict[str, str] = {}
        for outcome in outcomes:
            if isinstance(outcome, Exception):
                log.warning("translation chunk failed: %s", outcome)
            else:
                fresh.update(outcome)
        _store(fresh, lang)
        result.update(fresh)
    return result


async def translate_text(text: str, lang: str | None = None) -> str:
    return (await translate_texts([text], lang)).get(text, text)


# ── Przechodzenie po JSON-ie ─────────────────────────────


def _collect(node: Any, out: list[str], keys: set[str] | None) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, str):
                if keys is None or key in keys:
                    out.append(value)
            elif isinstance(value, list) and value and all(isinstance(v, str) for v in value):
                # Listy tekstów (kroki planu, ryzyka) tłumaczymy w trybie „wszystko”; w trybie kluczy pomijamy tagi.
                if keys is None:
                    out.extend(value)
            else:
                _collect(value, out, keys)
    elif isinstance(node, list):
        for item in node:
            if isinstance(item, str) and keys is None:
                out.append(item)
            else:
                _collect(item, out, keys)


def _apply(node: Any, mapping: dict[str, str], keys: set[str] | None) -> Any:
    if isinstance(node, dict):
        out = {}
        for key, value in node.items():
            if isinstance(value, str) and (keys is None or key in keys):
                out[key] = mapping.get(value, value)
            elif isinstance(value, list) and value and all(isinstance(v, str) for v in value):
                out[key] = [mapping.get(v, v) for v in value] if keys is None else value
            else:
                out[key] = _apply(value, mapping, keys)
        return out
    if isinstance(node, list):
        return [mapping.get(i, i) if isinstance(i, str) and keys is None else _apply(i, mapping, keys) for i in node]
    return node


async def translate_payload(payload: Any, lang: str | None = None, keys: set[str] | None = TRANSLATABLE_KEYS) -> Any:
    """Tłumaczy teksty w strukturze JSON. `keys=None` — wszystkie teksty (np. plan Middlemana)."""
    texts: list[str] = []
    _collect(payload, texts, keys)
    if not texts:
        return payload
    mapping = await translate_texts(texts, lang)
    return _apply(payload, mapping, keys) if mapping else payload


def should_translate_path(path: str) -> bool:
    return path.startswith(INCLUDE_PREFIXES) and not any(p.search(path) for p in EXCLUDE_PATTERNS)

"""Prywatny klient OpenRouter dla matchmakingu.

Działa tylko wtedy, gdy rdzeń A1 (app/llm.py, app/utils.py) jeszcze nie istnieje, a w .env jest
OPENROUTER_API_KEY. Dzięki temu autotagger, voice-fix i czat działają na prawdziwym LLM bez
czekania na Push 2. Po Push 2 router woła app.llm i ten moduł przestaje być używany.
"""

import asyncio
import json
import logging
import weakref
from collections.abc import AsyncIterator

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.local_matching import TAXONOMY_TAGS

log = logging.getLogger(__name__)


class _LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-haiku-4.5"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"


settings = _LLMSettings()


def enabled() -> bool:
    return bool(settings.openrouter_api_key)


_clients: "weakref.WeakKeyDictionary[asyncio.AbstractEventLoop, object]" = weakref.WeakKeyDictionary()


def _client():
    """Klient per pętla zdarzeń: połączenia httpx są związane z pętlą, w której powstały."""
    import openai

    loop = asyncio.get_running_loop()
    if loop not in _clients:
        _clients[loop] = openai.AsyncOpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.openrouter_api_key,
            # Użytkownik czeka na chipy — po 20 s i jednej ponownej próbie spadamy na reguły lokalne.
            timeout=20.0,
            max_retries=1,
        )
    return _clients[loop]


async def chat(messages: list[dict], stream: bool = False) -> str | AsyncIterator[str]:
    """Ten sam kontrakt co app.llm.chat z AGENTS.md: str albo strumień kawałków tekstu."""
    if not stream:
        response = await _client().chat.completions.create(model=settings.openrouter_model, messages=messages)
        return response.choices[0].message.content or ""

    response = await _client().chat.completions.create(
        model=settings.openrouter_model, messages=messages, stream=True
    )

    async def chunks() -> AsyncIterator[str]:
        async for event in response:
            if event.choices and event.choices[0].delta.content:
                yield event.choices[0].delta.content

    return chunks()


AUTOTAG_PROMPT = (
    "Analizujesz opis problemu społecznego z Małopolski. Odpowiedz WYŁĄCZNIE obiektem JSON:\n"
    '{"tags": [...], "area": str|null, "target_group": str|null, "location": str|null, '
    '"type": "problem"|"pomysł"|"pytanie", "is_relevant": bool}\n'
    f"tags: 1–5 tagów wyłącznie z listy: {', '.join(TAXONOMY_TAGS)}.\n"
    "area: krótka nazwa obszaru po polsku. target_group: kogo dotyczy problem. "
    "location: miejscowość lub typ gminy, jeśli padły w opisie. "
    "is_relevant: false, gdy tekst nie dotyczy problemu społecznego (np. pogoda, sport, spam)."
)


def parse_json_object(raw: str) -> dict:
    """LLM czasem owija JSON w ```json … ``` albo dopisuje zdanie — wycinamy sam obiekt."""
    return json.loads(raw[raw.find("{") : raw.rfind("}") + 1])


async def autotag(text: str) -> dict:
    raw = await chat([{"role": "system", "content": AUTOTAG_PROMPT}, {"role": "user", "content": text}])
    parsed = parse_json_object(raw)
    return {
        "tags": [t for t in parsed.get("tags", []) if t in TAXONOMY_TAGS][:5],
        "area": parsed.get("area"),
        "target_group": parsed.get("target_group"),
        "location": parsed.get("location"),
        "type": parsed.get("type") or "problem",
        "is_relevant": bool(parsed.get("is_relevant", True)),
    }

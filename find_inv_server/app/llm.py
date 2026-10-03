from typing import AsyncGenerator

import openai

from app.config import settings

_client: openai.AsyncOpenAI | None = None


def _get_client() -> openai.AsyncOpenAI:
    global _client
    if _client is None:
        _client = openai.AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
    return _client


async def chat(
    messages: list[dict],
    stream: bool = False,
    model: str | None = None,
    response_format: dict | None = None,
) -> str | AsyncGenerator[str, None]:
    kwargs: dict = dict(
        model=model or settings.openrouter_model,
        messages=messages,
    )
    if response_format:
        kwargs["response_format"] = response_format

    if stream:
        return _stream_chat(kwargs)

    resp = await _get_client().chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


async def _stream_chat(kwargs: dict) -> AsyncGenerator[str, None]:
    kwargs["stream"] = True
    async with await _get_client().chat.completions.create(**kwargs) as resp:
        async for chunk in resp:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta


async def embed(text: str) -> list[float]:
    resp = await _get_client().embeddings.create(
        model=settings.openrouter_embed_model,
        input=text,
    )
    return resp.data[0].embedding

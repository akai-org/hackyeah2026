"""
Seed innowacji ROPS do SQLite + ChromaDB.
Uruchom z katalogu find_inv_server/:
    python -m data.seed_innovations            # tagi z parse_rops.py
    python -m data.seed_innovations --llm      # tagi z run_autotagger() (wymaga OPENROUTER_API_KEY)

Dane: data/parsed_innovations.json (python -m data.fetch_rops && python -m data.parse_rops).
Zastępuje innowacje z seed_demo.py realnymi danymi z Biblioteki Innowacji ROPS.
Bez OPENROUTER_API_KEY wgrywa tylko SQLite (matchmaking używa wtedy rankingu bez wektorów).
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import delete

from app.config import settings
from app.database import get_db, init_db
from app.embeddings import embed_and_store, get_collection
from app.models import Innovation

DATA_FILE = os.path.join(os.path.dirname(__file__), "parsed_innovations.json")

# Kolumny tabeli innovations – pozostałe pola JSON-a (video_url, authors, …) zostają w pliku.
FIELDS = [
    "title", "short_desc", "full_desc", "category", "area", "target_group", "location",
    "status", "cost_level", "implementation_time_months", "testers_count",
    "where_implemented", "source_url",
]


def _reset_chroma() -> None:
    col = get_collection()
    ids = col.get(include=[])["ids"]
    if ids:
        col.delete(ids=ids)


async def seed(use_llm: bool = False) -> None:
    await init_db()

    if not os.path.exists(DATA_FILE):
        print(f"BŁĄD: Brak pliku {DATA_FILE}")
        print("Uruchom: python -m data.fetch_rops && python -m data.parse_rops")
        return

    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)

    with_vectors = bool(settings.openrouter_api_key)
    if not with_vectors:
        print("UWAGA: brak OPENROUTER_API_KEY – wgrywam tylko SQLite, bez embeddingów w ChromaDB.")
    if use_llm and not with_vectors:
        print("UWAGA: --llm wymaga OPENROUTER_API_KEY – używam tagów z parse_rops.py.")
        use_llm = False

    if with_vectors:
        _reset_chroma()

    print(f"Seedowanie {len(data)} innowacji ROPS...")
    async with get_db() as db:
        await db.execute(delete(Innovation))  # usuwa też demo z seed_demo.py

        for i, item in enumerate(data, 1):
            tags = item.get("tags") or []
            if use_llm:
                from app.utils import run_autotagger

                tagged = await run_autotagger(f"{item['title']} {item.get('short_desc', '')}")
                tags = tagged.get("tags") or tags

            innov = Innovation(**{k: item.get(k) for k in FIELDS}, tags=json.dumps(tags, ensure_ascii=False))
            innov.testers_count = innov.testers_count or 0
            db.add(innov)
            await db.flush()
            innov.embedding_id = str(innov.id)

            if with_vectors:
                embed_text = f"{innov.title} {innov.short_desc or ''} {innov.full_desc or ''}"
                await embed_and_store(innov.embedding_id, embed_text, {"innovation_id": innov.id})

            if i % 20 == 0:
                print(f"  {i}/{len(data)}...")

        await db.commit()

    target = "SQLite + ChromaDB" if with_vectors else "SQLite"
    print(f"[DONE] Seeded {len(data)} innowacji do {target}")


if __name__ == "__main__":
    asyncio.run(seed("--llm" in sys.argv))

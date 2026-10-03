"""
Seed innowacji ROPS do SQLite + ChromaDB.
Uruchom z katalogu find_inv_server/:
    python -m data.seed_innovations

Agent 3: uzupełnij parsed_innovations.json w data/ przed uruchomieniem.
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_db, init_db
from app.embeddings import embed_and_store
from app.models import Innovation
from app.utils import run_autotagger

DATA_FILE = os.path.join(os.path.dirname(__file__), "parsed_innovations.json")


async def seed():
    await init_db()

    if not os.path.exists(DATA_FILE):
        print(f"BŁĄD: Brak pliku {DATA_FILE}")
        print("Agent 3: uruchom parse_rops.py i wygeneruj parsed_innovations.json")
        return

    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)

    print(f"Seedowanie {len(data)} innowacji...")

    async with get_db() as db:
        for i, item in enumerate(data, 1):
            # Autotagger jeśli brak tagów
            if not item.get("tags"):
                text_for_tags = f"{item.get('title', '')} {item.get('short_desc', '')}"
                tagged = await run_autotagger(text_for_tags)
                item["tags"] = json.dumps(tagged.get("tags", []), ensure_ascii=False)
            elif isinstance(item["tags"], list):
                item["tags"] = json.dumps(item["tags"], ensure_ascii=False)

            innov = Innovation(**item)
            db.add(innov)
            await db.flush()

            embed_text = f"{innov.title} {innov.short_desc or ''} {innov.full_desc or ''}"
            innov.embedding_id = str(innov.id)
            await embed_and_store(str(innov.id), embed_text, {"innovation_id": innov.id})

            if i % 10 == 0:
                print(f"  {i}/{len(data)}...")

        await db.commit()

    print(f"[DONE] Seeded {len(data)} innowacji do SQLite + ChromaDB")


if __name__ == "__main__":
    asyncio.run(seed())

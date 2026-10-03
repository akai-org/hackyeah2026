"""Seed innowacji ROPS do SQLite + ChromaDB.  Uruchom: python -m data.seed_innovations [--llm]

Wymaga Push 1/2 od A1 (app.database, app.models.Innovation, app.embeddings).
Domyślnie używa tagów z parse_rops.py; --llm nadpisuje je wynikiem run_autotagger().
"""

import asyncio
import json
import sys
from pathlib import Path

FIELDS = [
    "title", "short_desc", "full_desc", "category", "area", "target_group", "location",
    "status", "cost_level", "implementation_time_months", "testers_count",
    "where_implemented", "source_url",
]


async def seed(use_llm: bool = False) -> None:
    from app.database import get_db  # noqa: PLC0415 – dostępne po merge'u A1
    from app.embeddings import embed_and_store
    from app.models import Innovation

    data = json.loads((Path(__file__).parent / "parsed_innovations.json").read_text(encoding="utf-8"))
    async with get_db() as db:
        for item in data:
            tags = item["tags"]
            if use_llm:
                from app.utils import run_autotagger

                tags = (await run_autotagger(f"{item['title']} {item['short_desc']}")).get("tags", tags)
            innov = Innovation(**{k: item.get(k) for k in FIELDS}, tags=json.dumps(tags, ensure_ascii=False))
            db.add(innov)
            await db.flush()
            innov.embedding_id = str(innov.id)
            text = f"{innov.title} {innov.short_desc} {innov.full_desc}"
            await embed_and_store(str(innov.id), text, {"id": innov.id})
        await db.commit()
    print(f"Seeded {len(data)} innovations")


if __name__ == "__main__":
    asyncio.run(seed("--llm" in sys.argv))

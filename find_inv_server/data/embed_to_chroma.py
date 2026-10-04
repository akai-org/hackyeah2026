"""
Embeds all innovations from SQLite into ChromaDB.
Run from find_inv_server/:
    python -m data.embed_to_chroma
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_db, init_db
from app.embeddings import embed_and_store
from app.models import Innovation
from sqlalchemy import select


async def main():
    await init_db()

    async with get_db() as db:
        result = await db.execute(select(Innovation))
        innovations = result.scalars().all()

    print(f"Embeddowanie {len(innovations)} innowacji do ChromaDB...")

    for i, innov in enumerate(innovations, 1):
        text = f"{innov.title} {innov.short_desc or ''} {innov.full_desc or ''}".strip()
        await embed_and_store(str(innov.id), text, {"innovation_id": innov.id})
        if i % 5 == 0 or i == len(innovations):
            print(f"  {i}/{len(innovations)} — {innov.title[:50]}")

    print(f"[DONE] {len(innovations)} innowacji w ChromaDB.")


if __name__ == "__main__":
    asyncio.run(main())

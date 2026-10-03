"""Seed innowacji ROPS (data/parsed_innovations.json od A3) do SQLite (A1) i — z kluczem OpenRouter — do ChromaDB.

Uruchom z katalogu find_inv_server/:
    python -m data.seed_innovations              # dopisuje, gdy tabela innovations jest pusta
    python -m data.seed_innovations --replace    # podmienia dane demo (np. z data.seed_demo) na katalog ROPS
    python -m data.seed_innovations --llm        # tagi z run_autotagger zamiast tagów z parse_rops.py

Id w bazie = id z JSON-a, więc /api/match, /api/innovations/{id} i Middleman wskazują tę samą innowację.
Bez OPENROUTER_API_KEY embeddingi są pomijane — matchmaking działa wtedy na rankingu lokalnym (TF-IDF + tagi).
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, func, select  # noqa: E402

from app.config import settings  # noqa: E402
from app.database import get_db, init_db  # noqa: E402
from app.models import Innovation  # noqa: E402

DATA_FILE = Path(__file__).parent / "parsed_innovations.json"

# Tylko kolumny tabeli innovations — JSON A3 ma też categories, authors, video_url itd.
FIELDS = [
    "id", "title", "short_desc", "full_desc", "category", "area", "target_group", "location",
    "status", "cost_level", "implementation_time_months", "testers_count",
    "where_implemented", "source_url",
]  # fmt: skip


async def seed(replace: bool = False, use_llm: bool = False) -> None:
    await init_db()
    if not DATA_FILE.exists():
        print(f"BŁĄD: brak pliku {DATA_FILE} — uruchom data/parse_rops.py (A3).")
        return
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    with_embeddings = bool(settings.openrouter_api_key)

    async with get_db() as db:
        existing = (await db.execute(select(func.count()).select_from(Innovation))).scalar_one()
        if existing and not replace:
            print(f"Tabela innovations ma już {existing} wierszy. Użyj --replace, żeby podmienić je na katalog ROPS.")
            return
        if existing:
            await db.execute(delete(Innovation))

        for i, item in enumerate(data, 1):
            tags = item.get("tags") or []
            if use_llm and with_embeddings:
                from app.utils import run_autotagger

                tags = (await run_autotagger(f"{item['title']} {item['short_desc']}")).get("tags", tags)
            innov = Innovation(**{k: item.get(k) for k in FIELDS if item.get(k) is not None})
            innov.tags = json.dumps(tags, ensure_ascii=False)
            innov.embedding_id = str(innov.id)
            db.add(innov)
            if i % 20 == 0:
                print(f"  {i}/{len(data)}...")
        await db.commit()

    if with_embeddings:
        from app.embeddings import embed_and_store

        for item in data:
            text = f"{item['title']} {item['short_desc']} {item.get('full_desc') or ''}"
            await embed_and_store(str(item["id"]), text, {"innovation_id": item["id"]})
        print(f"[DONE] {len(data)} innowacji ROPS w SQLite + ChromaDB")
    else:
        print(f"[DONE] {len(data)} innowacji ROPS w SQLite (bez ChromaDB — brak OPENROUTER_API_KEY)")


if __name__ == "__main__":
    asyncio.run(seed(replace="--replace" in sys.argv, use_llm="--llm" in sys.argv))

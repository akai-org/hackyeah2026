"""Magazyn danych modułu Knowledge.

Źródło prawdy: data/parsed_innovations.json (114 innowacji z Biblioteki Innowacji ROPS)
i data/challenges.py. Działa bez bazy danych; gdy A1 wystawi tabele SQLAlchemy, wystarczy
podmienić `load_innovations()` na SELECT – kontrakt routera zostaje bez zmian.
"""

import json
import re
from functools import lru_cache
from pathlib import Path

from data import challenges as ch

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache(maxsize=1)
def load_innovations() -> list[dict]:
    path = DATA_DIR / "parsed_innovations.json"
    if not path.exists():
        from data.mock_data import MOCK_INNOVATIONS

        return [dict(i) for i in MOCK_INNOVATIONS]
    return json.loads(path.read_text(encoding="utf-8"))


def public(innov: dict, *, full: bool = False) -> dict:
    out = {k: v for k, v in innov.items() if full or k != "full_desc"}
    out["is_unmaintained"] = innov.get("status") == "unmaintained"
    return out


def search_innovations(
    search: str | None = None,
    tags: list[str] | None = None,
    category: str | None = None,
    area: str | None = None,
    status: str | None = None,
    cost_level: str | None = None,
) -> list[dict]:
    result = load_innovations()
    if status:
        result = [i for i in result if i.get("status") == status]
    if category:
        c = category.lower()
        result = [i for i in result if c in [x.lower() for x in i.get("categories", [i.get("category", "")])]]
    if area:
        result = [i for i in result if area.lower() in (i.get("area") or "").lower()]
    if cost_level:
        result = [i for i in result if i.get("cost_level") == cost_level]
    if tags:
        wanted = set(tags)
        result = [i for i in result if wanted & set(i.get("tags", []))]
        result.sort(key=lambda i: -len(wanted & set(i.get("tags", []))))
    if search:
        words = [w for w in re.split(r"\s+", search.lower()) if w]
        def hit(i: dict) -> bool:
            hay = " ".join(str(i.get(k) or "") for k in ("title", "short_desc", "full_desc", "target_group", "area")).lower()
            return all(w in hay for w in words)
        result = [i for i in result if hit(i)]
    return result


def get_innovation(innovation_id: int) -> dict | None:
    return next((i for i in load_innovations() if i.get("id") == innovation_id), None)


def innovations_for_area(tag_hints: list[str], limit: int | None = None) -> list[dict]:
    wanted = set(tag_hints)
    scored = [(len(wanted & set(i.get("tags", []))), i) for i in load_innovations()]
    scored = [s for s in scored if s[0] > 0 and s[1].get("status") != "archived"]
    scored.sort(key=lambda s: -s[0])
    items = [i for _, i in scored]
    return items[:limit] if limit else items


# ---------- wyzwania i indeks luki ----------

def all_challenges() -> list[dict]:
    out: list[dict] = []
    for powiat, (_, entries) in ch.POWIATY.items():
        for area, value, weight in entries:
            title, desc, unit, _ = ch.AREAS[area]
            out.append({
                "id": len(out) + 1, "title": title, "area": area, "description": desc,
                "indicator_value": value, "indicator_unit": unit, "source": ch.SOURCE,
                "data_year": ch.DATA_YEAR, "powiat": powiat, "severity": weight,
            })
    return out


def powiat_gap(powiat: str) -> dict:
    """Indeks luki: wyzwania o dużej wadze, na które w Bibliotece ROPS jest mało pasujących innowacji.

    Dla każdego wyzwania: waga / (1 + liczba_pasujących_innowacji / 10); gap_score = średnia * 2.
    innovations_count = liczba różnych innowacji pasujących do wyzwań powiatu (po tagach).
    """
    entries = ch.POWIATY[powiat][1]
    parts = []
    matched_ids: set[int] = set()
    for area, _, weight in entries:
        matching = innovations_for_area(ch.AREAS[area][3])
        matched_ids.update(i["id"] for i in matching)
        parts.append((area, weight / (1 + len(matching) / 10)))
    top = max(parts, key=lambda p: p[1])
    return {
        "powiat": powiat,
        "gap_score": round(sum(p[1] for p in parts) / len(parts) * 2, 1),
        "top_area": top[0],
        "innovations_count": len(matched_ids),
    }

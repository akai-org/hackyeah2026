"""Konwertuje parsed_innovations.json na format importu Zasobnika wiedzy (A2: ResourceCreate).

  python -m data.export_to_zasobnik                      # zapisuje data/zasobnik_import.json
  python -m data.export_to_zasobnik --post http://localhost:8000 --token change-me
                                                         # + POST /api/admin/resources/import

Import jest idempotentny po stronie A2 (ten sam typ+tytuł = aktualizacja).
Wymaga obszarów (slugów) z seedu A2: seniorzy, niepelnosprawnosc, rodzina, zdrowie-psychiczne,
ubostwo, aktywizacja-zawodowa, migranci.
"""

import argparse
import json
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = "Biblioteka Innowacji Społecznych ROPS Kraków"
COST = {"low": "niski", "medium": "średni", "high": "wysoki"}

# tag taksonomii -> slug obszaru Zasobnika
TAG_TO_AREA = {
    "seniorzy": "seniorzy",
    "samotność": "seniorzy",
    "DPS": "seniorzy",
    "niepełnosprawność": "niepelnosprawnosc",
    "dostępność": "niepelnosprawnosc",
    "rodzina": "rodzina",
    "dzieci": "rodzina",
    "zdrowie_psychiczne": "zdrowie-psychiczne",
    "młodzież": "zdrowie-psychiczne",
    "uzależnienia": "zdrowie-psychiczne",
    "ubóstwo": "ubostwo",
    "bezdomność": "ubostwo",
    "rynek_pracy": "aktywizacja-zawodowa",
    "migranci": "migranci",
}
CATEGORY_TO_AREA = {
    "seniorzy": "seniorzy",
    "dzieci, młodzież i rodzina": "rodzina",
    "dostępność i mobilność": "niepelnosprawnosc",
    "niepełnosprawność sensoryczna": "niepelnosprawnosc",
    "niepełnosprawność intelektualna": "niepelnosprawnosc",
    "zdrowie i medycyna": "zdrowie-psychiczne",
    "rynek pracy": "aktywizacja-zawodowa",
    "cudzoziemcy": "migranci",
    "bezdomność": "ubostwo",
}


def to_resource(item: dict) -> dict:
    areas = [CATEGORY_TO_AREA[c] for c in item.get("categories", [item["category"]]) if c in CATEGORY_TO_AREA]
    areas += [TAG_TO_AREA[t] for t in item["tags"] if t in TAG_TO_AREA]
    areas = list(dict.fromkeys(areas))[:4]
    content = item["full_desc"].replace("Na czym polega:", "## Na czym polega\n").replace(
        "\n\nProblem:", "\n\n## Problem\n").replace("\n\nGrupa docelowa:", "\n\n## Grupa docelowa\n").replace(
        "\n\nKto może skorzystać:", "\n\n## Kto może skorzystać\n").replace("\n\nSkuteczność:", "\n\n## Czy to działa\n")
    if item.get("authors"):
        content += f"\n\n## Autorzy\n{item['authors']}"
    res = {
        "type": "innovation",
        "title": item["title"][:300],
        "summary": item["short_desc"][:1000],
        "content": content,
        "facts": [
            {"label": "Koszt wdrożenia", "value": COST.get(item["cost_level"], "średni")},
            {"label": "Grupa docelowa", "value": item["target_group"][:200] or "—"},
        ],
        "tags": item["tags"],
        "url": item["source_url"],
        "video_url": item.get("video_url"),
        "attachment_url": item.get("materials_url"),
        "source": SOURCE + (f" – {item['project']}" if item.get("project") else ""),
        "region": None,
        "published": item["status"] == "active",
        "area_slugs": areas,
    }
    return res


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", help="URL backendu, np. http://localhost:8000")
    ap.add_argument("--token", default="change-me", help="X-Admin-Token")
    args = ap.parse_args()

    items = json.loads((HERE / "parsed_innovations.json").read_text(encoding="utf-8"))
    payload = [to_resource(i) for i in items]
    out = HERE / "zasobnik_import.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Zapisano {len(payload)} zasobów -> {out}")

    if args.post:
        req = urllib.request.Request(
            args.post.rstrip("/") + "/api/admin/resources/import",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "X-Admin-Token": args.token},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            print("Import:", r.read().decode())


if __name__ == "__main__":
    main()

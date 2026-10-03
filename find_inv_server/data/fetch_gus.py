"""Pobiera wskaźniki z GUS Bank Danych Lokalnych dla 22 powiatów Małopolski -> data/gus_indicators.json.

Użycie: python -m data.fetch_gus
API publiczne, bez klucza: https://bdl.stat.gov.pl/api/v1/ (limit zapytań – stąd pauzy).
Dla każdej zmiennej bierzemy najnowszy rok, w którym są wartości dla wszystkich powiatów.
"""

import json
import time
import urllib.request
from pathlib import Path

API = "https://bdl.stat.gov.pl/api/v1"
MALOPOLSKIE = "011200000000"
OUT = Path(__file__).parent / "gus_indicators.json"

# klucz -> (id zmiennej BDL, opis[, wymuszony rok])
VARIABLES = {
    "pct_65_plus": (634989, "odsetek osób w wieku 65 lat i więcej w populacji ogółem"),
    "social_aid_per_10k": (1548717, "beneficjenci środowiskowej pomocy społecznej na 10 tys. ludności"),
    "unemployment_rate": (461691, "stopa bezrobocia rejestrowanego (grudzień)"),
    "foster_care_per_1000": (1724774, "dzieci w rodzinnej pieczy zastępczej na 1000 dzieci do 18 r.ż."),
    # niepełnosprawność na poziomie powiatów jest w BDL tylko ze spisu NSP 2011
    "disabled_2011": (400018, "osoby z niepełnosprawnością razem (NSP 2011)", "2011"),
    "population_2011": (72305, "ludność ogółem (2011)", "2011"),
    "medical_visits": (1616687, "porady lekarskie ogółem"),
    "population": (72305, "ludność ogółem"),
}


def get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def latest_full_year(results: list[dict]) -> str:
    years = sorted({v["year"] for u in results for v in u["values"]}, reverse=True)
    for y in years:
        if all(any(v["year"] == y and v["val"] is not None for v in u["values"]) for u in results):
            return y
    raise ValueError("brak roku z kompletem danych")


def fetch_powiaty(var_id: int) -> list[dict]:
    url = f"{API}/data/by-variable/{var_id}?unit-parent-id={MALOPOLSKIE}&unit-level=5&format=json&page-size=100"
    return get(url)["results"]


def main() -> None:
    powiaty: dict[str, dict] = {}
    region: dict[str, dict] = {}
    meta: dict[str, dict] = {}
    for key, (var_id, desc, *forced) in VARIABLES.items():
        res = fetch_powiaty(var_id)
        year = forced[0] if forced else latest_full_year(res)
        meta[key] = {"variable_id": var_id, "description": desc, "year": int(year)}
        for u in res:
            name = u["name"].removeprefix("Powiat ").strip()
            val = next(v["val"] for v in u["values"] if v["year"] == year)
            powiaty.setdefault(name, {"unit_id": u["id"]})[key] = val
        time.sleep(1.2)

        reg = get(f"{API}/data/by-unit/{MALOPOLSKIE}?var-id={var_id}&format=json")["results"][0]["values"]
        reg_val = next((v["val"] for v in reg if v["year"] == year), None)
        region[key] = {"value": reg_val, "year": int(year)}
        time.sleep(1.2)
        print(f"{key}: rok {year}, {len(res)} powiatów")

    OUT.write_text(json.dumps({
        "source": "GUS, Bank Danych Lokalnych (bdl.stat.gov.pl)",
        "variables": meta,
        "region": region,
        "powiaty": powiaty,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Zapisano {len(powiaty)} powiatów -> {OUT}")


if __name__ == "__main__":
    main()

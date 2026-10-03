"""Wyzwania społeczne per powiat Małopolski – z wskaźników GUS BDL (data/gus_indicators.json).

Odśwież dane: python -m data.fetch_gus

Waga wyzwania (1–5) to pozycja powiatu na tle 22 powiatów Małopolski: 5 = najgorzej
w regionie, 1 = najlepiej. Top 3 wyzwania powiatu to wskaźniki, w których wypada najgorzej.
"""

import json
from pathlib import Path

GUS = json.loads((Path(__file__).parent / "gus_indicators.json").read_text(encoding="utf-8"))
SOURCE = GUS["source"]
TOP_N = 3


def _per_1000_disabled(p: dict) -> float:
    return round(1000 * p["disabled_2011"] / p["population_2011"], 1)


def _visits_per_capita(p: dict) -> float:
    return round(p["medical_visits"] / p["population"], 1)


# area -> opis wskaźnika; value(powiat) liczy wartość, higher_is_worse ustala kierunek rankingu.
# primary_tag liczy innowacje „na ten problem” w indeksie luki; tags (szersze) dobierają propozycje w gmina-pulse.
AREAS: dict[str, dict] = {
    "starzenie": {
        "primary_tag": "seniorzy",  # do indeksu luki
        "title": "Starzenie się mieszkańców",
        "description": "Duży udział osób 65+ – rośnie potrzeba usług opiekuńczych i wsparcia przeciw samotności.",
        "unit": "% osób 65+ w populacji",
        "value": lambda p: p["pct_65_plus"],
        "year_key": "pct_65_plus",
        "higher_is_worse": True,
        "tags": ["seniorzy", "samotność", "DPS"],
    },
    "ubóstwo": {
        "primary_tag": "ubóstwo",  # do indeksu luki
        "title": "Ubóstwo i korzystanie z pomocy społecznej",
        "description": "Wielu mieszkańców korzysta ze środowiskowej pomocy społecznej.",
        "unit": "beneficjentów pomocy społecznej na 10 tys. ludności",
        "value": lambda p: p["social_aid_per_10k"],
        "year_key": "social_aid_per_10k",
        "higher_is_worse": True,
        "tags": ["ubóstwo", "OPS", "rodzina"],
    },
    "rynek pracy": {
        "primary_tag": "rynek_pracy",  # do indeksu luki
        "title": "Bezrobocie",
        "description": "Wysoka stopa bezrobocia rejestrowanego.",
        "unit": "% stopa bezrobocia rejestrowanego",
        "value": lambda p: p["unemployment_rate"],
        "year_key": "unemployment_rate",
        "higher_is_worse": True,
        "tags": ["rynek_pracy"],
    },
    "rodzina": {
        "primary_tag": "rodzina",  # do indeksu luki
        "title": "Rodziny w kryzysie",
        "description": "Dużo dzieci w rodzinnej pieczy zastępczej – sygnał problemów opiekuńczych w rodzinach.",
        "unit": "dzieci w rodzinnej pieczy zastępczej na 1000 dzieci",
        "value": lambda p: p["foster_care_per_1000"],
        "year_key": "foster_care_per_1000",
        "higher_is_worse": True,
        "tags": ["rodzina", "dzieci", "młodzież"],
    },
    "niepełnosprawność": {
        "primary_tag": "niepełnosprawność",  # do indeksu luki
        "title": "Osoby z niepełnosprawnościami",
        "description": "Duży odsetek mieszkańców z niepełnosprawnością (ostatnie dane powiatowe: spis 2011).",
        "unit": "osób z niepełnosprawnością na 1000 mieszkańców",
        "value": _per_1000_disabled,
        "year_key": "disabled_2011",
        "higher_is_worse": True,
        "tags": ["niepełnosprawność", "dostępność"],
    },
    "dostęp do usług": {
        "primary_tag": "transport",  # do indeksu luki
        "title": "Dostęp do opieki zdrowotnej",
        "description": "Mało porad lekarskich na mieszkańca – utrudniony dostęp do usług, zwłaszcza poza miastami.",
        "unit": "porad lekarskich na mieszkańca rocznie",
        "value": _visits_per_capita,
        "year_key": "medical_visits",
        "higher_is_worse": False,
        "tags": ["dostępność", "transport", "gmina_wiejska"],
    },
}


def _build() -> dict[str, list[dict]]:
    names = list(GUS["powiaty"])
    n = len(names)
    scores: dict[str, list[dict]] = {name: [] for name in names}
    for area, a in AREAS.items():
        values = {name: a["value"](GUS["powiaty"][name]) for name in names}
        # od najlepszego do najgorszego
        ordered = sorted(names, key=lambda x: values[x], reverse=not a["higher_is_worse"])
        for rank, name in enumerate(ordered):
            pct = rank / (n - 1)  # 0 = najlepiej w regionie, 1 = najgorzej
            scores[name].append({
                "area": area,
                "value": values[name],
                "weight": 1 + round(4 * pct),
                "percentile": pct,
                "year": GUS["variables"][a["year_key"]]["year"],
            })
    return {
        name: sorted(entries, key=lambda e: -e["percentile"])[:TOP_N]
        for name, entries in scores.items()
    }


# powiat -> top 3 wyzwania [{area, value, weight, percentile, year}]
POWIATY: dict[str, list[dict]] = _build()

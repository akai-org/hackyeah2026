"""Lokalny (bez LLM) autotagger i ranking innowacji.

Używany, gdy rdzeń z LLM/ChromaDB nie jest dostępny (brak Push 2, brak klucza OpenRouter)
albo gdy wywołanie LLM się nie uda. Dzięki temu chipy tagów i kolejność kart zawsze
zależą od tego, co wpisał użytkownik, a nie są stałym mockiem.
"""

import math
import re

# Musi zgadzać się z TAXONOMY_TAGS w app/utils.py (A1).
TAXONOMY_TAGS = [
    "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
    "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
    "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
    "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
    "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator",
]  # fmt: skip

# Rdzenie słów po zdjęciu polskich znaków. Rdzeń ze spacją dopasowujemy jako frazę.
TAG_KEYWORDS: dict[str, list[str]] = {
    "seniorzy": ["senior", "starsz", "emeryt", "babci", "babcia", "dziadk", "staruszk", "65+"],
    "wykluczenie_cyfrowe": ["internet", "komputer", "smartfon", "cyfrow", "aplikacj", "online", "mail", "technolog"],
    "samotność": ["samotn", "osamotn", "izolac", "mieszka sam", "zyje sam", "zostal sam", "zostala sam", "nie ma z kim", "nikogo nie ma", "sam w domu", "sama w domu"],
    "zdrowie_psychiczne": ["psychi", "psycholog", "depresj", "kryzys", "stres", "terapi", "zalaman", "samoboj", "lekow"],
    "niepełnosprawność": ["niepelnospraw", "wozek", "wozku", "niewidom", "nieslysz", "gluch", "autyz", "niesprawn"],
    "ubóstwo": ["ubost", "ubog", "bied", "zasilk", "nie stac", "dlug", "glod", "pieniedz"],
    "dzieci": ["dzieck", "dzieci", "przedszkol", "niemowl", "maluch"],
    "młodzież": ["mlodziez", "nastolat", "uczni", "uczen", "licea", "liceum", "student"],
    "rodzina": ["rodzin", "rodzic", "matk", "ojciec", "ojca", "mama", "mamy", "tata", "taty"],
    "bezdomność": ["bezdom", "na ulicy", "eksmis", "noclegown"],
    "uzależnienia": ["uzalezn", "alkohol", "narkot", "hazard", "pije", "picie"],
    "migranci": ["migran", "imigran", "uchodz", "ukrain", "cudzoziem"],
    "wolontariat": ["wolontar", "sasiad", "sasiedz"],
    "edukacja": ["eduk", "szkol", "nauk", "kurs", "warsztat"],
    "rynek_pracy": ["prac", "bezrobot", "zatrudn", "zawod"],
    "dostępność": ["dostepn", "barier", "schod"],
    "transport": ["transport", "dojazd", "dojech", "dojad", "autobus", "bus", "komunikacj", "dowoz"],
    "gmina_wiejska": ["wies", "wsi", "wiejsk", "wiosk", "solectw"],
    "gmina_miejska": ["miast", "miejsk", "osiedl", "blokowisk"],
    "NGO": ["ngo", "fundacj", "stowarzysz", "organizacj pozarzad", "organizacja pozarzad"],
    "samorząd": ["samorzad", "urzad", "urzed", "powiat", "wojt", "burmistrz"],
    "DPS": ["dps", "dom pomocy", "opieka dlugoterm", "opieki dlugoterm"],
    "OPS": ["ops", "mops", "gops", "pomoc spoleczn", "pomocy spoleczn", "osrodek pomocy"],
    "CUS": ["cus", "centrum uslug"],
    "inkubator": ["inkubator", "startup"],
}

TARGET_GROUPS = {
    "seniorzy": "seniorzy",
    "dzieci": "dzieci",
    "młodzież": "młodzież",
    "rodzina": "rodziny",
    "niepełnosprawność": "osoby z niepełnosprawnościami",
    "migranci": "migranci",
    "bezdomność": "osoby w kryzysie bezdomności",
    "uzależnienia": "osoby uzależnione i ich bliscy",
}

STOPWORDS = {
    "jest", "nie", "jak", "ale", "oraz", "albo", "czy", "dla", "przez", "przy", "który", "ktory",
    "ktora", "ktore", "mamy", "nasz", "nasza", "nasze", "nasi", "moja", "moje", "mojej", "mieszka",
    "bardzo", "tylko", "jego", "jej", "ich", "tego", "taki", "takie", "sobie", "jestem", "potrzeb",
    "problem", "problemu", "gminie", "gminy",
}  # fmt: skip

MAX_TAGS = 5
_FOLD = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")


def fold(text: str) -> str:
    return text.lower().translate(_FOLD)


def _tokens(folded: str) -> list[str]:
    return re.findall(r"[a-z0-9+]+", folded)


def local_tags(text: str) -> list[str]:
    """Tagi z TAXONOMY_TAGS w kolejności pierwszego wystąpienia w tekście."""
    folded = fold(text)
    tokens = [(m.start(), m.group()) for m in re.finditer(r"[a-z0-9+]+", folded)]
    found: list[tuple[int, str]] = []
    for tag, stems in TAG_KEYWORDS.items():
        positions = []
        for stem in stems:
            if " " in stem:
                pos = folded.find(stem)
            else:
                pos = next((start for start, tok in tokens if tok.startswith(stem)), -1)
            if pos != -1:
                positions.append(pos)
        if positions:
            found.append((min(positions), tag))
    return [tag for _, tag in sorted(found)][:MAX_TAGS]


def local_tag_result(text: str) -> dict:
    tags = local_tags(text)
    words = [t for t in _tokens(fold(text)) if len(t) > 2]
    target = next((TARGET_GROUPS[t] for t in tags if t in TARGET_GROUPS), None)
    location = "gmina wiejska" if "gmina_wiejska" in tags else "gmina miejska" if "gmina_miejska" in tags else None
    return {
        "tags": tags,
        "area": tags[0].replace("_", " ") if tags else None,
        "target_group": target,
        "location": location,
        "type": "problem",
        # Bez LLM nie odrzucamy agresywnie: dłuższy opis bez tagów nadal przepuszczamy.
        "is_relevant": bool(tags) or len(words) >= 4,
    }


def _stems(text: str) -> set[str]:
    return {tok[:5] for tok in _tokens(fold(text)) if len(tok) >= 4 and tok not in STOPWORDS}


def lexical_similarity(query: str, document: str) -> float:
    """Kosinus na zbiorach rdzeni (5 pierwszych liter) — tani zamiennik embeddingu."""
    q, d = _stems(query), _stems(document)
    if not q or not d:
        return 0.0
    return len(q & d) / math.sqrt(len(q) * len(d))


def rank_locally(query: str, tags: list[str], innovations: list[dict]) -> list[dict]:
    """score = podobieństwo + 0.1 * liczba wspólnych tagów (ta sama formuła co w trybie ChromaDB)."""
    # Tylko tagi od klienta: użytkownik mógł usunąć chip i to ma zmienić wyniki.
    query_tags = set(tags)
    ranked = []
    for innov in innovations:
        document = " ".join(
            str(innov.get(k) or "") for k in ("title", "short_desc", "full_desc", "target_group", "category", "area")
        ) + " " + " ".join(t.replace("_", " ") for t in innov.get("tags", []))
        score = lexical_similarity(query, document) + 0.1 * len(set(innov.get("tags", [])) & query_tags)
        ranked.append({**innov, "match_score": round(score, 4)})
    ranked.sort(key=lambda i: i["match_score"], reverse=True)
    # Karta bez żadnego wspólnego słowa ani tagu tylko myli — lepiej pokazać „nie znalazłem”.
    return [i for i in ranked if i["match_score"] > 0]

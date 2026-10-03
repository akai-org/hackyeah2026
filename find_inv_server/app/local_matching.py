"""Lokalny (bez LLM) autotagger i ranking innowacji.

Używany, gdy nie ma klucza OpenRouter (LLM i embeddingi niedostępne), ChromaDB jest pusta
albo wywołanie LLM się nie uda. Dzięki temu chipy tagów i kolejność kart zawsze
zależą od tego, co wpisał użytkownik, a nie są stałym mockiem.
"""

import math
import re
from collections import Counter

from app.utils import TAXONOMY_TAGS  # zamknięta taksonomia z rdzenia (A1)

# Rdzenie słów po zdjęciu polskich znaków. Rdzeń ze spacją dopasowujemy jako frazę.
TAG_KEYWORDS: dict[str, list[str]] = {
    "seniorzy": ["senior", "starsz", "starsi", "osob starsz", "podeszl", "emeryt", "babci", "babcia", "dziadk", "staruszk", "65+"],
    "wykluczenie_cyfrowe": ["internet", "komputer", "smartfon", "cyfrow", "aplikacj", "online", "mail", "technolog"],
    "samotność": ["samotn", "osamotn", "izolac", "mieszka sam", "zyje sam", "zostal sam", "zostala sam", "nie ma z kim", "nikogo nie ma", "sam w domu", "sama w domu"],
    "zdrowie_psychiczne": ["psychi", "psycholog", "depresj", "kryzys", "stres", "terapi", "zalaman", "samoboj", "lekow"],
    "niepełnosprawność": ["niepelnospraw", "wozek", "wozku", "niewidom", "nieslysz", "gluch", "autyz", "niesprawn"],
    "ubóstwo": ["ubost", "ubog", "bied", "zasilk", "nie stac", "dlug", "glod", "pieniedz"],
    "dzieci": ["dzieck", "dzieci", "przedszkol", "niemowl", "maluch"],
    "młodzież": ["mlodziez", "nastolat", "uczni", "uczen", "licea", "liceum", "student"],
    # Bez „mama/tata”: w opisach problemów to zwykle starszy rodzic, nie wsparcie rodziny.
    "rodzina": ["rodzin", "rodzic", "wielodziet", "piecz"],
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
    "problem", "problemu", "gminie", "gminy", "moze", "moga", "osoba", "osoby", "osob", "sama", "samo", "sami", "same", "samego", "samej",
}  # fmt: skip

MAX_TAGS = 5
MIN_RELATIVE_SCORE = 0.5
LEXICAL_SCALE = 3.0
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


def _stems(text: str) -> list[str]:
    return [tok[:5] for tok in _tokens(fold(text)) if len(tok) >= 4 and tok not in STOPWORDS]


# Wagi pól: tytuł i krótki opis mówią o innowacji więcej niż długi opis.
FIELD_WEIGHTS = {"title": 3, "short_desc": 2, "target_group": 2, "category": 1, "area": 1, "full_desc": 1}


def _document_tf(innov: dict) -> Counter:
    tf: Counter = Counter()
    for field, weight in FIELD_WEIGHTS.items():
        for stem in _stems(str(innov.get(field) or "")):
            tf[stem] += weight
    for tag in innov.get("tags", []):
        for stem in _stems(tag.replace("_", " ")):
            tf[stem] += 2
    return tf


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    dot = sum(v * b.get(k, 0.0) for k, v in a.items())
    norm = math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values()))
    return dot / norm if norm else 0.0


def lexical_scores(query: str, innovations: list[dict]) -> list[float]:
    """TF-IDF na rdzeniach (5 liter) — tani zamiennik embeddingu. Rzadkie słowa ważą więcej niż pospolite."""
    docs = [_document_tf(i) for i in innovations]
    df = Counter(stem for doc in docs for stem in doc)
    n = len(docs)
    idf = {stem: math.log((n + 1) / (count + 1)) + 1 for stem, count in df.items()}
    query_vec = {stem: tf * idf.get(stem, math.log(n + 1) + 1) for stem, tf in Counter(_stems(query)).items()}
    query_weight = sum(query_vec.values()) or 1.0
    scores = []
    for doc in docs:
        cosine = _cosine(query_vec, {stem: (1 + math.log(tf)) * idf[stem] for stem, tf in doc.items()})
        # Pokrycie zapytania (jak „coord” w Lucene): dokument z większością słów zapytania wygrywa
        # z krótkim opisem, który przypadkiem wielokrotnie powtarza jedno z nich.
        coverage = sum(w for stem, w in query_vec.items() if stem in doc) / query_weight
        scores.append(cosine * (0.5 + 0.5 * coverage))
    return scores


def rank_locally(query: str, tags: list[str], innovations: list[dict]) -> list[dict]:
    """score = podobieństwo + 0.1 * liczba wspólnych tagów (ta sama formuła co w trybie ChromaDB)."""
    # Tylko tagi od klienta: użytkownik mógł usunąć chip i to ma zmienić wyniki.
    query_tags = set(tags)
    scores = lexical_scores(query, innovations)
    ranked = []
    for innov, raw in zip(innovations, scores):
        # TF-IDF daje ~0–0.2, a kosinus embeddingów ~0.3–0.9. Stała skala (nie względem najlepszego trafienia,
        # bo wtedy jedno przypadkowe słowo wygrywa) sprawia, że +0.1 za tag waży podobnie jak w trybie ChromaDB.
        similarity = min(1.0, LEXICAL_SCALE * raw)
        score = similarity + 0.1 * len(set(innov.get("tags", [])) & query_tags)
        ranked.append({**innov, "match_score": round(score, 4)})
    ranked.sort(key=lambda i: i["match_score"], reverse=True)
    if not ranked or ranked[0]["match_score"] <= 0:
        return []
    # Karta dużo słabsza od najlepszej (np. jeden wspólny tag, zero wspólnych słów) tylko myli.
    # Lepiej pokazać 2 trafne karty niż 5, z czego 3 przypadkowe.
    threshold = MIN_RELATIVE_SCORE * ranked[0]["match_score"]
    return [i for i in ranked if i["match_score"] >= threshold]


COST_ORDER = {"low": 0, "medium": 1, "high": 2}
COST_LABEL = {"low": "niski", "medium": "średni", "high": "wysoki"}


def _months(n: int | None) -> str:
    if not n:
        return "czas nieznany"
    if n == 1:
        return "1 miesiąc"
    few = 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14
    return f"{n} {'miesiące' if few else 'miesięcy'}"


def local_chat_answer(question: str, innovations: list[dict]) -> str:
    """Odpowiedź bez LLM, złożona z pól innowacji. Obsługuje pytania o koszt i czas wdrożenia."""
    if not innovations:
        return "Nie mam jeszcze dopasowanych innowacji. Opisz problem w wyszukiwarce, a podpowiem, co już działa."
    q = fold(question)
    if any(w in q for w in ("tan", "koszt", "budzet", "pieniad", "drog", "ile kosztuje")):
        ordered = sorted(innovations, key=lambda i: COST_ORDER.get(i.get("cost_level"), 3))
        best = ordered[0]
        costs = {i.get("cost_level") for i in innovations}
        if len(costs) == 1 and len(innovations) > 1:
            lines = [f"Wszystkie te rozwiązania mają podobny koszt: {COST_LABEL.get(best.get('cost_level'), 'nieznany')}."]
            lines.append("Dokładną kwotę sprawdź w karcie innowacji albo przygotuj plan wdrożenia („Dostosuj do mojej instytucji”).")
        else:
            lines = [f"Najtańsza w tym zestawieniu jest „{best['title']}” (koszt {COST_LABEL.get(best.get('cost_level'), 'nieznany')})."]
            lines += [f"- {i['title']}: koszt {COST_LABEL.get(i.get('cost_level'), 'nieznany')}" for i in ordered[1:]]
    elif any(w in q for w in ("szybk", "czas", "dlugo", "kiedy", "ile trwa", "miesi")):
        ordered = sorted(innovations, key=lambda i: i.get("implementation_time_months") or 99)
        best = ordered[0]
        if not best.get("implementation_time_months"):
            return "Karty tych innowacji nie podają czasu wdrożenia. Oszacujesz go, przygotowując plan wdrożenia („Dostosuj do mojej instytucji”)."
        lines = [f"Najszybciej wdrożysz „{best['title']}” ({_months(best.get('implementation_time_months'))})."]
        lines += [f"- {i['title']}: {_months(i.get('implementation_time_months'))}" for i in ordered[1:]]
    else:
        lines = ["Oto krótko, co może pomóc:"]
        lines += [f"- {i['title']}: {i['short_desc']}" for i in innovations]
        lines.append("Zapytaj na przykład, która jest najtańsza albo którą najszybciej wdrożyć.")
    unmaintained = [i["title"] for i in innovations if i.get("is_unmaintained")]
    if unmaintained:
        lines.append(f"Uwaga: {', '.join(unmaintained)} może już nie działać. Sprawdź to przed wdrożeniem.")
    return "\n".join(lines)

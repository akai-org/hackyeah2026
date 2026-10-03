"""Parsuje data/rops_raw/item__*.html -> data/parsed_innovations.json.

Użycie: python -m data.parse_rops
Tagi są nadawane heurystycznie (słowa kluczowe -> TAXONOMY_TAGS); seed_innovations.py
może je nadpisać wynikiem run_autotagger(), jeśli LLM jest dostępny.
"""

import html as htmllib
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
RAW = HERE / "rops_raw"
OUT = HERE / "parsed_innovations.json"
BASE = "https://rops.krakow.pl"
LIB = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych"

TAXONOMY_TAGS = [
    "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
    "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
    "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
    "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
    "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator",
]

# kategoria ROPS -> (area, tagi bazowe)
CATEGORIES = {
    "dla-seniorow": ("seniorzy", ["seniorzy"]),
    "dla-dzieci-mlodziezy-i-rodziny": ("dzieci, młodzież i rodzina", ["dzieci", "młodzież", "rodzina"]),
    "dla-osob-o-ograniczonej-mobilnosci": ("dostępność i mobilność", ["niepełnosprawność", "dostępność"]),
    "dla-osob-z-niepelnosprawnoscia-sensoryczna": ("niepełnosprawność sensoryczna", ["niepełnosprawność", "dostępność"]),
    "dla-osob-z-niepelnosprawnoscia-intelektualna": ("niepełnosprawność intelektualna", ["niepełnosprawność"]),
    "dla-zdrowia-i-medycyny": ("zdrowie i medycyna", ["zdrowie_psychiczne"]),
    "dla-rynku-pracy": ("rynek pracy", ["rynek_pracy"]),
    "dla-cudzoziemcow": ("cudzoziemcy", ["migranci"]),
    "dla-osob-w-kryzysie-bezdomnosci": ("bezdomność", ["bezdomność"]),
}

KEYWORDS = {
    "seniorzy": ["senior", "starszych", "podeszł", "osób starszych", "demencj", "dementyw", "otępien"],
    "wykluczenie_cyfrowe": ["cyfrow", "aplikacj", "internet", "smartfon", "online", "komputer"],
    "samotność": ["samotn", "izolacj"],
    "zdrowie_psychiczne": ["psychiczn", "depresj", "kryzys psych", "terapi", "stres", "wypalen"],
    "niepełnosprawność": ["niepełnospraw", "niewidom", "niesłysz", "głuch", "autyzm", "autystycz", "wózk"],
    "ubóstwo": ["ubóstw", "ubogi", "biedn", "niedostatk"],
    "dzieci": ["dzieci", "dziecko", "przedszkol", "uczni"],
    "młodzież": ["młodzież", "nastolat", "młodych"],
    "rodzina": ["rodzin", "rodzic", "opiekun"],
    "bezdomność": ["bezdomn"],
    "uzależnienia": ["uzależnien", "alkohol", "narkotyk"],
    "migranci": ["cudzoziem", "migrant", "uchodźc", "ukrain"],
    "wolontariat": ["wolontari"],
    "edukacja": ["edukac", "szkoł", "szkole", "nauk", "kurs", "warsztat"],
    "rynek_pracy": ["zatrudni", "pracy", "pracownik", "zawodow", "bezrobot"],
    "dostępność": ["dostępn", "bariery architekt", "bariery w "],
    "transport": ["transport", "dojazd", "przewóz", "mobilno"],
    "gmina_wiejska": ["wiejsk", "wsi ", "wieś"],
    "gmina_miejska": ["miejsk", "miast"],
    "NGO": ["organizacj", "fundacj", "stowarzysz", "pozarządow", "ngo"],
    "samorząd": ["samorząd", "gmin", "powiat", "jst", "urząd"],
    "DPS": ["dps", "domy pomocy społecznej", "domów pomocy społecznej", "domu pomocy społecznej", "dom pomocy społecznej"],
    "OPS": ["ops", "ośrodk", "pomocy społecznej", "pomocy społeczn"],
    "CUS": ["centrum usług społecznych", "centra usług społecznych", "cus"],
    "inkubator": ["inkubator"],
}


def clean(fragment: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", fragment)
    text = re.sub(r"<[^>]+>", " ", text)
    text = htmllib.unescape(text).replace("\xa0", " ")
    return re.sub(r"\s+", " ", text).strip()


def sections(body: str) -> dict[str, str]:
    """Rozbija treść na sekcje wg nagłówków <h4> ('1. Na czym polega...')."""
    parts = re.split(r"<h4>(.*?)</h4>", body, flags=re.S)
    out: dict[str, str] = {}
    for i in range(1, len(parts) - 1, 2):
        name = re.sub(r"^\d+\.\s*", "", clean(parts[i])).rstrip("?").strip().lower()
        # treść bywa w <p>, w listach <li> albo luzem – dziel na bloki po tagach blokowych
        blocks = re.split(r"</?(?:p|li|ul|ol|div)[^>]*>", parts[i + 1])
        out[name] = "\n".join(b for b in (clean(x) for x in blocks) if b)
    return out


def find(secs: dict[str, str], *needles: str) -> str:
    for name, val in secs.items():
        if any(n in name for n in needles):
            return val
    return ""


def shorten(text: str, limit: int = 220) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:")
    return cut + "…"


def tag(text: str, base: list[str]) -> list[str]:
    low = text.lower()
    tags = list(base)
    for t, kws in KEYWORDS.items():
        if t not in tags and any(k in low for k in kws):
            tags.append(t)
    # 'ops' / 'cus' jako podciąg dają fałszywe trafienia – wymagaj całego słowa
    for t in ("OPS", "CUS", "DPS"):
        if t in tags and not re.search(rf"\b{t}\b", text, flags=re.I) and not any(
            k in low for k in KEYWORDS[t] if len(k) > 4
        ):
            tags.remove(t)
    return [t for t in tags if t in TAXONOMY_TAGS][:8]


def cost_level(text: str) -> str:
    low = text.lower()
    if any(k in low for k in ["bezkosztow", "bezpłatn", "wolontari", "niskim koszcie", "niskie koszty"]):
        return "low"
    if any(k in low for k in ["mieszkani", "budow", "remont", "aplikacj", "dedykowan", "sprzęt", "infrastruktur"]):
        return "high" if any(k in low for k in ["budow", "remont", "infrastruktur"]) else "medium"
    return "medium"


def main() -> None:
    items: dict[str, dict] = {}
    for f in sorted(RAW.glob("item__*.html")):
        _, cat, slug = f.stem.split("__", 2)
        h = f.read_text(encoding="utf-8")
        i = h.find('content__main')
        j = h.find("btns-holder-justify", i)
        block = h[i:j]
        m = re.search(r'<h2 class="page-title">(.*?)</h2>', block, flags=re.S)
        if not m:
            continue
        title = clean(m.group(1))
        secs = sections(block)
        what = find(secs, "na czym polega")
        problem = find(secs, "jakich problem")
        target = find(secs, "grupa docelowa")
        who = find(secs, "kto może")
        works = find(secs, "czy to działa")
        authors = find(secs, "autor")
        if not (what or problem):
            continue
        lead = clean(re.search(r"<strong>(.*?)</strong>", block, flags=re.S).group(1)) if "<strong>" in block else ""
        video = re.search(r'href="(https?://(?:www\.)?youtu[^"]+)"', block)
        pdf = re.search(r'href="(/mpliki/[^"]+\.pdf)"', block)
        key = re.sub(r"\W+", " ", title.lower()).strip()  # ta sama innowacja bywa pod kilkoma slugami
        area, base_tags = CATEGORIES[cat]
        if key in items:  # ta sama innowacja w kilku kategoriach
            rec = items[key]
            for t in base_tags:
                if t not in rec["tags"]:
                    rec["tags"].append(t)
            rec["categories"].append(area)
            continue
        full = "\n\n".join(
            s for s in [
                f"Na czym polega: {what}" if what else "",
                f"Problem: {problem}" if problem else "",
                f"Grupa docelowa: {target}" if target else "",
                f"Kto może skorzystać: {who}" if who else "",
                f"Skuteczność: {works}" if works else "",
            ] if s
        )
        searchable = f"{title} {what} {problem} {target} {who}"
        items[key] = {
            "title": title,
            "short_desc": shorten(what or problem),
            "full_desc": full,
            "category": area,
            "categories": [area],
            "area": area,
            "target_group": shorten(target, 200),
            "location": "Małopolska",
            "status": "active",
            "cost_level": cost_level(searchable),
            "implementation_time_months": None,
            "testers_count": 0,
            "where_implemented": "Małopolska",
            "who_can_use": who or None,
            "source_url": f"{BASE}{LIB}/{cat},{slug}",
            "video_url": video.group(1) if video else None,
            "materials_url": BASE + pdf.group(1) if pdf else None,
            "project": lead or None,
            "authors": authors or None,
            "tags": tag(searchable, base_tags),
        }
    data = list(items.values())
    for n, rec in enumerate(data, 1):
        rec["id"] = n
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Zapisano {len(data)} innowacji -> {OUT}")


if __name__ == "__main__":
    main()

"""Pobiera surowe strony Biblioteki Innowacji Społecznych ROPS do data/rops_raw/.

Użycie: python -m data.fetch_rops   (cache: istniejące pliki nie są pobierane ponownie)
"""

import re
import time
import urllib.request
from pathlib import Path

BASE = "https://rops.krakow.pl"
RAW = Path(__file__).parent / "rops_raw"
CATEGORIES = [
    "dla-seniorow",
    "dla-dzieci-mlodziezy-i-rodziny",
    "dla-osob-o-ograniczonej-mobilnosci",
    "dla-osob-z-niepelnosprawnoscia-sensoryczna",
    "dla-osob-z-niepelnosprawnoscia-intelektualna",
    "dla-zdrowia-i-medycyny",
    "dla-rynku-pracy",
    "dla-cudzoziemcow",
    "dla-osob-w-kryzysie-bezdomnosci",
]
LIB = "/innowacje-spoleczne/biblioteka-innowacji-spolecznych"


def get(path: str, name: str) -> str:
    target = RAW / name
    if target.exists():
        return target.read_text(encoding="utf-8")
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "findinv-hackyeah/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        html = r.read().decode("utf-8", errors="ignore")
    target.write_text(html, encoding="utf-8")
    time.sleep(0.3)
    return html


def main() -> None:
    RAW.mkdir(exist_ok=True)
    for cat in CATEGORIES:
        html = get(f"{LIB}/{cat}", f"cat__{cat}.html")
        links = sorted(set(re.findall(rf'href="({LIB}/{cat},[^"]+)"', html)))
        print(cat, len(links))
        for link in links:
            slug = link.rsplit(",", 1)[1]
            get(link, f"item__{cat}__{slug}.html")


if __name__ == "__main__":
    main()

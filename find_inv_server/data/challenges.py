"""Wyzwania społeczne per powiat Małopolski (do Mapy Wyzwań i Indeksu Luki Innowacyjnej).

UWAGA: wartości wskaźników są POGLĄDOWE (demo hackathonowe) – wyznaczone deterministycznie
z profilu powiatu, nie pobrane z GUS BDL. Podmienić na realne dane OZPS / GUS przed wdrożeniem.
Pole `source` mówi o tym wprost.
"""

SOURCE = "dane poglądowe (demo) – do podmiany na GUS BDL / OZPS ROPS"
DATA_YEAR = 2024

# area -> (tytuł, opis, jednostka wskaźnika, tagi taksonomii powiązane z obszarem)
AREAS = {
    "starzenie": (
        "Starzenie się społeczeństwa", "Rosnący odsetek osób 65+ przy malejącej liczbie opiekunów",
        "% osób 65+ w populacji", ["seniorzy", "DPS"],
    ),
    "wykluczenie cyfrowe": (
        "Wykluczenie cyfrowe seniorów", "Brak kompetencji cyfrowych wśród osób starszych",
        "% osób 65+ bez umiejętności cyfrowych", ["wykluczenie_cyfrowe", "seniorzy"],
    ),
    "samotność": (
        "Samotność osób starszych", "Wzrost liczby jednoosobowych gospodarstw domowych osób 65+",
        "% jednoosobowych gosp. wśród 65+", ["samotność", "wolontariat"],
    ),
    "zdrowie psychiczne": (
        "Zdrowie psychiczne dzieci i młodzieży", "Niedostateczny dostęp do wsparcia psychologicznego",
        "placówek na 100 tys. mieszkańców (im mniej, tym gorzej)", ["zdrowie_psychiczne", "młodzież"],
    ),
    "dostęp do usług": (
        "Dostęp do usług społecznych", "Słaba dostępność usług i transportu poza ośrodkami miejskimi",
        "% mieszkańców >30 min od usług", ["transport", "dostępność", "gmina_wiejska"],
    ),
    "niepełnosprawność": (
        "Wsparcie osób z niepełnosprawnościami", "Niedobór usług asystenckich i bariery dostępności",
        "% osób z niepełnosprawnością bez dostępu do asystenta", ["niepełnosprawność", "dostępność"],
    ),
    "ubóstwo": (
        "Ubóstwo i wykluczenie", "Osoby i rodziny korzystające z pomocy społecznej",
        "beneficjentów pomocy społecznej na 10 tys. mieszk.", ["ubóstwo", "rodzina", "OPS"],
    ),
}

# powiat -> (miasto-siedziba do wyszukiwania w opisach innowacji, [(area, wartość wskaźnika, waga 1-5)])
POWIATY = {
    "m. Kraków": ("Kraków", [("starzenie", 21.5, 3), ("zdrowie psychiczne", 9.0, 4), ("samotność", 33.0, 4)]),
    "m. Nowy Sącz": ("Nowy Sącz", [("wykluczenie cyfrowe", 55.0, 3), ("samotność", 30.1, 3), ("ubóstwo", 190, 3)]),
    "m. Tarnów": ("Tarnów", [("starzenie", 25.3, 4), ("samotność", 32.4, 4), ("wykluczenie cyfrowe", 58.0, 3)]),
    "krakowski": ("Krakowie", [("starzenie", 19.8, 2), ("wykluczenie cyfrowe", 60.0, 3), ("dostęp do usług", 22.0, 2)]),
    "wielicki": ("Wieliczk", [("zdrowie psychiczne", 7.5, 3), ("dostęp do usług", 18.0, 2), ("starzenie", 18.2, 2)]),
    "myślenicki": ("Myślenic", [("zdrowie psychiczne", 6.1, 4), ("dostęp do usług", 31.0, 4), ("niepełnosprawność", 41.0, 3)]),
    "wadowicki": ("Wadowic", [("starzenie", 20.1, 3), ("dostęp do usług", 28.0, 3), ("samotność", 29.5, 3)]),
    "oświęcimski": ("Oświęcim", [("ubóstwo", 210, 4), ("zdrowie psychiczne", 6.8, 3), ("niepełnosprawność", 43.0, 3)]),
    "chrzanowski": ("Chrzan", [("ubóstwo", 225, 4), ("starzenie", 23.4, 3), ("wykluczenie cyfrowe", 62.0, 3)]),
    "olkuski": ("Olkusz", [("ubóstwo", 205, 4), ("niepełnosprawność", 45.0, 3), ("dostęp do usług", 26.0, 3)]),
    "miechowski": ("Miechów", [("starzenie", 24.9, 5), ("samotność", 36.0, 5), ("dostęp do usług", 38.0, 5)]),
    "proszowicki": ("Proszowic", [("starzenie", 24.2, 4), ("dostęp do usług", 40.0, 5), ("wykluczenie cyfrowe", 71.0, 4)]),
    "bocheński": ("Bochni", [("wykluczenie cyfrowe", 64.0, 3), ("starzenie", 20.6, 3), ("zdrowie psychiczne", 6.5, 3)]),
    "brzeski": ("Brzesk", [("dostęp do usług", 33.0, 4), ("samotność", 30.0, 3), ("starzenie", 22.0, 3)]),
    "dąbrowski": ("Dąbrow", [("starzenie", 25.8, 5), ("ubóstwo", 232, 4), ("dostęp do usług", 41.0, 4)]),
    "tarnowski": ("Tarnow", [("samotność", 31.5, 4), ("wykluczenie cyfrowe", 66.0, 4), ("dostęp do usług", 35.0, 4)]),
    "gorlicki": ("Gorlic", [("starzenie", 23.8, 4), ("niepełnosprawność", 47.0, 4), ("dostęp do usług", 37.0, 4)]),
    "nowosądecki": ("Nowym Sącz", [("wykluczenie cyfrowe", 68.0, 5), ("samotność", 31.2, 4), ("dostęp do usług", 39.0, 5)]),
    "limanowski": ("Limanow", [("dostęp do usług", 47.0, 5), ("ubóstwo", 241, 5), ("zdrowie psychiczne", 4.9, 5)]),
    "nowotarski": ("Nowym Targ", [("dostęp do usług", 44.0, 5), ("ubóstwo", 236, 4), ("niepełnosprawność", 48.0, 4)]),
    "suski": ("Suchej", [("dostęp do usług", 42.0, 4), ("zdrowie psychiczne", 5.2, 4), ("starzenie", 19.0, 3)]),
    "tatrzański": ("Zakopan", [("dostęp do usług", 36.0, 4), ("ubóstwo", 198, 3), ("samotność", 28.0, 3)]),
    "żywiecki": ("Żywc", [("niepełnosprawność", 42.0, 3), ("dostęp do usług", 30.0, 3), ("starzenie", 20.9, 3)]),
}

"""
Seed demonstracyjny — wgrywa realistyczne innowacje do SQLite (bez ChromaDB).
Używa danych z mock_data.py + dodatkowych 15 innowacji inspirowanych ROPS Kraków.

Uruchom z katalogu find_inv_server/:
    python -m data.seed_demo
"""

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import get_db, init_db
from app.models import Innovation, Challenge, InnovationGapIndex

INNOVATIONS = [
    # Istniejące mocki (znormalizowane)
    {
        "title": "Cyfrowy Senior",
        "short_desc": "Bezpłatne kursy obsługi smartfona i internetu dla osób 65+",
        "full_desc": (
            "Program szkoleń prowadzonych przez wolontariuszy w bibliotekach i Domach Dziennego "
            "Pobytu. Obejmuje obsługę smartfona, bankowość online, telemedycynę i kontakt z rodziną "
            "przez komunikatory. Realizowany w partnerstwie z lokalnymi bibliotekami i OPS."
        ),
        "category": "wykluczenie cyfrowe",
        "area": "edukacja",
        "target_group": "seniorzy 65+",
        "location": "Kraków",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 9,
        "where_implemented": "Kraków, Tarnów, Nowy Sącz",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        "tags": json.dumps(["seniorzy", "wykluczenie_cyfrowe", "edukacja", "wolontariat"]),
        "embedding_id": "1",
    },
    {
        "title": "Sąsiedzka Pomoc",
        "short_desc": "Wolontariat sąsiedzki dla samotnych osób starszych",
        "full_desc": (
            "Sieć przeszkolonych wolontariuszy odwiedzających samotnych seniorów w ich domach. "
            "Pomoc w zakupach, wizytach lekarskich, rozmowie i drobnych naprawach. "
            "Koordynacja przez lokalny OPS lub centrum wolontariatu."
        ),
        "category": "samotność",
        "area": "wsparcie społeczne",
        "target_group": "seniorzy 65+ mieszkający samotnie",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 12,
        "where_implemented": "gminy powiatu krakowskiego",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        "tags": json.dumps(["seniorzy", "samotność", "wolontariat", "gmina_wiejska"]),
        "embedding_id": "2",
    },
    {
        "title": "Centrum Aktywności Lokalnej",
        "short_desc": "Przestrzeń spotkań i aktywizacji dla mieszkańców zagrożonych wykluczeniem",
        "full_desc": (
            "Lokalne centrum oferujące warsztaty tematyczne, grupy wsparcia i doradztwo specjalistyczne. "
            "Działa przy OPS lub NGO. Łączy seniorów, osoby bezrobotne i rodziny w kryzysie "
            "poprzez wspólne działania i wzajemne wsparcie."
        ),
        "category": "aktywizacja społeczna",
        "area": "wsparcie społeczne",
        "target_group": "mieszkańcy zagrożeni wykluczeniem społecznym",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 7,
        "where_implemented": "Wieliczka, Myślenice",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        "tags": json.dumps(["wykluczenie_cyfrowe", "ubóstwo", "NGO", "OPS"]),
        "embedding_id": "3",
    },
    {
        "title": "Telemedycyna dla Wsi",
        "short_desc": "Zdalne konsultacje lekarskie dla mieszkańców obszarów wiejskich",
        "full_desc": (
            "Platforma telemedyczna z przeszkolonymi koordynatorami w gminie. "
            "Umożliwia konsultacje ze specjalistami (kardiolog, ortopeda, dermatolog) "
            "bez konieczności dojazdu do miasta. Sprzęt do wideokonferencji w przychodni gminnej."
        ),
        "category": "zdrowie",
        "area": "dostęp do usług zdrowotnych",
        "target_group": "mieszkańcy gmin wiejskich bez dostępu do specjalistów",
        "location": "gmina wiejska",
        "status": "unmaintained",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 11,
        "where_implemented": "powiat limanowski",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        "tags": json.dumps(["gmina_wiejska", "dostępność", "transport", "seniorzy"]),
        "embedding_id": "4",
    },
    {
        "title": "Asystent Osoby z Niepełnosprawnością",
        "short_desc": "Usługa asystenta wspierającego osoby z niepełnosprawnością w codziennym życiu",
        "full_desc": (
            "Przeszkoleni asystenci pomagają osobom z niepełnosprawnością w wyjściach, "
            "urzędach, rehabilitacji i nauce. Finansowanie z PFRON i środków gminnych. "
            "Program realizowany przez certyfikowane organizacje NGO."
        ),
        "category": "niepełnosprawność",
        "area": "wsparcie społeczne",
        "target_group": "osoby z niepełnosprawnością ruchową i intelektualną",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 3,
        "testers_count": 8,
        "where_implemented": "Kraków, Bochnia, Gorlice",
        "source_url": "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych",
        "tags": json.dumps(["niepełnosprawność", "dostępność", "samorząd", "DPS"]),
        "embedding_id": "5",
    },
    # Dodatkowe innowacje
    {
        "title": "Klub Seniora 2.0",
        "short_desc": "Nowoczesny klub seniora z zajęciami cyfrowymi i zdrowotnymi",
        "full_desc": (
            "Klub łączący tradycyjne spotkania towarzyskie z nowoczesnymi zajęciami: "
            "yoga adaptowana, obsługa smartfona, warsztaty pamięci. Działa przy bibliotece gminnej "
            "i jest finansowany przez gminę we współpracy z NGO."
        ),
        "category": "aktywizacja seniorów",
        "area": "wsparcie społeczne",
        "target_group": "seniorzy 60+",
        "location": "gmina miejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 15,
        "where_implemented": "Bochnia, Olkusz, Wieliczka",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["seniorzy", "samotność", "gmina_miejska", "NGO"]),
        "embedding_id": "6",
    },
    {
        "title": "Punkt Informacyjny dla Migrantów",
        "short_desc": "Bezpłatne doradztwo prawne i społeczne dla obcokrajowców",
        "full_desc": (
            "Punkt oferujący porady prawne, tłumaczenia urzędowe i wsparcie w integracji "
            "dla cudzoziemców zamieszkałych w gminie. Obsadzony przez prawnika, tłumacza "
            "i pracownika socjalnego. Działa 3 dni w tygodniu przy urzędzie gminy."
        ),
        "category": "integracja",
        "area": "wsparcie migrantów",
        "target_group": "migranci i cudzoziemcy",
        "location": "Kraków",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 4,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["migranci", "samorząd", "OPS", "NGO"]),
        "embedding_id": "7",
    },
    {
        "title": "Streetworker dla Bezdomnych",
        "short_desc": "Mobilni pracownicy socjalni docierający do osób w kryzysie bezdomności",
        "full_desc": (
            "Przeszkoleni streetworkerzy regularnie odwiedzają miejsca przebywania osób bezdomnych "
            "i oferują podstawową pomoc: ciepły posiłek, odzież, informację o noclegowniach "
            "i możliwościach wyjścia z bezdomności. Koordynacja z policją i strażą miejską."
        ),
        "category": "bezdomność",
        "area": "wsparcie w kryzysie",
        "target_group": "osoby doświadczające bezdomności",
        "location": "gmina miejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 2,
        "testers_count": 6,
        "where_implemented": "Kraków, Tarnów",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["bezdomność", "OPS", "gmina_miejska", "wolontariat"]),
        "embedding_id": "8",
    },
    {
        "title": "Szkoła dla Rodziców",
        "short_desc": "Warsztaty kompetencji rodzicielskich dla rodziców dzieci 0–18 lat",
        "full_desc": (
            "Program szkoleniowy rozwijający kompetencje wychowawcze: komunikacja z dzieckiem, "
            "radzenie sobie z trudnymi zachowaniami, budowanie relacji. 8 spotkań grupowych "
            "prowadzonych przez psychologa. Bezpłatne, z opieką nad dziećmi podczas zajęć."
        ),
        "category": "rodzina",
        "area": "wsparcie rodziny",
        "target_group": "rodzice dzieci w wieku 0–18 lat",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 18,
        "where_implemented": "Kraków, Nowy Sącz, Tarnów, Zakopane",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["rodzina", "dzieci", "OPS", "NGO"]),
        "embedding_id": "9",
    },
    {
        "title": "Inkubator Ekonomii Społecznej",
        "short_desc": "Wsparcie dla osób chcących założyć spółdzielnię socjalną lub CIS",
        "full_desc": (
            "Inkubator oferuje doradztwo, szkolenia i dostęp do infrastruktury dla grup "
            "chcących wyjść z bezrobocia poprzez ekonomię społeczną. Finansowanie z EFS+. "
            "Czas inkubacji: do 12 miesięcy z mentorem i dostępem do prawnika."
        ),
        "category": "rynek pracy",
        "area": "ekonomia społeczna",
        "target_group": "osoby bezrobotne, z niepełnosprawnością, po resocjalizacji",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 12,
        "testers_count": 3,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["rynek_pracy", "inkubator", "CUS", "NGO"]),
        "embedding_id": "10",
    },
    {
        "title": "Transport Społeczny dla Seniorów",
        "short_desc": "Organizacja dowozu seniorów do lekarzy i urzędów w gminie wiejskiej",
        "full_desc": (
            "Gmina organizuje regularne kursy busem do przychodni, apteki i urzędu. "
            "Zapisy dzień wcześniej przez telefon lub aplikację. Połączenie kilku kursów "
            "w jedną trasę zmniejsza koszt dla gminy. Kierowca przeszkolony w pierwszej pomocy."
        ),
        "category": "transport",
        "area": "dostęp do usług",
        "target_group": "seniorzy i osoby z niepełnosprawnością bez własnego transportu",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "testers_count": 20,
        "where_implemented": "powiat krakowski, powiat wielicki",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["transport", "seniorzy", "dostępność", "gmina_wiejska", "samorząd"]),
        "embedding_id": "11",
    },
    {
        "title": "Wsparcie Psychologiczne Online",
        "short_desc": "Bezpłatne konsultacje psychologiczne przez internet dla mieszkańców",
        "full_desc": (
            "Platforma umożliwiająca bezpłatne konsultacje z psychologiem online. "
            "Szczególnie ważna dla mieszkańców gmin wiejskich bez dostępu do specjalistów. "
            "30-minutowe sesje, możliwość anonimowości, szybki czas oczekiwania (max 3 dni)."
        ),
        "category": "zdrowie psychiczne",
        "area": "zdrowie i dobrostan",
        "target_group": "dorośli w kryzysie psychicznym, młodzież od 16 lat",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 2,
        "testers_count": 11,
        "where_implemented": "cała Małopolska",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["zdrowie_psychiczne", "dostępność", "gmina_wiejska", "młodzież"]),
        "embedding_id": "12",
    },
    {
        "title": "Centrum Usług Społecznych",
        "short_desc": "Jedno miejsce dla wszystkich usług społecznych w gminie",
        "full_desc": (
            "Centrum łączące OPS, pomoc psychologiczną, wsparcie dla rodzin i seniora pod jednym dachem. "
            "Mieszkaniec nie musi szukać właściwego urzędu — jest przyjmowany przez opiekuna sprawy, "
            "który koordynuje pomoc z różnych dziedzin."
        ),
        "category": "organizacja usług",
        "area": "wsparcie społeczne",
        "target_group": "wszyscy mieszkańcy gminy potrzebujący wsparcia",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 12,
        "testers_count": 5,
        "where_implemented": "Gdów, Liszki",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["CUS", "OPS", "samorząd", "dostępność"]),
        "embedding_id": "13",
    },
    {
        "title": "Terapia Przez Sztukę dla Dzieci",
        "short_desc": "Zajęcia arteterapii dla dzieci przeżywających trudności emocjonalne",
        "full_desc": (
            "Program arteterapii dla dzieci 6–14 lat doświadczających problemów emocjonalnych, "
            "z rodzin w kryzysie lub z domów dziecka. Cotygodniowe zajęcia prowadzone przez "
            "terapeutę i plastyka. Finansowanie z budżetu gminy i darowizn."
        ),
        "category": "dzieci",
        "area": "zdrowie psychiczne dzieci",
        "target_group": "dzieci 6–14 lat w trudnej sytuacji rodzinnej",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 8,
        "where_implemented": "Kraków, Tarnów, Nowy Sącz",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["dzieci", "zdrowie_psychiczne", "rodzina", "NGO"]),
        "embedding_id": "14",
    },
    {
        "title": "Akademia Aktywnego Seniora",
        "short_desc": "Program edukacyjny dla seniorów przy uczelni wyższej",
        "full_desc": (
            "Współpraca gminy z uczelnią — seniorzy uczęszczają na wykłady, warsztaty "
            "i grupy dyskusyjne prowadzone przez pracowników naukowych. Badania pokazują "
            "poprawę kondycji poznawczej i redukcję samotności. Koszt: symboliczna opłata 20 zł/miesiąc."
        ),
        "category": "edukacja seniorów",
        "area": "aktywizacja i edukacja",
        "target_group": "seniorzy 55+",
        "location": "Kraków",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 3,
        "testers_count": 14,
        "where_implemented": "Kraków",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["seniorzy", "edukacja", "samotność", "gmina_miejska"]),
        "embedding_id": "15",
    },
    {
        "title": "Program Uzależnienia — Rodzina Razem",
        "short_desc": "Wsparcie całych rodzin dotkniętych uzależnieniem jednego z jej członków",
        "full_desc": (
            "Program obejmuje terapię uzależnionego i jego bliskich równocześnie. "
            "Grupy wsparcia dla współuzależnionych, terapia indywidualna i mediacje rodzinne. "
            "Czas trwania: min. 6 miesięcy. Realizowany przez certyfikowanego terapeutę."
        ),
        "category": "uzależnienia",
        "area": "zdrowie psychiczne i uzależnienia",
        "target_group": "osoby uzależnione i ich rodziny",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 9,
        "where_implemented": "Kraków, Nowy Sącz",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["uzależnienia", "rodzina", "zdrowie_psychiczne", "OPS"]),
        "embedding_id": "16",
    },
    {
        "title": "Mikro-granty dla NGO",
        "short_desc": "System małych grantów dla organizacji społecznych na innowacyjne projekty",
        "full_desc": (
            "Gmina przeznacza co roku pulę środków (50–200 tys. zł) na mikro-granty dla NGO. "
            "Uproszczona procedura: wniosek na 2 stronach A4, decyzja w 2 tygodnie. "
            "Grantobiorca rozlicza się po zakończeniu projektu."
        ),
        "category": "finansowanie",
        "area": "ekonomia społeczna",
        "target_group": "organizacje pozarządowe działające lokalnie",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 1,
        "testers_count": 7,
        "where_implemented": "gmina Zielonki, gmina Kocmyrzów",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["NGO", "inkubator", "samorząd", "rynek_pracy"]),
        "embedding_id": "17",
    },
    {
        "title": "Klub Młodych Aktywistów",
        "short_desc": "Program wolontariatu i liderstwa dla młodzieży 14–25 lat",
        "full_desc": (
            "Roczny program łączący szkolenia liderskie, projekty społeczne i mentoring od lokalnych "
            "przedsiębiorców i NGO. Uczestnicy realizują własne mikro-projekty na rzecz społeczności. "
            "Poprawia kompetencje miękkie i zapobiega wykluczeniu społecznemu."
        ),
        "category": "aktywizacja młodzieży",
        "area": "edukacja",
        "target_group": "młodzież 14–25 lat, w tym zagrożona wykluczeniem",
        "location": None,
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 7,
        "where_implemented": "Kraków, Myślenice, Wieliczka",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["młodzież", "wolontariat", "edukacja", "inkubator"]),
        "embedding_id": "18",
    },
    {
        "title": "Eko-Praca dla Wykluczonych",
        "short_desc": "Aktywizacja zawodowa przez pracę w ogrodach społecznych i recyklingu",
        "full_desc": (
            "Program łączący rehabilitację zawodową z ekologią. Bezrobotni i osoby z grup zagrożonych "
            "wykluczeniem uczą się zawodów zielonej gospodarki: ogrodnictwa, kompostowania, naprawy. "
            "Współfinansowany z EFS+."
        ),
        "category": "aktywizacja zawodowa",
        "area": "rynek pracy",
        "target_group": "osoby długotrwale bezrobotne 25–55 lat",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 4,
        "where_implemented": "Nowy Sącz, Limanowa",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["rynek_pracy", "ubóstwo", "gmina_wiejska", "NGO"]),
        "embedding_id": "19",
    },
    {
        "title": "Dom Dziennego Pobytu dla Seniorów",
        "short_desc": "Dzienny ośrodek aktywizacji dla osób starszych wymagających opieki",
        "full_desc": (
            "Ośrodek przyjmujący do 30 seniorów dziennie, oferujący opiekę medyczną, rehabilitację, "
            "zajęcia kulturalne i wyżywienie. Pozwala rodzinom pracować, nie rezygnując z opieki nad "
            "seniorem. Finansowany przez gminę z dopłatą podopiecznych 5–15 zł/dzień."
        ),
        "category": "opieka dzienna",
        "area": "wsparcie seniorów",
        "target_group": "seniorzy 70+, w tym z demencją, wymagający stałej opieki",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 11,
        "where_implemented": "Gorlice, Bochnia, Proszowice",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["seniorzy", "DPS", "samorząd", "dostępność"]),
        "embedding_id": "20",
    },
    {
        "title": "Bezpieczna Rodzina — Centrum Pomocy",
        "short_desc": "Kompleksowe wsparcie rodzin dotkniętych przemocą domową",
        "full_desc": (
            "Centrum łączące schronisko, terapię psychologiczną, pomoc prawną i wsparcie w usamodzielnieniu "
            "dla ofiar przemocy w rodzinie. Działa całą dobę, przyjmuje z dziećmi. W centrum pracuje "
            "psycholog, prawnik i asystent rodziny."
        ),
        "category": "przemoc domowa",
        "area": "ochrona rodziny",
        "target_group": "ofiary przemocy domowej, głównie kobiety z dziećmi",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 3,
        "testers_count": 3,
        "where_implemented": "Kraków, Tarnów",
        "source_url": "https://rops.krakow.pl",
        "tags": json.dumps(["rodzina", "dzieci", "zdrowie_psychiczne", "OPS"]),
        "embedding_id": "21",
    },
]

CHALLENGES = [
    {"title": "Starzenie się społeczeństwa", "area": "starzenie",
     "description": "Rosnący odsetek osób 65+ przy malejącej liczbie opiekunów",
     "indicator_value": 22.4, "indicator_unit": "% osób 65+ w populacji",
     "source": "GUS 2024", "data_year": 2024, "powiat": "krakowski"},
    {"title": "Wykluczenie cyfrowe seniorów", "area": "wykluczenie cyfrowe",
     "description": "Brak kompetencji cyfrowych wśród osób starszych",
     "indicator_value": 68.0, "indicator_unit": "% osób 65+ bez umiejętności cyfrowych",
     "source": "GUS Społeczeństwo informacyjne 2023", "data_year": 2023, "powiat": "krakowski"},
    {"title": "Samotność osób starszych", "area": "samotność",
     "description": "Wzrost liczby jednoosobowych gospodarstw osób 65+",
     "indicator_value": 31.2, "indicator_unit": "% jednoosobowych gosp. wśród 65+",
     "source": "NSP 2021", "data_year": 2021, "powiat": "nowosądecki"},
    {"title": "Brak transportu na wsi", "area": "transport",
     "description": "Mieszkańcy gmin wiejskich bez dostępu do komunikacji publicznej",
     "indicator_value": 42.3, "indicator_unit": "% wsi bez regularnego połączenia",
     "source": "ROPS Kraków 2023", "data_year": 2023, "powiat": "limanowski"},
    {"title": "Kryzys zdrowia psychicznego", "area": "zdrowie psychiczne",
     "description": "Wzrost liczby zgłoszeń kryzysów psychicznych wśród młodzieży",
     "indicator_value": 18.7, "indicator_unit": "% wzrost rok do roku",
     "source": "NFZ 2024", "data_year": 2024, "powiat": "tarnowski"},
]

GAP_INDEX = [
    {"powiat": "krakowski", "challenge_area": "starzenie", "innovations_count": 8, "gap_score": 1.2},
    {"powiat": "nowosądecki", "challenge_area": "wykluczenie cyfrowe", "innovations_count": 2, "gap_score": 4.7},
    {"powiat": "tarnowski", "challenge_area": "samotność", "innovations_count": 3, "gap_score": 3.1},
    {"powiat": "limanowski", "challenge_area": "dostęp do usług", "innovations_count": 1, "gap_score": 5.9},
    {"powiat": "myślenicki", "challenge_area": "zdrowie psychiczne", "innovations_count": 4, "gap_score": 2.4},
]


async def seed():
    await init_db()

    async with get_db() as db:
        # Sprawdź czy już seedowano
        from sqlalchemy import select, func
        count = (await db.execute(select(func.count()).select_from(Innovation))).scalar() or 0
        if count >= len(INNOVATIONS):
            print(f"Baza już zawiera {count} innowacji — pomijam seed.")
            return

        print(f"Seedowanie {len(INNOVATIONS)} innowacji...")
        for innov_data in INNOVATIONS:
            innov = Innovation(**innov_data)
            db.add(innov)

        print(f"Seedowanie {len(CHALLENGES)} wyzwań...")
        for ch_data in CHALLENGES:
            ch = Challenge(**ch_data)
            db.add(ch)

        print(f"Seedowanie {len(GAP_INDEX)} wpisów indeksu luki...")
        for gap_data in GAP_INDEX:
            gap = InnovationGapIndex(**gap_data)
            db.add(gap)

        await db.commit()

    print(f"[DONE] Seeded: {len(INNOVATIONS)} innowacji, {len(CHALLENGES)} wyzwań, {len(GAP_INDEX)} indeks luki")
    print("Uwaga: ChromaDB nie zostało zaseedowane — wyszukiwanie semantyczne używa mock scoring.")
    print("Aby zaseedować ChromaDB, ustaw OPENROUTER_API_KEY w .env i uruchom seed_innovations.py")


if __name__ == "__main__":
    asyncio.run(seed())

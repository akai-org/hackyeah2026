# Wspólne mocki dla wszystkich agentów.
# Import: from data.mock_data import MOCK_INNOVATIONS, MOCK_CHALLENGES, ...
# Zamiana na realne dane: podmień wywołanie w routerze, interfejs zostaje ten sam.

MOCK_INNOVATIONS = [
    {
        "id": 1,
        "title": "Cyfrowy Senior",
        "short_desc": "Bezpłatne kursy obsługi smartfona i internetu dla osób 65+",
        "full_desc": "Program szkoleń prowadzonych przez wolontariuszy w bibliotekach i DDP. "
                     "Obejmuje obsługę smartfona, bankowość online, telemedycynę i kontakt z rodziną.",
        "category": "wykluczenie cyfrowe",
        "area": "edukacja",
        "target_group": "seniorzy 65+",
        "location": "Kraków",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "testers_count": 9,
        "where_implemented": "Kraków, Tarnów, Nowy Sącz",
        "source_url": "https://rops.krakow.pl",
        "tags": ["seniorzy", "wykluczenie_cyfrowe", "edukacja", "wolontariat"],
        "match_score": 0.94,
        "is_unmaintained": False,
    },
    {
        "id": 2,
        "title": "Sąsiedzka Pomoc",
        "short_desc": "Wolontariat sąsiedzki dla samotnych osób starszych",
        "full_desc": "Sieć wolontariuszy odwiedzających samotnych seniorów w ich domach. "
                     "Pomoc w zakupach, wizytach lekarskich, rozmowie. Koordynacja przez OPS.",
        "category": "samotność",
        "area": "wsparcie społeczne",
        "target_group": "seniorzy 65+",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "testers_count": 12,
        "where_implemented": "gminy powiatu krakowskiego",
        "source_url": "https://rops.krakow.pl",
        "tags": ["seniorzy", "samotność", "wolontariat", "gmina_wiejska"],
        "match_score": 0.89,
        "is_unmaintained": False,
    },
    {
        "id": 3,
        "title": "Centrum Aktywności Lokalnej",
        "short_desc": "Przestrzeń spotkań i aktywizacji dla mieszkańców zagrożonych wykluczeniem",
        "full_desc": "Lokalne centrum oferujące warsztaty, grupy wsparcia i doradztwo. "
                     "Działa przy OPS lub NGO. Łączy seniorów, osoby bezrobotne i rodziny w kryzysie.",
        "category": "aktywizacja",
        "area": "wsparcie społeczne",
        "target_group": "mieszkańcy zagrożeni wykluczeniem",
        "location": None,
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 4,
        "testers_count": 7,
        "where_implemented": "Wieliczka, Myślenice",
        "source_url": "https://rops.krakow.pl",
        "tags": ["wykluczenie_cyfrowe", "ubóstwo", "NGO", "OPS"],
        "match_score": 0.82,
        "is_unmaintained": False,
    },
    {
        "id": 4,
        "title": "Telemedycyna dla Wsi",
        "short_desc": "Zdalne konsultacje lekarskie dla mieszkańców obszarów wiejskich",
        "full_desc": "Platforma telemedyczna z przeszkolonymi koordynatorami w gminie. "
                     "Umożliwia konsultacje ze specjalistami bez dojazdu do miasta.",
        "category": "zdrowie",
        "area": "dostęp do usług",
        "target_group": "mieszkańcy gmin wiejskich",
        "location": "gmina wiejska",
        "status": "unmaintained",
        "cost_level": "medium",
        "implementation_time_months": 6,
        "testers_count": 11,
        "where_implemented": "powiat limanowski",
        "source_url": "https://rops.krakow.pl",
        "tags": ["gmina_wiejska", "dostępność", "transport", "seniorzy"],
        "match_score": 0.76,
        "is_unmaintained": True,
    },
    {
        "id": 5,
        "title": "Asystent Osoby z Niepełnosprawnością",
        "short_desc": "Usługa asystenta wspierającego osoby z niepełnosprawnością w codziennym życiu",
        "full_desc": "Przeszkoleni asystenci pomagają w wyjściach, urzędach, rehabilitacji i nauce. "
                     "Finansowanie z PFRON i środków gminnych.",
        "category": "niepełnosprawność",
        "area": "wsparcie społeczne",
        "target_group": "osoby z niepełnosprawnością",
        "location": None,
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 3,
        "testers_count": 8,
        "where_implemented": "Kraków, Bochnia, Gorlice",
        "source_url": "https://rops.krakow.pl",
        "tags": ["niepełnosprawność", "dostępność", "samorząd", "DPS"],
        "match_score": 0.71,
        "is_unmaintained": False,
    },
]

MOCK_CHALLENGES = [
    {
        "id": 1,
        "title": "Starzenie się społeczeństwa",
        "area": "starzenie",
        "description": "Rosnący odsetek osób 65+ przy malejącej liczbie opiekunów",
        "indicator_value": 22.4,
        "indicator_unit": "% osób 65+ w populacji",
        "source": "GUS 2024",
        "data_year": 2024,
        "powiat": "krakowski",
    },
    {
        "id": 2,
        "title": "Wykluczenie cyfrowe seniorów",
        "area": "wykluczenie cyfrowe",
        "description": "Brak kompetencji cyfrowych wśród osób starszych",
        "indicator_value": 68.0,
        "indicator_unit": "% osób 65+ bez umiejętności cyfrowych",
        "source": "GUS Społeczeństwo informacyjne 2023",
        "data_year": 2023,
        "powiat": "krakowski",
    },
    {
        "id": 3,
        "title": "Samotność osób starszych",
        "area": "samotność",
        "description": "Wzrost liczby jednoosobowych gospodarstw domowych osób 65+",
        "indicator_value": 31.2,
        "indicator_unit": "% jednoosobowych gosp. wśród 65+",
        "source": "NSP 2021",
        "data_year": 2021,
        "powiat": "nowosądecki",
    },
]

MOCK_GAP_INDEX = [
    {"powiat": "krakowski",    "gap_score": 1.2, "top_area": "starzenie",          "innovations_count": 8},
    {"powiat": "nowosądecki",  "gap_score": 4.7, "top_area": "wykluczenie cyfrowe","innovations_count": 2},
    {"powiat": "tarnowski",    "gap_score": 3.1, "top_area": "samotność",           "innovations_count": 3},
    {"powiat": "limanowski",   "gap_score": 5.9, "top_area": "dostęp do usług",    "innovations_count": 1},
    {"powiat": "myślenicki",   "gap_score": 2.4, "top_area": "zdrowie psychiczne", "innovations_count": 4},
]

MOCK_STATS_MALOPOLSKA = {
    "aging_pct": 22.4,
    "loneliness_pct": 18.1,
    "digital_exclusion_pct": 31.0,
    "poverty_per_10k": 145,
    "mental_health_facilities": 23,
    "disability_count": 187400,
    "source_year": 2024,
    "source": "GUS BDL, NSP 2021, ROPS Kraków",
}

MOCK_TAG_RESPONSE = {
    "tags": ["seniorzy", "wykluczenie_cyfrowe"],
    "area": "wykluczenie społeczne",
    "target_group": "seniorzy 65+",
    "location": None,
    "type": "problem",
    "is_relevant": True,
    "is_unmaintained_warning": False,
}

MOCK_FORUM_POSTS = [
    {
        "id": 1, "parent_id": None,
        "content": "Szukam partnera do realizacji projektu dla seniorów w powiecie krakowskim.",
        "author_name": "Anna K.", "badge": "consultant", "created_at": "2026-10-03T11:00:00",
    },
    {
        "id": 2, "parent_id": 1,
        "content": "Jesteśmy NGO z Wieliczki, chętnie porozmawiamy!",
        "author_name": "Jan W.", "badge": "user", "created_at": "2026-10-03T11:15:00",
    },
]

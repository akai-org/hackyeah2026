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
    # Źródło: Mapa Wyzwań Społecznych, ROPS Kraków 2024
    {"id": 1,  "title": "Niedobór rodzin zastępczych",            "area": "rodzina i piecza zastępcza", "description": "Wzrost liczby dzieci w pieczy zastępczej o 3,5% w 2023 vs 2022. Niewystarczająca liczba rodzin zastępczych w stosunku do potrzeb. Dzieci poniżej 10 r.ż. trafiają do ośrodków instytucjonalnych.", "indicator_value": 3.5,  "indicator_unit": "% wzrost dzieci w pieczy (2023 vs 2022)",    "source": "GUS – Piecza zastępcza 2023",           "data_year": 2023, "powiat": "krakowski"},
    {"id": 2,  "title": "Rozdzielanie rodzeństwa w pieczy",       "area": "rodzina i piecza zastępcza", "description": "Brak form wsparcia rodzin zastępczych przewidzianych w ustawie. Niedostateczna współpraca instytucji powiatowych i gminnych prowadzi do rozdzielania rodzeństwa.", "indicator_value": 40.0, "indicator_unit": "% dzieci w instytucjonalnej pieczy poniżej 10 r.ż.", "source": "NIK 2022",                              "data_year": 2022, "powiat": "tarnowski"},
    {"id": 3,  "title": "Bezdomność młodych dorosłych",           "area": "bezdomność",                 "description": "Rosnąca liczba młodych bezdomnych (0–25 lat). 'Niewidzialność' tej grupy – noszą modne ubrania, sprawiają wrażenie beztroski. Brak dostosowanej oferty w noclegowniach i schroniskach.",        "indicator_value": 25.0, "indicator_unit": "% bezdomnych poniżej 25 roku życia",          "source": "DODAJ MNIE 2023",                       "data_year": 2023, "powiat": "krakowski"},
    {"id": 4,  "title": "Luka transferu po opuszczeniu pieczy",   "area": "bezdomność",                 "description": "Wychowankowie placówek po 18 roku życia wpadają w bezdomność z powodu braku wsparcia w usamodzielnieniu. Brak warunków do budowania więzi emocjonalnych w dorastaniu.",                             "indicator_value": 35.0, "indicator_unit": "% byłych wychowanków zagrożonych bezdomnością", "source": "DODAJ MNIE 2023 / NIK",                 "data_year": 2023, "powiat": "nowosądecki"},
    {"id": 5,  "title": "Niskie zatrudnienie z niepełnosprawnością","area": "niepełnosprawność",          "description": "Wskaźnik zatrudnienia osób z niepełnosprawnością 16–64 lata: 30,1% (2023). Trudności z dostępem do edukacji wyższej, kursów specjalistycznych i rynku pracy.",                                   "indicator_value": 30.1, "indicator_unit": "% osób z niepełnosprawnością zatrudnionych",    "source": "GUS BDL 2023",                          "data_year": 2023, "powiat": "nowosądecki"},
    {"id": 6,  "title": "Bariery dla osób z niepełnosprawnością", "area": "niepełnosprawność",          "description": "5,4 mln osób niepełnosprawnych w Polsce (14,3% populacji wg NSP 2021). Główne niezaspokojone potrzeby: dostęp do informacji, mieszkalnictwo, rehabilitacja, praca.",                              "indicator_value": 14.3, "indicator_unit": "% osób z niepełnosprawnością w populacji",       "source": "NSP 2021 / PFRON 2024",                 "data_year": 2024, "powiat": "limanowski"},
    {"id": 7,  "title": "Wzrost ubóstwa skrajnego",               "area": "ubóstwo",                    "description": "6,6% gospodarstw w ubóstwie skrajnym (2023) – wzrost o 2pp vs 2022. Rolnicy: 14,1%, renciści: 8,4%, osoby z niezarobkowych źródeł: 17,9%. Lęk przed biedą: 30% (najwyższy od 2015).",           "indicator_value": 6.6,  "indicator_unit": "% gospodarstw w ubóstwie skrajnym (2023)",     "source": "GUS – Zasięg ubóstwa 2023",             "data_year": 2023, "powiat": "miechowski"},
    {"id": 8,  "title": "Ubóstwo energetyczne i niedożywienie",   "area": "ubóstwo",                    "description": "78% ubogich z pogorszoną sytuacją ekonomiczną. Ponad 53% nie ma środków na podstawowe potrzeby. Zjawisko 'pracujących biednych' – praca na nisko opłacanych stanowiskach.",                        "indicator_value": 78.0, "indicator_unit": "% ubogich z pogorszoną sytuacją ekonomiczną",   "source": "Federacja Banków Żywności 2023",         "data_year": 2023, "powiat": "dąbrowski"},
    {"id": 9,  "title": "Integracja uchodźców z Ukrainy",         "area": "integracja cudzoziemców",    "description": "Brak dostosowanych usług dla migrantów nieznających języka polskiego. Trudności z wynajmem mieszkań, adaptacją dzieci w szkołach, uznawaniem kwalifikacji zawodowych.",                              "indicator_value": 37.0, "indicator_unit": "% migrantek szukających pracy poza swoim zawodem","source": "Monitor Deloitte 2022 / PIE 2022",      "data_year": 2022, "powiat": "krakowski"},
    {"id": 10, "title": "Bariery językowe cudzoziemców",          "area": "integracja cudzoziemców",    "description": "Cudzoziemcy mają ograniczony dostęp do usług publicznych przez bariery językowe. Brak tłumaczy i asystentów kulturowych w urzędach, szkołach i placówkach medycznych.",                            "indicator_value": 60.0, "indicator_unit": "% migrantów z problemami językowymi w dostępie do usług","source": "UW – Model polityki włączania 2023","data_year": 2023, "powiat": "tarnowski"},
    {"id": 11, "title": "Choroby sercowo-naczyniowe",             "area": "zdrowie",                    "description": "Choroba niedokrwienna serca – największe wyzwanie polskiego systemu ochrony zdrowia. Udary – 2. przyczyna zgonów. Wzrost zachorowalności na nowotwory i Alzheimera. Palenie tytoniu jako czynnik ryzyka.", "indicator_value": 45.0, "indicator_unit": "% zgonów z przyczyn sercowo-naczyniowych",      "source": "OECD/European Observatory 2023",         "data_year": 2023, "powiat": "gorlicki"},
    {"id": 12, "title": "Brak specjalistów medycznych na wsi",    "area": "zdrowie",                    "description": "Mieszkańcy gmin wiejskich bez dostępu do specjalistów. Długie kolejki, brak transportu do miast. Pandemia nasiliła samotność i izolację, szczególnie wśród seniorów.",                               "indicator_value": 42.0, "indicator_unit": "% mieszkańców wsi bez specjalisty w 30 min",     "source": "Mapa potrzeb zdrowotnych MZ 2023",      "data_year": 2023, "powiat": "limanowski"},
    {"id": 13, "title": "Kryzys zdrowia psychicznego młodzieży",  "area": "zdrowie psychiczne",         "description": "Wzrost prób samobójczych wśród dzieci i młodzieży. FOMO dotyka co 3. młodego Polaka. Nadmierne korzystanie z elektroniki → depresja. Brak motywacji i samoakceptacji u uczniów.",                "indicator_value": 18.7, "indicator_unit": "% wzrost prób samobójczych wśród dzieci (r/r)",  "source": "Fundacja UNAWEZA – MŁODE GŁOWY 2023",   "data_year": 2023, "powiat": "tarnowski"},
    {"id": 14, "title": "Niedofinansowanie psychiatrii",          "area": "zdrowie psychiczne",         "description": "Finansowanie opieki psychiatrycznej: ok. 3% wydatków NFZ. Stygmatyzacja powoduje niechęć do szukania pomocy. Długofalowe skutki pandemii COVID-19 w zdrowiu psychicznym.",                           "indicator_value": 3.0,  "indicator_unit": "% wydatków NFZ na psychiatrię",                 "source": "State of Health in the EU – Polska 2023","data_year": 2023, "powiat": "myślenicki"},
    {"id": 15, "title": "Samotność i izolacja seniorów",          "area": "seniorzy",                   "description": "31,2% seniorów 65+ żyje w jednoosobowych gospodarstwach. Samotność koreluje z ubóstwem. Polipragmazja (wielolekowość) jako zagrożenie zdrowotne. Bariery architektoniczne w miastach.",             "indicator_value": 31.2, "indicator_unit": "% seniorów 65+ w jednoosobowych gospodarstwach",  "source": "GUS NSP 2021 / SeniorApp 2023",         "data_year": 2023, "powiat": "nowosądecki"},
    {"id": 16, "title": "Wykluczenie cyfrowe seniorów",           "area": "seniorzy",                   "description": "68% osób 65+ bez umiejętności cyfrowych – brak dostępu do e-usług, telemedycyny, kontaktu z rodziną przez internet. Starzejące się społeczeństwo jako wyzwanie systemowe dla całej Małopolski.",   "indicator_value": 68.0, "indicator_unit": "% osób 65+ bez umiejętności cyfrowych",           "source": "GUS – Społeczeństwo informacyjne 2023",  "data_year": 2023, "powiat": "krakowski"},
]

MOCK_GAP_INDEX = [
    # Źródło: szacowania ROPS Kraków 2024, dane o innowacjach z Biblioteki ROPS
    {"powiat": "Kraków",       "gap_score": 2.1, "top_area": "integracja cudzoziemców",   "innovations_count": 6},
    {"powiat": "Tarnów",       "gap_score": 4.2, "top_area": "zdrowie psychiczne",        "innovations_count": 3},
    {"powiat": "Nowy Sącz",    "gap_score": 5.1, "top_area": "bezdomność",               "innovations_count": 2},
    {"powiat": "bocheński",    "gap_score": 5.8, "top_area": "rodzina i piecza",         "innovations_count": 2},
    {"powiat": "brzeski",      "gap_score": 6.3, "top_area": "ubóstwo",                  "innovations_count": 1},
    {"powiat": "chrzanowski",  "gap_score": 4.0, "top_area": "seniorzy",                 "innovations_count": 3},
    {"powiat": "dąbrowski",    "gap_score": 7.2, "top_area": "ubóstwo",                  "innovations_count": 1},
    {"powiat": "gorlicki",     "gap_score": 6.8, "top_area": "zdrowie",                  "innovations_count": 1},
    {"powiat": "krakowski",    "gap_score": 1.9, "top_area": "seniorzy",                 "innovations_count": 8},
    {"powiat": "limanowski",   "gap_score": 7.5, "top_area": "niepełnosprawność",        "innovations_count": 1},
    {"powiat": "miechowski",   "gap_score": 7.8, "top_area": "ubóstwo",                  "innovations_count": 1},
    {"powiat": "myślenicki",   "gap_score": 3.6, "top_area": "zdrowie psychiczne",       "innovations_count": 4},
    {"powiat": "nowosądecki",  "gap_score": 5.4, "top_area": "seniorzy",                 "innovations_count": 2},
    {"powiat": "nowotarski",   "gap_score": 6.1, "top_area": "bezdomność",               "innovations_count": 1},
    {"powiat": "olkuski",      "gap_score": 5.0, "top_area": "rynek pracy",              "innovations_count": 2},
    {"powiat": "oświęcimski",  "gap_score": 3.8, "top_area": "zdrowie",                  "innovations_count": 3},
    {"powiat": "proszowicki",  "gap_score": 8.1, "top_area": "ubóstwo",                  "innovations_count": 1},
    {"powiat": "suski",        "gap_score": 7.0, "top_area": "dostęp do usług",          "innovations_count": 1},
    {"powiat": "tarnowski",    "gap_score": 5.5, "top_area": "rodzina i piecza",         "innovations_count": 2},
    {"powiat": "tatrzański",   "gap_score": 4.5, "top_area": "integracja cudzoziemców",  "innovations_count": 2},
    {"powiat": "wadowicki",    "gap_score": 4.1, "top_area": "seniorzy",                 "innovations_count": 3},
    {"powiat": "wielicki",     "gap_score": 3.3, "top_area": "zdrowie psychiczne",       "innovations_count": 4},
]

MOCK_STATS_MALOPOLSKA = {
    # Źródło: Mapa Wyzwań Społecznych ROPS Kraków 2024, GUS, NFZ
    "aging_pct": 22.4,            # % osób 65+ w populacji Małopolski (GUS 2024)
    "loneliness_pct": 31.2,       # % seniorów 65+ w jednoosobowych gospodarstwach (NSP 2021)
    "digital_exclusion_pct": 68.0,# % osób 65+ bez umiejętności cyfrowych (GUS 2023)
    "poverty_per_10k": 660,       # ubóstwo skrajne: 6,6% = ok. 660 na 10 tys. gosp. (GUS 2023)
    "mental_health_facilities": 23,
    "disability_count": 540000,   # szacunek dla Małopolski (14,3% z ~3,8 mln = ~543 tys.)
    "homeless_youth_pct": 25.0,   # % bezdomnych poniżej 25 r.ż. (DODAJ MNIE 2023)
    "disability_employment_pct": 30.1, # % zatrudnionych z niepełnosprawnością 16–64 (GUS 2023)
    "extreme_poverty_pct": 6.6,   # % gosp. w ubóstwie skrajnym (GUS 2023)
    "mental_health_nfz_pct": 3.0, # % wydatków NFZ na psychiatrię (OECD 2023)
    "youth_suicide_growth_pct": 18.7, # % wzrost prób samobójczych wśród dzieci r/r (UNAWEZA 2023)
    "foster_care_growth_pct": 3.5, # % wzrost dzieci w pieczy zastępczej (GUS 2023)
    "source_year": 2024,
    "source": "Mapa Wyzwań Społecznych ROPS Kraków 2024 / GUS / NFZ / NSP 2021",
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

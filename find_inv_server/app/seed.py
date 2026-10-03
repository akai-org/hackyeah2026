"""Dane PRZYKŁADOWE, żeby frontend miał co pokazać od pierwszego uruchomienia.

To nie są prawdziwe dane ROPS – przed prezentacją podmień je przez
POST /api/admin/resources/import albo wyłącz SEED_DEMO_DATA w .env.
"""

import random
from datetime import timedelta

from sqlmodel import Session, select

from app.models import Area, Need, ReporterType, ResourceCreate, ResourceType, SearchLog, utcnow
from app.services import create_resource

DEMO_SOURCE = "Dane przykładowe – do podmiany"

AREAS = [
    ("seniorzy", "Seniorzy i starzenie się", "Samotność, opieka długoterminowa, aktywność osób starszych.", "elderly"),
    ("niepelnosprawnosc", "Osoby z niepełnosprawnościami", "Niezależne życie, dostępność, wsparcie opiekunów.", "accessibility"),
    ("rodzina", "Rodzina i dzieci", "Wsparcie rodzin, piecza zastępcza, przeciwdziałanie przemocy.", "family"),
    ("zdrowie-psychiczne", "Zdrowie psychiczne", "Profilaktyka, kryzysy psychiczne, wsparcie dzieci i młodzieży.", "psychology"),
    ("ubostwo", "Ubóstwo i wykluczenie", "Bezdomność, ubóstwo energetyczne, wykluczenie społeczne.", "home"),
    ("aktywizacja-zawodowa", "Aktywizacja zawodowa", "Ekonomia społeczna, powrót na rynek pracy.", "work"),
    ("migranci", "Migranci i integracja", "Włączanie osób z doświadczeniem migracji.", "public"),
]

RESOURCES = [
    ResourceCreate(
        type=ResourceType.challenge,
        title="Starzejąca się Małopolska",
        summary="Rośnie liczba osób 65+, a wraz z nią zapotrzebowanie na usługi opiekuńcze.",
        content="## Wyzwanie\nPrzykładowy opis wyzwania na bazie raportu o kondycji regionu.",
        facts=[{"label": "Przykładowy wskaźnik", "value": "—"}],
        tags=["opieka", "samotność", "usługi społeczne"],
        source=DEMO_SOURCE,
        area_slugs=["seniorzy"],
    ),
    ResourceCreate(
        type=ResourceType.challenge,
        title="Kryzys zdrowia psychicznego młodzieży",
        summary="Długie kolejki do psychiatrów dziecięcych i rosnąca liczba kryzysów.",
        tags=["młodzież", "profilaktyka", "szkoła"],
        source=DEMO_SOURCE,
        area_slugs=["zdrowie-psychiczne", "rodzina"],
    ),
    ResourceCreate(
        type=ResourceType.challenge,
        title="Ubóstwo energetyczne na wsi",
        summary="Gospodarstwa domowe, których nie stać na ogrzanie mieszkania.",
        tags=["energia", "obszary wiejskie"],
        region="powiat nowotarski",
        source=DEMO_SOURCE,
        area_slugs=["ubostwo", "seniorzy"],
    ),
    ResourceCreate(
        type=ResourceType.innovation,
        title="Sąsiedzka sieć wsparcia seniorów",
        summary="Wolontariusze z okolicy regularnie odwiedzają samotnych seniorów i pomagają w codziennych sprawach.",
        content="## Jak to działa\n1. Rekrutacja wolontariuszy\n2. Dobór par\n3. Stałe spotkania",
        tags=["wolontariat", "samotność", "sąsiedztwo"],
        video_url="https://www.youtube.com/watch?v=PRZYKLAD",
        source=DEMO_SOURCE,
        area_slugs=["seniorzy"],
    ),
    ResourceCreate(
        type=ResourceType.innovation,
        title="Mieszkanie treningowe dla osób z niepełnosprawnością",
        summary="Nauka samodzielnego życia w bezpiecznych warunkach, z asystentem.",
        tags=["mieszkalnictwo", "samodzielność", "asystencja"],
        source=DEMO_SOURCE,
        area_slugs=["niepelnosprawnosc"],
    ),
    ResourceCreate(
        type=ResourceType.innovation,
        title="Szkolny punkt pierwszej pomocy psychologicznej",
        summary="Dyżury psychologa i przeszkolonych rówieśników w szkole.",
        tags=["młodzież", "szkoła", "wsparcie rówieśnicze"],
        video_url="https://www.youtube.com/watch?v=PRZYKLAD2",
        source=DEMO_SOURCE,
        area_slugs=["zdrowie-psychiczne"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Czym jest innowacja społeczna? Przewodnik dla początkujących",
        summary="Od pomysłu do testowania rozwiązania – krok po kroku.",
        tags=["podstawy", "przewodnik"],
        source=DEMO_SOURCE,
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Jak rozpoznać kryzys psychiczny u nastolatka",
        summary="Materiał dla rodziców i nauczycieli.",
        tags=["młodzież", "rodzice", "nauczyciele"],
        source=DEMO_SOURCE,
        area_slugs=["zdrowie-psychiczne", "rodzina"],
    ),
    ResourceCreate(
        type=ResourceType.education,
        title="Spółdzielnia socjalna – jak założyć",
        summary="Ekonomia społeczna jako droga powrotu na rynek pracy.",
        tags=["ekonomia społeczna", "praca"],
        source=DEMO_SOURCE,
        area_slugs=["aktywizacja-zawodowa", "ubostwo"],
    ),
]

DEMO_NEEDS = {
    "seniorzy": ["Brak opieki wytchnieniowej dla opiekunów", "Samotność starszych osób na wsi", "Za mało usług opiekuńczych"],
    "zdrowie-psychiczne": ["Długie terminy do psychologa dziecięcego", "Brak wsparcia w kryzysie w szkole"],
    "ubostwo": ["Nie stać nas na opał", "Brak miejsc w noclegowni zimą"],
    "niepelnosprawnosc": ["Brak asystentów osobistych"],
    None: ["Nie wiem, gdzie szukać pomocy dla sąsiada"],
}
REGIONS = ["Kraków", "powiat nowotarski", "powiat tarnowski", "powiat oświęcimski", None]


def seed(session: Session) -> None:
    if session.exec(select(Area)).first():
        return  # baza już ma dane

    areas = {slug: Area(slug=slug, name=name, description=desc, icon=icon) for slug, name, desc, icon in AREAS}
    session.add_all(areas.values())
    session.flush()

    for data in RESOURCES:
        create_resource(session, data)

    # Zgłoszenia i wyszukiwania rozłożone na ~4 miesiące, z narastającą liczbą zgłoszeń
    # w zdrowiu psychicznym, żeby wykres trendów nie był pusty.
    rng = random.Random(42)
    now = utcnow()
    for slug, texts in DEMO_NEEDS.items():
        count = 30 if slug == "zdrowie-psychiczne" else 12
        for _ in range(count):
            # Większy nacisk na ostatnie dni dla rosnącego obszaru.
            age = rng.triangular(0, 120, 0 if slug == "zdrowie-psychiczne" else 60)
            session.add(
                Need(
                    description=rng.choice(texts),
                    area_id=areas[slug].id if slug else None,
                    region=rng.choice(REGIONS),
                    reporter_type=rng.choice(list(ReporterType)),
                    created_at=now - timedelta(days=age),
                )
            )
    for query, area_slug, results in [
        ("opieka wytchnieniowa", "seniorzy", 0),
        ("psycholog dla dziecka", "zdrowie-psychiczne", 2),
        ("samotność", None, 2),
        ("asystent osobisty", "niepelnosprawnosc", 1),
        ("ubóstwo energetyczne", None, 1),
        ("mieszkanie wspomagane", None, 0),
    ]:
        for _ in range(rng.randint(2, 9)):
            session.add(
                SearchLog(
                    query=query,
                    area_id=areas[area_slug].id if area_slug else None,
                    results=results,
                    created_at=now - timedelta(days=rng.uniform(0, 120)),
                )
            )
    session.commit()

"""
Demo danych analitycznych: zdarzenia z ostatnich 30 dni + komentarze pod innowacjami,
żeby wykresy w /admin/zaangazowanie nie były puste na pokazie.
Kilka innowacji jest celowo „na fali” (skok wyświetleń w ostatnim tygodniu).

Uruchom z katalogu find_inv_server/ (po seedzie innowacji):
    python -m data.seed_events           # dopisuje dane demo (pomija, jeśli już są)
    python -m data.seed_events --reset   # usuwa poprzednie dane demo i generuje od nowa
"""

import asyncio
import json
import os
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import delete, func, select

from app.database import get_db, init_db
from app.models import Event, ForumPost, Innovation, SearchLog

DAYS = 30
DEMO_META = '"demo": true'

COMMENTS = [
    ("Wdrożyliśmy to u nas w gminie, seniorzy bardzo zadowoleni. Polecam zacząć od małej grupy.", "user"),
    ("Czy ktoś ma doświadczenie z finansowaniem tego z FIO? Szukamy partnera.", "consultant"),
    ("Testowałam w DPS — działa, ale trzeba przeszkolić personel, sama instrukcja nie wystarczy.", "tester"),
    ("Ile realnie kosztowało Was wdrożenie? W opisie jest „niski koszt”, ale nie wiem, czy to 2 czy 20 tys.", "user"),
    ("Dobre rozwiązanie dla gmin wiejskich, u nas kluczowy był transport uczestników.", "user"),
    ("Mamy materiały szkoleniowe z pilotażu, chętnie podeślę — proszę o kontakt przez ROPS.", "consultant"),
    ("Po 3 miesiącach widzimy wyraźnie mniej zgłoszeń interwencyjnych. Warto!", "tester"),
    ("Czy to się sprawdzi w mieście powyżej 50 tys. mieszkańców?", "user"),
]
AUTHORS = ["Anna K.", "Marek W.", "Ewa S.", "Tomasz B.", "Katarzyna P.", "Jan N.", "Zofia M."]
QUERIES = [
    "samotny senior na wsi", "brak transportu do lekarza", "dzieci po szkole nie mają gdzie iść",
    "seniorzy nie umieją korzystać z internetu", "opiekunowie osób z demencją są wypaleni",
    "młodzież bez pracy w małej gminie", "integracja uchodźców z Ukrainy", "przemoc w rodzinie",
    "kryzys psychiczny u nastolatków", "bezdomność zimą", "dostępność urzędu dla niewidomych",
    "uzależnienie od telefonu u dzieci",
]
SOURCES = ["wyniki"] * 6 + ["mapa"] * 2 + ["biblioteka"]


def _at(day_offset: int) -> datetime:
    """Losowa godzina w dniu (0 = dziś), UTC jak CURRENT_TIMESTAMP w SQLite."""
    base = datetime.now(timezone.utc).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=day_offset)
    when = base + timedelta(hours=random.randint(7, 21), minutes=random.randint(0, 59))
    return min(when, datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1))


def _events_for_day(
    day: int, innovation_ids: list[int], hot: set[int], visitors: list[str], tag_pool: list[str], searches_out: list
) -> list[Event]:
    events: list[Event] = []
    growth = 1 + (DAYS - day) / DAYS  # ruch rośnie z czasem: ×1 → ×2
    searches = int(random.randint(6, 10) * growth)

    def add(type_: str, innovation_id: int, anon: str, **meta) -> None:
        events.append(
            Event(
                type=type_,
                innovation_id=innovation_id,
                anon_id=anon,
                meta=json.dumps({"demo": True, **meta}),
                created_at=_at(day),
            )
        )

    for _ in range(searches):
        anon = random.choice(visitors)
        query = random.choice(QUERIES)
        tags = random.sample(tag_pool, k=min(random.randint(1, 3), len(tag_pool)))
        # ~8% zapytań bez wyników — trafiają do „Luk” w trendach.
        searches_out.append(
            SearchLog(query=query, tags=json.dumps(tags, ensure_ascii=False), results_count=0 if random.random() < 0.08 else 5, created_at=_at(day))
        )
        # W ostatnim tygodniu „gorące” innowacje częściej trafiają do wyników.
        pool = innovation_ids + (list(hot) * 6 if day < 7 else [])
        shown = random.sample(pool, k=min(5, len(set(pool))))
        for pos, innovation_id in enumerate(dict.fromkeys(shown), 1):
            add("card_impression", innovation_id, anon, position=pos)
            # Wyższe pozycje klikane częściej.
            if random.random() < 0.38 / pos ** 0.6:
                add("card_click", innovation_id, anon, source=random.choice(SOURCES), position=pos)
                if random.random() < 0.9:
                    add("innovation_view", innovation_id, anon, source="wyniki")
                    if random.random() < 0.18:
                        add("cta_click", innovation_id, anon, button="wdrozenie")
                        add("middleman_start", innovation_id, anon)
                        if random.random() < 0.6:
                            add("middleman_plan", innovation_id, anon)
                    if random.random() < 0.12:
                        add("cta_click", innovation_id, anon, button=random.choice(["zrodlo", "materialy", "zostan_testerem"]))

    # Wejścia bezpośrednie (link, biblioteka).
    for _ in range(int(random.randint(2, 6) * growth)):
        innovation_id = random.choice(innovation_ids + (list(hot) * 4 if day < 7 else []))
        add("innovation_view", innovation_id, random.choice(visitors), source="bezposrednio")
    return events


async def seed(reset: bool = False) -> None:
    await init_db()
    random.seed(2026)

    async with get_db() as db:
        if reset:
            await db.execute(delete(Event).where(Event.meta.contains(DEMO_META)))
            await db.execute(delete(SearchLog).where(SearchLog.query.in_(QUERIES)))
            # Komentarze demo rozpoznajemy po treści — nie oznaczamy ich, bo są widoczne na kartach.
            await db.execute(
                delete(ForumPost).where(
                    ForumPost.innovation_id.is_not(None), ForumPost.content.in_([text for text, _ in COMMENTS])
                )
            )
            await db.commit()
        elif (await db.execute(select(func.count()).select_from(Event).where(Event.meta.contains(DEMO_META)))).scalar():
            print("Dane demo zdarzeń już są — pomijam. Użyj --reset, żeby wygenerować od nowa.")
            return

        innovation_ids = list(
            (await db.execute(select(Innovation.id).where(Innovation.status == "active").limit(40))).scalars()
        )
        if not innovation_ids:
            print("BŁĄD: brak innowacji w bazie. Najpierw: python -m data.seed_innovations")
            return

        hot = set(random.sample(innovation_ids, k=min(3, len(innovation_ids))))
        visitors = [str(uuid.uuid4()) for _ in range(180)]

        # Popyt mocno na kilku tematach (seniorzy, samotność…), żeby „popyt a podaż” pokazał luki.
        tag_pool = ["seniorzy"] * 6 + ["samotność"] * 4 + ["transport"] * 4 + ["zdrowie_psychiczne"] * 3 + [
            "wykluczenie_cyfrowe", "młodzież", "dzieci", "migranci", "uzależnienia", "bezdomność", "dostępność",
        ] * 2
        total, searches = 0, []
        for day in range(DAYS - 1, -1, -1):
            events = _events_for_day(day, innovation_ids, hot, visitors, tag_pool, searches)
            db.add_all(events)
            total += len(events)
        db.add_all(searches)

        comments = 0
        for day in range(DAYS - 1, -1, -1):
            for _ in range(random.choices([0, 1, 2, 3], weights=[3, 4, 2, 1])[0]):
                text, badge = random.choice(COMMENTS)
                db.add(
                    ForumPost(
                        innovation_id=random.choice(innovation_ids + (list(hot) * 3 if day < 7 else [])),
                        content=text,
                        author_name=random.choice(AUTHORS),
                        badge=badge,
                        created_at=_at(day),
                    )
                )
                comments += 1

        await db.commit()

        titles = (await db.execute(select(Innovation.title).where(Innovation.id.in_(hot)))).scalars().all()
    print(f"[DONE] {total} zdarzeń, {len(searches)} wyszukiwań i {comments} komentarzy z ostatnich {DAYS} dni.")
    print("Na fali: " + ", ".join(titles))


if __name__ == "__main__":
    asyncio.run(seed("--reset" in sys.argv))

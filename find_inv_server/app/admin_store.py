"""Dane panelu admina (A5): innowacje, użytkownicy, testerzy, logi wyszukiwań.

Do czasu modeli od A1 (app/models.py + app/database.py) dane żyją w pamięci procesu,
startują z data/mock_data.py i zmiany (statusy, role, zatwierdzenia) trwają do restartu.
Router woła tylko funkcje z tego pliku — przejście na SQLite to podmiana ich ciał.
"""

import copy
import random
from collections import Counter
from datetime import UTC, datetime, timedelta
from threading import Lock

from data.mock_data import MOCK_INNOVATIONS

INNOVATION_STATUSES = ("pending", "active", "archived", "unmaintained")
ASSIGNABLE_ROLES = ("user", "tester", "consultant")

_lock = Lock()


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(value: datetime) -> str:
    return value.replace(microsecond=0).isoformat()


# ── Seed ─────────────────────────────────────────────────

# Id 6–9 jak w find_inv/data/innovations.ts (frontend A4) — Middleman dostaje id z kart i musi trafić w tę samą innowację.
# Kolejne to zgłoszenia czekające na weryfikację ROPS i przykłady pozostałych statusów.
_EXTRA_INNOVATIONS = [
    {
        "title": "Gminny bus na telefon",
        "short_desc": "Przejazdy do lekarza zamawiane dzień wcześniej, łączone w jedną trasę",
        "category": "transport",
        "area": "dostępność usług",
        "target_group": "seniorzy i osoby z niepełnosprawnościami",
        "location": "gmina wiejska",
        "status": "pending",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "where_implemented": "gmina Pcim",
        "tags": ["transport", "seniorzy", "gmina_wiejska", "dostępność"],
    },
    {
        "title": "Punkt wsparcia po lekcjach",
        "short_desc": "Dyżur psychologa w szkole bez zapisów, dwa razy w tygodniu",
        "category": "zdrowie psychiczne",
        "area": "edukacja",
        "target_group": "młodzież 13–18 lat",
        "location": "Nowy Targ",
        "status": "pending",
        "cost_level": "medium",
        "implementation_time_months": 2,
        "where_implemented": "pilotaż w 2 szkołach",
        "tags": ["młodzież", "zdrowie_psychiczne", "edukacja"],
    },
    {
        "title": "Klub Rodzica w świetlicy",
        "short_desc": "Spotkania i warsztaty dla rodziców małych dzieci w świetlicy wiejskiej",
        "full_desc": "Cotygodniowe spotkania rodziców z dziećmi do 6 lat. Prowadzą je asystent rodziny i wolontariusze. "
        "W programie zabawy rozwojowe, porady położnej i wymiana ubrań dziecięcych.",
        "category": "rodzina",
        "area": "wsparcie rodziny",
        "target_group": "rodziny z małymi dziećmi",
        "location": "gmina wiejska",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 1,
        "where_implemented": "gminy powiatu miechowskiego",
        "tags": ["rodzina", "dzieci", "gmina_wiejska", "wolontariat", "samotność"],
    },
    {
        "title": "Mentor dla migranta",
        "short_desc": "Wolontariusze pomagają nowym mieszkańcom w urzędach, szkole i pracy",
        "full_desc": "Każda rodzina migrancka dostaje mentora z sąsiedztwa na pierwsze 3 miesiące. Mentor pomaga w "
        "załatwieniu PESEL, zapisaniu dzieci do szkoły i szukaniu pracy. Koordynacja przez CUS lub NGO.",
        "category": "integracja",
        "area": "włączenie społeczne",
        "target_group": "migranci i uchodźcy",
        "location": "Kraków",
        "status": "active",
        "cost_level": "low",
        "implementation_time_months": 2,
        "where_implemented": "Kraków, Wieliczka",
        "tags": ["migranci", "wolontariat", "rynek_pracy", "CUS", "NGO"],
    },
    {
        "title": "Wspólna kuchnia w świetlicy",
        "short_desc": "Cotygodniowe wspólne gotowanie, posiłki dowożone sąsiadom",
        "category": "samotność",
        "area": "wsparcie społeczne",
        "target_group": "mieszkańcy wsi, seniorzy",
        "location": "gmina wiejska",
        "status": "pending",
        "cost_level": "low",
        "implementation_time_months": 1,
        "where_implemented": "KGW w powiecie limanowskim",
        "tags": ["samotność", "seniorzy", "wolontariat", "gmina_wiejska"],
    },
    {
        "title": "Mieszkanie treningowe",
        "short_desc": "Usamodzielnianie osób z niepełnosprawnością intelektualną",
        "category": "niepełnosprawność",
        "area": "mieszkalnictwo wspomagane",
        "target_group": "dorośli z niepełnosprawnością intelektualną",
        "location": "Tarnów",
        "status": "active",
        "cost_level": "high",
        "implementation_time_months": 8,
        "where_implemented": "Tarnów, Gorlice",
        "tags": ["niepełnosprawność", "OPS", "samorząd"],
    },
    {
        "title": "Kawiarenka integracyjna",
        "short_desc": "Zatrudnienie wspomagane osób z niepełnosprawnościami w lokalu gastronomicznym",
        "category": "rynek pracy",
        "area": "ekonomia społeczna",
        "target_group": "osoby z niepełnosprawnościami",
        "location": "Kraków",
        "status": "archived",
        "cost_level": "high",
        "implementation_time_months": 10,
        "where_implemented": "Kraków (projekt zakończony 2023)",
        "tags": ["rynek_pracy", "niepełnosprawność", "NGO"],
    },
    {
        "title": "Teleopieka z opaską SOS",
        "short_desc": "Opaska z przyciskiem alarmowym połączona z centrum CUS",
        "category": "bezpieczeństwo",
        "area": "usługi opiekuńcze",
        "target_group": "seniorzy mieszkający samotnie",
        "location": "Wieliczka",
        "status": "active",
        "cost_level": "medium",
        "implementation_time_months": 3,
        "where_implemented": "Wieliczka, Niepołomice",
        "tags": ["seniorzy", "samotność", "CUS"],
    },
]

_USERS_SEED = [
    ("Anna Kowalczyk", "admin"),
    ("Marek Zieliński", "consultant"),
    ("Katarzyna Nowak", "tester"),
    ("Piotr Wiśniewski", "user"),
    ("Fundacja Wspólna Gmina", "user"),
    ("Ewa Mazur", "tester"),
    ("Tomasz Lis", "user"),
    ("Magdalena Wójcik", "user"),
    ("GOPS Słomniki", "user"),
    ("Joanna Kamińska", "consultant"),
    ("Paweł Dudek", "user"),
]

# (user_id, organizacja, specjalizacja, zatwierdzony)
_TESTERS_SEED = [
    (3, "Stowarzyszenie Seniorzy w Akcji", "usługi dla seniorów", True),
    (6, "OPS Bochnia", "pomoc społeczna", True),
    (7, "Koło Gospodyń Wiejskich Racławice", "aktywizacja lokalna", False),
    (8, "Uniwersytet Trzeciego Wieku Tarnów", "edukacja dorosłych", False),
    (11, "Fundacja Dostępna Małopolska", "dostępność cyfrowa", False),
]

_SEARCH_QUERIES = [
    ("samotny senior na wsi, nikt go nie odwiedza", ["seniorzy", "samotność", "gmina_wiejska"]),
    ("brak transportu do lekarza", ["transport", "dostępność", "seniorzy"]),
    ("babcia nie umie obsługiwać telefonu", ["seniorzy", "wykluczenie_cyfrowe"]),
    ("młodzież w kryzysie psychicznym", ["młodzież", "zdrowie_psychiczne"]),
    ("dzieci po lekcjach nie mają gdzie iść", ["dzieci", "edukacja"]),
    ("osoba z niepełnosprawnością szuka pracy", ["niepełnosprawność", "rynek_pracy"]),
    ("rodzina w kryzysie, potrzebne wsparcie", ["rodzina", "OPS"]),
    ("wolontariusze do pomocy seniorom", ["wolontariat", "seniorzy"]),
    ("uzależnienie od alkoholu w gminie", ["uzależnienia"]),
    ("integracja migrantów z Ukrainy", ["migranci", "edukacja"]),
    ("bezdomność zimą", ["bezdomność", "ubóstwo"]),
    ("dostępność urzędu dla niewidomych", ["dostępność", "niepełnosprawność", "samorząd"]),
]
# Wagi zapytań — żeby wykres miał wyraźnego lidera, jak w prawdziwych danych.
_QUERY_WEIGHTS = [14, 11, 10, 7, 6, 5, 5, 4, 3, 2, 2, 2]


def _seed() -> dict:
    now = _now()
    innovations = []
    for i, item in enumerate(copy.deepcopy(MOCK_INNOVATIONS)):
        item.pop("match_score", None)
        item.pop("is_unmaintained", None)
        item["created_at"] = _iso(now - timedelta(days=60 - i * 3))
        item["updated_at"] = item["created_at"]
        innovations.append(item)
    next_id = max(item["id"] for item in innovations) + 1
    for i, extra in enumerate(_EXTRA_INNOVATIONS):
        item = {
            "id": next_id + i,
            "full_desc": extra.get("full_desc", extra["short_desc"]),
            "testers_count": 0 if extra["status"] == "pending" else 4 + i,
            "source_url": "https://rops.krakow.pl",
            **extra,
        }
        days_ago = 2 + i if extra["status"] == "pending" else 40 - i * 4
        item["created_at"] = _iso(now - timedelta(days=days_ago, hours=i * 3))
        item["updated_at"] = item["created_at"]
        innovations.append(item)

    users = [
        {"id": i + 1, "name": name, "role": role, "created_at": _iso(now - timedelta(days=30 - i * 2, hours=i))}
        for i, (name, role) in enumerate(_USERS_SEED)
    ]
    users_by_id = {u["id"]: u for u in users}
    testers = [
        {
            "id": i + 1,
            "user_id": user_id,
            "name": users_by_id[user_id]["name"],
            "email": _email(users_by_id[user_id]["name"]),
            "organization": org,
            "expertise": expertise,
            "approved": approved,
            "created_at": _iso(now - timedelta(days=12 - i * 2, hours=i * 5)),
        }
        for i, (user_id, org, expertise, approved) in enumerate(_TESTERS_SEED)
    ]

    # Deterministyczny „ruch” z ostatnich 14 dni, rosnący pod koniec — trend w górę ładnie wygląda na demo.
    rng = random.Random(2026)
    search_logs = []
    for days_ago in range(13, -1, -1):
        for _ in range(4 + (13 - days_ago) // 2 + rng.randint(0, 3)):
            query, tags = rng.choices(_SEARCH_QUERIES, weights=_QUERY_WEIGHTS)[0]
            search_logs.append(
                {
                    "id": len(search_logs) + 1,
                    "query": query,
                    "tags": list(tags),
                    "results_count": 0 if "bezdomność" in tags or "uzależnienia" in tags else rng.randint(2, 5),
                    "created_at": _iso(now - timedelta(days=days_ago, hours=rng.randint(0, 10), minutes=rng.randint(0, 59))),
                }
            )

    return {"innovations": innovations, "users": users, "testers": testers, "search_logs": search_logs}


def _email(name: str) -> str:
    table = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")
    return ".".join(name.translate(table).lower().split()[:2]) + "@example.pl"


_db = _seed()


def reset() -> None:
    """Przywraca dane startowe (testy, „Przywróć dane demo”)."""
    global _db
    with _lock:
        _db = _seed()


# ── Innowacje ────────────────────────────────────────────


def list_innovations(status: str | None = None, tags: list[str] | None = None, search: str | None = None) -> list[dict]:
    items = _db["innovations"]
    if status:
        items = [i for i in items if i["status"] == status]
    if tags:
        wanted = set(tags)
        items = [i for i in items if wanted & set(i["tags"])]
    if search:
        needle = search.lower()
        items = [
            i
            for i in items
            if needle in i["title"].lower()
            or needle in i["short_desc"].lower()
            or needle in (i.get("where_implemented") or "").lower()
        ]
    # Najpierw oczekujące na weryfikację, potem od najnowszych.
    newest_first = sorted(items, key=lambda i: i["created_at"], reverse=True)
    return sorted(newest_first, key=lambda i: i["status"] != "pending")


def get_innovation(innovation_id: int) -> dict | None:
    return next((i for i in _db["innovations"] if i["id"] == innovation_id), None)


def set_innovation_status(innovation_id: int, status: str) -> dict | None:
    with _lock:
        item = get_innovation(innovation_id)
        if item is None:
            return None
        item["status"] = status
        item["updated_at"] = _iso(_now())
        return item


# ── Użytkownicy i testerzy ───────────────────────────────


def list_users() -> list[dict]:
    pending = {t["user_id"] for t in _db["testers"] if not t["approved"]}
    return [{**u, "tester_pending": u["id"] in pending} for u in _db["users"]]


def get_user(user_id: int) -> dict | None:
    return next((u for u in _db["users"] if u["id"] == user_id), None)


def set_user_role(user_id: int, role: str) -> dict | None:
    with _lock:
        user = get_user(user_id)
        if user is None:
            return None
        user["role"] = role
        return user


def upsert_user(name: str, role: str) -> dict:
    """Rejestruje użytkownika z sesji (POST /api/auth/session od A1), żeby był widoczny w panelu."""
    with _lock:
        user = {"id": max((u["id"] for u in _db["users"]), default=0) + 1, "name": name, "role": role, "created_at": _iso(_now())}
        _db["users"].append(user)
        return user


def list_testers(approved: bool | None = None) -> list[dict]:
    items = _db["testers"]
    if approved is not None:
        items = [t for t in items if t["approved"] == approved]
    return sorted(items, key=lambda t: t["created_at"], reverse=True)


def approve_tester(tester_id: int) -> dict | None:
    with _lock:
        tester = next((t for t in _db["testers"] if t["id"] == tester_id), None)
        if tester is None:
            return None
        tester["approved"] = True
        user = get_user(tester["user_id"])
        if user and user["role"] != "admin":
            user["role"] = "tester"
        return tester


# ── Trendy i statystyki ──────────────────────────────────


def log_search(query: str, tags: list[str], results_count: int) -> None:
    """Do wywołania z matchmakingu (A2), żeby trendy rosły na żywo podczas demo."""
    with _lock:
        logs = _db["search_logs"]
        logs.append(
            {
                "id": len(logs) + 1,
                "query": query.strip()[:300],
                "tags": list(tags),
                "results_count": results_count,
                "created_at": _iso(_now()),
            }
        )


def trends(days: int = 14) -> dict:
    first_day = (_now() - timedelta(days=days - 1)).date()
    logs = [log for log in _db["search_logs"] if log["created_at"][:10] >= first_day.isoformat()]

    tag_counts = Counter(tag for log in logs for tag in log["tags"])
    query_counts = Counter(log["query"] for log in logs)
    zero_counts = Counter(log["query"] for log in logs if log["results_count"] == 0)
    day_counts = Counter(log["created_at"][:10] for log in logs)
    by_day = [
        {"date": (first_day + timedelta(days=offset)).isoformat(), "count": day_counts.get((first_day + timedelta(days=offset)).isoformat(), 0)}
        for offset in range(days)
    ]

    half = days // 2
    recent = sum(d["count"] for d in by_day[half:])
    previous = sum(d["count"] for d in by_day[:half])
    change_pct = round((recent - previous) / previous * 100, 1) if previous else None

    return {
        "top_tags": [{"tag": tag, "count": count} for tag, count in tag_counts.most_common(10)],
        "top_queries": [{"query": q, "count": c} for q, c in query_counts.most_common(8)],
        "zero_result_queries": [{"query": q, "count": c} for q, c in zero_counts.most_common(5)],
        "by_day": by_day,
        "total": len(logs),
        "change_pct": change_pct,
    }


def stats() -> dict:
    innovations = _db["innovations"]
    status_counts = Counter(i["status"] for i in innovations)
    today = _now().date().isoformat()
    return {
        "innovations": len(innovations),
        "innovations_by_status": {s: status_counts.get(s, 0) for s in INNOVATION_STATUSES},
        "users": len(_db["users"]),
        "testers": sum(1 for t in _db["testers"] if t["approved"]),
        "pending_testers": sum(1 for t in _db["testers"] if not t["approved"]),
        "searches": len(_db["search_logs"]),
        "searches_today": sum(1 for log in _db["search_logs"] if log["created_at"].startswith(today)),
    }

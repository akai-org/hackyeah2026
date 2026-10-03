from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import grants

client = TestClient(app)

OFERTA = "konkurs-seniorzy-2027"  # wzór: oferta realizacji zadania publicznego
MIKROGRANT = "mikrogranty-jesien-2026"  # wzór: mikrogrant

IDEA = {
    "title": "Spotkania cyfrowe młodzieży z seniorami",
    "short_desc": "Młodzież uczy seniorów obsługi smartfona.",
    "essence": "Raz w tygodniu w świetlicy licealiści pokazują seniorom, jak umówić wizytę u lekarza przez internet.",
    "problem": "Seniorzy nie umieją korzystać z e-usług.",
    "for_whom": "seniorzy z gminy",
    "place": "świetlica wiejska, gmina Racławice",
    "stage": "Pomysł, przed pilotażem",
    "budget": "ok. 5 tys. zł rocznie",
    "partners": "GOPS, szkoła",
    "tags": ["seniorzy", "wykluczenie_cyfrowe"],
}


@pytest.fixture
def status(monkeypatch):
    """Status naborów niezależny od dzisiejszej daty: status("open") ustawia wszystkie nabory na otwarte."""

    def set_status(value: str):
        monkeypatch.setattr(grants, "call_status", lambda call, now=None: value)

    return set_status


def test_call_status_follows_dates():
    call = {"opens_at": "2026-09-15T00:00:00+02:00", "closes_at": "2026-10-31T23:59:59+01:00"}
    assert grants.call_status(call, datetime(2026, 9, 14, 21, 59, tzinfo=timezone.utc)) == "upcoming"
    assert grants.call_status(call, datetime(2026, 9, 14, 22, 0, tzinfo=timezone.utc)) == "open"
    assert grants.call_status(call, datetime(2026, 10, 31, 22, 59, tzinfo=timezone.utc)) == "open"
    assert grants.call_status(call, datetime(2026, 10, 31, 23, 0, tzinfo=timezone.utc)) == "closed"


def test_list_grants_has_dates_status_and_sections():
    calls = client.get("/api/grants").json()["data"]
    assert calls
    order = {"open": 0, "upcoming": 1, "closed": 2}
    assert [order[c["status"]] for c in calls] == sorted(order[c["status"]] for c in calls)
    for call in calls:
        assert call["opens_at"] < call["closes_at"] and call["demo"] is True
        assert call["template"]["name"] and call["sections"]
        for section in call["sections"]:
            assert section["id"] and section["label"] and section["max_chars"] > 0


def test_fill_from_card_without_llm_uses_card_fields(status):
    status("open")
    data = client.post("/api/grants/fill", json={"grant_id": OFERTA, "idea": IDEA}).json()["data"]
    sections = data["sections"]
    assert data["source"] == "rules"
    assert sections["tytul"] == IDEA["title"]
    assert "Racławice" in sections["opis"]
    assert "5 tys. zł" in sections["koszty"]
    assert "GOPS" in sections["zasoby"]
    # Harmonogramu nie ma w fiszce — szkielet do uzupełnienia, nie zmyślone dane.
    assert "harmonogram" in data["missing"] and "[do uzupełnienia" in sections["harmonogram"]


def test_fill_from_plain_text_and_limits(status):
    status("upcoming")  # przed otwarciem naboru wniosek da się już przygotować
    text = "Chcę zorganizować w świetlicy wiejskiej w gminie Racławice spotkania dla seniorów. " * 80
    data = client.post("/api/grants/fill", json={"grant_id": MIKROGRANT, "idea": text}).json()["data"]
    assert data["sections"]["tytul"]
    assert len(data["sections"]["dzialania"]) <= 1500


def test_fill_errors(status):
    status("open")
    assert client.post("/api/grants/fill", json={"grant_id": "nie-ma", "idea": IDEA}).json()["error"]
    assert client.post("/api/grants/fill", json={"grant_id": MIKROGRANT, "idea": "krótko"}).json()["error"]
    status("closed")
    assert "zakończony" in client.post("/api/grants/fill", json={"grant_id": OFERTA, "idea": IDEA}).json()["error"]


def _complete_sections(grant_id: str) -> dict:
    call = next(c for c in client.get("/api/grants").json()["data"] if c["id"] == grant_id)
    return {section["id"]: f"Treść sekcji {section['label']}" for section in call["sections"]}


def _application(grant_id: str, **overrides) -> dict:
    body = {"applicant_name": "Stowarzyszenie Razem", "applicant_email": "kontakt@razem.pl",
            "organization": "KGW Racławice", "sections": _complete_sections(grant_id)}
    return {**body, **overrides}


def test_submit_only_while_call_is_open(status):
    status("open")
    ok = client.post(f"/api/grants/{OFERTA}/applications", json=_application(OFERTA)).json()
    assert ok["error"] is None and ok["data"]["id"] and ok["data"]["grant_id"] == OFERTA

    status("upcoming")
    early = client.post(f"/api/grants/{OFERTA}/applications", json=_application(OFERTA)).json()
    assert early["data"] is None and "jeszcze się nie rozpoczął" in early["error"]

    status("closed")
    late = client.post(f"/api/grants/{OFERTA}/applications", json=_application(OFERTA)).json()
    assert late["data"] is None and "zakończył się" in late["error"]


def test_submit_rejects_incomplete_application(status):
    status("open")
    sections = _complete_sections(MIKROGRANT)
    sections["budzet"] = "[do uzupełnienia: kwota]"
    incomplete = client.post(f"/api/grants/{MIKROGRANT}/applications",
                             json=_application(MIKROGRANT, sections=sections)).json()
    assert "niekompletny" in incomplete["error"]
    bad_email = client.post(f"/api/grants/{MIKROGRANT}/applications",
                            json=_application(MIKROGRANT, applicant_email="brak")).json()
    assert "e-mail" in bad_email["error"]
    assert client.post("/api/grants/nie-ma/applications", json=_application(MIKROGRANT)).json()["error"]

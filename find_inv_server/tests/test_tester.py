import asyncio

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import Innovation

client = TestClient(app)


def _session(role: str, name: str = "Anna Testerka") -> dict:
    token = client.post("/api/auth/session", json={"name": name, "role": role}).json()["data"]["session_token"]
    # Cookie sesji ma pierwszeństwo przed nagłówkiem, a TestClient je zapamiętuje — sesję wybieramy nagłówkiem.
    client.cookies.clear()
    return {"X-Session-Token": token}


def _innovation() -> int:
    async def create() -> int:
        async with get_db() as db:
            innovation = Innovation(title="Spotkania sąsiedzkie", short_desc="Dla samotnych seniorów")
            db.add(innovation)
            await db.commit()
            return innovation.id

    return asyncio.run(create())


FEEDBACK = {"rating": 4, "what_worked": "Seniorzy przychodzą co tydzień", "improvements": "Dłuższe godziny"}


def test_requires_roles():
    assert client.get("/api/tester/tests").status_code == 401
    assert client.get("/api/tester/tests", headers=_session("user")).status_code == 403
    assert client.get("/api/admin/test-requests", headers=_session("tester")).status_code == 403


def test_request_assign_feedback():
    tester, admin = _session("tester"), _session("admin", "ROPS")
    innovation_id = _innovation()

    requested = client.post(
        "/api/tester/tests", json={"innovation_id": innovation_id, "motivation": "Prowadzę klub seniora"}, headers=tester
    )
    assert requested.status_code == 200
    report = requested.json()["data"]
    assert report["status"] == "requested" and report["motivation"] == "Prowadzę klub seniora"

    assert client.post("/api/tester/tests", json={"innovation_id": innovation_id}, headers=tester).status_code == 409
    assert client.post("/api/tester/tests", json={"innovation_id": 999999}, headers=tester).status_code == 404

    # Przed przypisaniem przez admina nie da się wystawić oceny.
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=tester).status_code == 409

    pending = client.get("/api/admin/test-requests?status=requested", headers=admin).json()["data"]
    assert report["id"] in [r["id"] for r in pending]
    assigned = client.post(f"/api/admin/test-requests/{report['id']}/assign", headers=admin).json()["data"]
    assert assigned["status"] == "assigned" and assigned["tester_name"] == "Anna Testerka"
    assert client.post(f"/api/admin/test-requests/{report['id']}/reject", headers=admin).status_code == 409

    bad = {**FEEDBACK, "rating": 6}
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=bad, headers=tester).status_code == 422
    sent = client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=tester).json()["data"]
    assert sent["status"] == "submitted" and sent["rating"] == 4 and sent["improvements"] == "Dłuższe godziny"
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=tester).status_code == 409

    # Inny tester nie widzi cudzych testów.
    other = _session("tester", "Inny Tester")
    assert client.get("/api/tester/tests", headers=other).json()["data"] == []
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=other).status_code == 404


def test_reject():
    tester, admin = _session("tester", "Odrzucony Tester"), _session("admin", "ROPS")
    report = client.post("/api/tester/tests", json={"innovation_id": _innovation()}, headers=tester).json()["data"]
    rejected = client.post(f"/api/admin/test-requests/{report['id']}/reject", headers=admin).json()["data"]
    assert rejected["status"] == "rejected"
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=tester).status_code == 409


def test_relogin_keeps_assigned_tests():
    tester, admin = _session("tester", "Powracający Tester"), _session("admin", "ROPS")
    report = client.post("/api/tester/tests", json={"innovation_id": _innovation()}, headers=tester).json()["data"]
    client.post(f"/api/admin/test-requests/{report['id']}/assign", headers=admin)

    again = _session("tester", "Powracający Tester")
    mine = client.get("/api/tester/tests", headers=again).json()["data"]
    assert [(r["id"], r["status"]) for r in mine] == [(report["id"], "assigned")]


def test_admin_unassigns_tester():
    tester, admin = _session("tester", "Zdejmowany Tester"), _session("admin", "ROPS")
    report = client.post("/api/tester/tests", json={"innovation_id": _innovation()}, headers=tester).json()["data"]
    # Zdjąć można tylko przypisanego testera.
    assert client.post(f"/api/admin/test-requests/{report['id']}/unassign", headers=admin).status_code == 409
    client.post(f"/api/admin/test-requests/{report['id']}/assign", headers=admin)
    assert client.post(f"/api/admin/test-requests/{report['id']}/unassign", headers=tester).status_code == 403

    removed = client.post(f"/api/admin/test-requests/{report['id']}/unassign", headers=admin).json()["data"]
    assert removed["status"] == "rejected"
    mine = client.get("/api/tester/tests", headers=tester).json()["data"]
    assert mine[0]["status"] == "rejected"
    assert client.post(f"/api/tester/tests/{report['id']}/feedback", json=FEEDBACK, headers=tester).status_code == 409


def test_apply_modal_creates_test_request():
    tester, admin = _session("tester", "Gość z popupu"), _session("admin", "ROPS")
    innovation_id = _innovation()
    body = {"name": "Ewa Nowak", "email": "ewa@gmina.pl", "innovation_id": innovation_id}

    sent = client.post("/api/testerzy", json=body, headers=tester)
    assert sent.status_code == 200 and sent.json()["data"]["test_request_id"]
    assert client.post("/api/testerzy", json=body, headers=tester).status_code == 409

    pending = client.get("/api/admin/test-requests?status=requested", headers=admin).json()["data"]
    row = next(r for r in pending if r["innovation_id"] == innovation_id)
    assert row["tester_name"] == "Ewa Nowak" and row["tester_email"] == "ewa@gmina.pl"

    client.post(f"/api/admin/test-requests/{row['id']}/assign", headers=admin)
    mine = client.get("/api/tester/tests", headers=tester).json()["data"]
    assert [(r["innovation_id"], r["status"]) for r in mine] == [(innovation_id, "assigned")]

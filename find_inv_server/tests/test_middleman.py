import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _events(response) -> list:
    events = []
    for line in response.text.splitlines():
        if line.startswith("data: ") and line != "data: [DONE]":
            events.append(json.loads(line[6:]))
    assert response.text.rstrip().endswith("data: [DONE]")
    return events


def test_full_flow_ends_with_plan_after_three_questions():
    start = client.post("/api/middleman/start", json={"innovation_id": 2, "problem_desc": "samotni seniorzy"}).json()["data"]
    # Tytuł z tego samego magazynu, którego używa Middleman (katalog ROPS albo mocki) — test nie zależy od danych.
    from app import admin_store

    assert start["first_question"] and start["innovation"]["title"] == admin_store.get_innovation(2)["title"]
    sid = start["session_id"]

    q2 = _events(client.post("/api/middleman/answer", json={"session_id": sid, "answer": "GOPS, 2 osoby"}))
    assert q2[-1]["type"] == "question" and q2[-1]["index"] == 2
    q3 = _events(client.post("/api/middleman/answer", json={"session_id": sid, "answer": "10 tys. zł, KGW"}))
    assert q3[-1]["type"] == "question" and q3[-1]["index"] == 3
    final = _events(client.post("/api/middleman/answer", json={"session_id": sid, "answer": "20 osób, świetlica"}))
    plan = final[-1]
    assert plan["type"] == "plan"
    for key in ("staff_needed", "estimated_cost", "location_suggestions", "steps", "timeline", "funding_hints"):
        assert plan["content"][key]
    assert "20 osób" in plan["content"]["goal"]


def test_finish_early_and_unknown_innovation():
    start = client.post(
        "/api/middleman/start", json={"innovation_id": "sasiedzki-telefon", "innovation_title": "Sąsiedzki telefon"}
    ).json()["data"]
    events = _events(client.post("/api/middleman/answer", json={"session_id": start["session_id"], "finish": True}))
    assert events[-1]["type"] == "plan"
    assert events[-1]["content"]["source"]["title"] == "Sąsiedzki telefon"


def test_expired_session():
    events = _events(client.post("/api/middleman/answer", json={"session_id": "nope", "answer": "x"}))
    assert events[0]["type"] == "error"


def test_accepts_frontend_contract_fields():
    start = client.post(
        "/api/middleman/start",
        json={"innovation_id": 8, "institution_type": "Gmina wiejska", "location": "Racławice", "problem_desc": "rodziny"},
    ).json()["data"]
    assert start["innovation"]["title"] == "Klub Rodzica w świetlicy"
    plan = _events(client.post("/api/middleman/answer", json={"session_id": start["session_id"], "finish": True}))[-1]
    assert "Racławice" in plan["content"]["goal"] and "Racławice" in plan["content"]["location_suggestions"]

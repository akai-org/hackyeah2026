import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_tag_returns_envelope():
    body = client.post("/api/tag", json={"text": "samotny senior na wsi"}).json()
    assert body["error"] is None
    assert {"tags", "is_relevant"} <= body["data"].keys()


def test_tag_rejects_empty_text():
    body = client.post("/api/tag", json={"text": "   "}).json()
    assert body == {"data": None, "error": "Pusty opis problemu"}


def test_match_returns_cards_with_flags():
    body = client.post("/api/match", json={"text": "samotni seniorzy", "tags": ["samotność"]}).json()
    innovations = body["data"]["innovations"]
    assert 0 < len(innovations) <= 5
    assert all({"id", "title", "match_score", "is_unmaintained"} <= i.keys() for i in innovations)


def test_voice_fix_tidies_transcript_without_llm():
    """Bez klucza OpenRouter: wielka litera, kropka i interpunkcja bez spacji — sens bez zmian."""
    fix = lambda text: client.post("/api/voice-fix", json={"transcript": text}).json()["data"]  # noqa: E731
    assert fix("mama mieszka sama")["corrected"] == "Mama mieszka sama."
    assert fix("mama mieszka sama , na wsi")["corrected"] == "Mama mieszka sama, na wsi."
    assert fix("Czy jest pomoc dla seniorów?")["corrected"] == "Czy jest pomoc dla seniorów?"
    assert fix("mama mieszka sama")["source"] == "rules"


def test_chat_streams_sse_until_done():
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "co polecasz?"}], "innovation_ids": [1]},
    )
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.startswith('data: {"content": ')
    assert response.text.endswith("data: [DONE]\n\n")


def test_tags_follow_the_description():
    body = client.post("/api/tag", json={"text": "Seniorzy nie radzą sobie z internetem"}).json()
    assert body["data"]["tags"][:2] == ["seniorzy", "wykluczenie_cyfrowe"]


def test_off_topic_text_is_not_relevant():
    body = client.post("/api/tag", json={"text": "jaka będzie pogoda"}).json()
    assert body["data"]["is_relevant"] is False


def test_match_ranks_by_description():
    text = "Niewidomy senior nie może samodzielnie zrobić zakupów"
    body = client.post("/api/match", json={"text": text, "tags": ["niepełnosprawność", "seniorzy"]}).json()
    assert body["data"]["innovations"][0]["title"] == "Zakupy bez barier"


def test_removing_a_tag_changes_ranking():
    text = "samotny senior na wsi"
    with_tags = client.post("/api/match", json={"text": text, "tags": ["seniorzy", "gmina_wiejska"]}).json()
    without = client.post("/api/match", json={"text": text, "tags": []}).json()
    scores = lambda body: [i["match_score"] for i in body["data"]["innovations"]]  # noqa: E731
    assert scores(with_tags) != scores(without)


def test_local_chat_answers_cost_question():
    from app.knowledge_store import load_innovations

    catalog = load_innovations()
    cheapest = next(i["title"] for i in catalog if i["cost_level"] == "low")
    ids = [next(i["id"] for i in catalog if i["cost_level"] == "high"), next(i["id"] for i in catalog if i["title"] == cheapest)]
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "Która jest najtańsza?"}], "innovation_ids": ids},
    )
    events = [e[6:] for e in response.text.split("\n\n") if e and e != "data: [DONE]"]
    text = "".join(json.loads(e)["content"] for e in events)
    assert "Najtańsza" in text and cheapest in text


def test_match_respects_limit():
    body = client.post("/api/match", json={"text": "seniorzy internet smartfon", "tags": ["seniorzy"], "limit": 2}).json()
    assert len(body["data"]["innovations"]) == 2


def test_chat_accepts_a4_field_names():
    from app.knowledge_store import load_innovations

    innovation = load_innovations()[0]
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "co to?"}], "tags": [], "context_innovation_ids": [innovation["id"]]},
    )
    events = [e[6:] for e in response.text.split("\n\n") if e and e != "data: [DONE]"]
    assert innovation["title"] in "".join(json.loads(e)["content"] for e in events)

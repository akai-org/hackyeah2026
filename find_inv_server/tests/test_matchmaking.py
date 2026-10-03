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


def test_voice_fix_keeps_transcript_without_llm():
    body = client.post("/api/voice-fix", json={"transcript": "mama mieszka sama"}).json()
    assert body["data"]["corrected"] == "mama mieszka sama"


def test_chat_streams_sse_until_done():
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "co polecasz?"}], "innovation_ids": [1]},
    )
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.startswith("data: ")
    assert response.text.endswith("data: [DONE]\n\n")


def test_tags_follow_the_description():
    body = client.post("/api/tag", json={"text": "Seniorzy nie radzą sobie z internetem"}).json()
    assert body["data"]["tags"][:2] == ["seniorzy", "wykluczenie_cyfrowe"]


def test_off_topic_text_is_not_relevant():
    body = client.post("/api/tag", json={"text": "jaka będzie pogoda"}).json()
    assert body["data"]["is_relevant"] is False


def test_match_ranks_by_description():
    body = client.post("/api/match", json={"text": "osoba na wózku potrzebuje asystenta", "tags": []}).json()
    assert body["data"]["innovations"][0]["title"] == "Asystent Osoby z Niepełnosprawnością"


def test_removing_a_tag_changes_ranking():
    text = "samotny senior na wsi"
    with_tags = client.post("/api/match", json={"text": text, "tags": ["seniorzy", "gmina_wiejska"]}).json()
    without = client.post("/api/match", json={"text": text, "tags": []}).json()
    scores = lambda body: [i["match_score"] for i in body["data"]["innovations"]]  # noqa: E731
    assert scores(with_tags) != scores(without)


def test_local_chat_answers_cost_question():
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "Która jest najtańsza?"}], "innovation_ids": [1, 4]},
    )
    events = response.text.split("\n\n")
    text = "".join("\n".join(line[6:] for line in e.split("\n")) for e in events if e and e != "data: [DONE]")
    assert "Najtańsza" in text and "Cyfrowy Senior" in text

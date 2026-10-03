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


def test_match_returns_five_cards_with_flags():
    body = client.post("/api/match", json={"text": "samotni seniorzy", "tags": ["samotność"]}).json()
    innovations = body["data"]["innovations"]
    assert len(innovations) == 5
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

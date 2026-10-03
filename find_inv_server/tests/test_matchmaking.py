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


RAMBLING = (
    "no więc yyy chodzi o to że moja mama no mieszka sama na wsi wiesz od kiedy tata umarł i w sumie to jest tak że "
    "ona nie ma jak dojechać do lekarza bo autobus jeździ raz dziennie a ja pracuję w krakowie i nie mogę jej wozić "
    "no i generalnie ona się czuje samotna i tak dalej no i nie ma jak dojechać do lekarza"
)


def test_voice_fix_condenses_rambling_speech_on_request():
    data = client.post("/api/voice-fix", json={"transcript": RAMBLING, "condense": True}).json()["data"]
    assert data["condensed"] is True
    assert len(data["corrected"].split()) <= 40 < len(RAMBLING.split())
    text = data["corrected"].lower()
    assert "mama mieszka sama na wsi" in text and "lekarza" in text  # sedno zostaje
    for filler in ("yyy", "wiesz", "w sumie", "generalnie", "i tak dalej"):
        assert filler not in text
    assert text.count("dojechać do lekarza") == 1  # powtórzona myśl tylko raz


def test_voice_fix_keeps_short_or_unflagged_text():
    short = client.post("/api/voice-fix", json={"transcript": "mama mieszka sama na wsi", "condense": True}).json()
    assert short["data"] == {**short["data"], "corrected": "Mama mieszka sama na wsi.", "condensed": False}
    # bez condense (Kreator) nic nie jest streszczane — znikają tylko wtrącenia, treść zostaje cała
    full = client.post("/api/voice-fix", json={"transcript": RAMBLING}).json()["data"]
    assert full["condensed"] is False
    for fact in ("tata umarł", "autobus jeździ raz dziennie", "nie mogę jej wozić", "czuje samotna"):
        assert fact in full["corrected"]
    for filler in ("yyy", "wiesz", "w sumie", "generalnie"):
        assert filler not in full["corrected"]


def test_voice_fix_drops_spoken_fillers_but_keeps_meaning():
    fix = lambda text: client.post("/api/voice-fix", json={"transcript": text, "condense": True}).json()["data"]  # noqa: E731
    assert fix("babcia mieszka sama na wsi i ten no jakby nie ma jak jechać do lekarza")["corrected"] == (
        "Babcia mieszka sama na wsi i nie ma jak jechać do lekarza."
    )
    assert fix("no więc yyy mama no mieszka sama, wiesz, i w sumie nie ma jak dojechać")["corrected"] == (
        "Mama mieszka sama i nie ma jak dojechać."
    )
    # „jakby” w warunku i „ten” przed rzeczownikiem to treść, nie wtrącenie
    assert fix("jakby ktoś zadzwonił do OPS to by pomogli")["corrected"] == "Jakby ktoś zadzwonił do OPS to by pomogli."
    assert fix("ten autobus jeździ raz dziennie")["corrected"] == "Ten autobus jeździ raz dziennie."


def test_voice_fix_makes_rambling_sentence_clear():
    """Zgłoszone przez właściciela: łańcuch wtrąceń i „przez to że …” → jasna informacja w jednym zdaniu."""
    fix = lambda text: client.post("/api/voice-fix", json={"transcript": text, "condense": True}).json()["data"]  # noqa: E731
    said = "przez to że mama mieszka tak jakby no ten tego sama na wsi to jakby no nie ma Jak dojść do lekarza"
    assert fix(said)["corrected"] == "Mama mieszka sama na wsi, więc nie ma jak dojść do lekarza."
    # treść z tych samych słów zostaje
    assert fix("to jest problem bo nikt tego nie robi")["corrected"] == "To jest problem bo nikt tego nie robi."
    assert fix("syn ma piętnaście lat i no tego w ogóle nie wychodzi z pokoju")["corrected"] == (
        "Syn ma piętnaście lat i w ogóle nie wychodzi z pokoju."
    )


def test_voice_fix_extracts_the_gist():
    """Sedno: sytuacja + problem; dygresje bez problemu odpadają."""
    fix = lambda text: client.post("/api/voice-fix", json={"transcript": text, "condense": True}).json()["data"]  # noqa: E731
    gmina = fix(
        "generalnie u nas w gminie jest dużo starszych ludzi którzy są sami i no nie mają z kim porozmawiać "
        "a poza tym to wiesz mało kto ma internet więc nie wiedzą co się dzieje"
    )
    assert gmina["condensed"] and gmina["corrected"] == (
        "U nas w gminie jest dużo starszych ludzi którzy są sami i nie mają z kim porozmawiać."
    )
    mama = fix(RAMBLING)["corrected"]
    assert len(mama.split()) <= 25
    assert "nie ma jak dojechać do lekarza" in mama and "samotna" in mama
    assert "pracuję w krakowie" not in mama  # dygresja mówiącego, nie problem


def test_voice_fix_drops_framing_but_keeps_meaning():
    """Zapowiedź („mamy problem, że”, „chciałam zgłosić”) to nie treść — sedno ma być zdaniem z sensem."""
    fix = lambda text: client.post("/api/voice-fix", json={"transcript": text, "condense": True}).json()["data"]  # noqa: E731
    gist = "Mama mieszka sama na wsi i nie ma jak dojść do lekarza."
    for said in (
        "kiedy mamy problem mama mieszka sama na wsi i nie ma jak dojść do lekarza",
        "no mamy taki problem że mama mieszka sama na wsi i nie ma jak dojść do lekarza",
        "problem jest taki że mama mieszka sama na wsi i nie ma jak dojść do lekarza",
        "chciałam zgłosić że mama mieszka sama na wsi i nie ma jak dojść do lekarza",
        "problem polega na tym że mama mieszka sama na wsi i nie ma jak dojść do lekarza",
    ):
        assert fix(said)["corrected"] == gist, said
    # treść, nie zapowiedź: „problem z czymś”, „to jest problem” i pytania zostają
    assert fix("jest problem z dojazdem do lekarza dla seniorów")["corrected"] == "Jest problem z dojazdem do lekarza dla seniorów."
    assert fix("to jest problem bo nikt tego nie robi")["corrected"] == "To jest problem bo nikt tego nie robi."
    assert fix("chciałam zapytać czy jest pomoc dla samotnych seniorów")["corrected"] == "Czy jest pomoc dla samotnych seniorów?"

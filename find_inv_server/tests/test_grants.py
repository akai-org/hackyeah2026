from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

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


def test_list_grants_has_sections():
    grants = client.get("/api/grants").json()["data"]
    assert grants
    for grant in grants:
        assert grant["id"] and grant["name"] and grant["sections"]
        for section in grant["sections"]:
            assert section["id"] and section["label"] and section["max_chars"] > 0


def test_fill_from_card_without_llm_uses_card_fields():
    data = client.post("/api/grants/fill", json={"grant_id": "oferta-zadania-publicznego", "idea": IDEA}).json()["data"]
    sections = data["sections"]
    assert data["source"] == "rules"
    assert sections["tytul"] == IDEA["title"]
    assert "Racławice" in sections["opis"]
    assert "5 tys. zł" in sections["koszty"]
    assert "GOPS" in sections["zasoby"]
    # Harmonogramu nie ma w fiszce — szkielet do uzupełnienia, nie zmyślone dane.
    assert "harmonogram" in data["missing"] and "[do uzupełnienia" in sections["harmonogram"]


def test_fill_from_plain_text_and_limits():
    text = "Chcę zorganizować w świetlicy wiejskiej w gminie Racławice spotkania dla seniorów. " * 80
    data = client.post("/api/grants/fill", json={"grant_id": "mikrogrant-lokalny", "idea": text}).json()["data"]
    assert data["sections"]["tytul"]
    assert len(data["sections"]["dzialania"]) <= 1500


def test_fill_errors():
    assert client.post("/api/grants/fill", json={"grant_id": "nie-ma", "idea": IDEA}).json()["error"]
    assert client.post("/api/grants/fill", json={"grant_id": "mikrogrant-lokalny", "idea": "krótko"}).json()["error"]

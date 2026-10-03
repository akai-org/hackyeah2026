from fastapi.testclient import TestClient

from app.main import app

ADMIN = {"X-Dev-Admin": "true"}
IDEA_TEXT = (
    "Chcę zorganizować w świetlicy wiejskiej w gminie Racławice spotkania, na których młodzież uczy seniorów "
    "obsługi smartfona. Potrzebujemy ok. 5 tys. zł rocznie. Chcemy działać we współpracy z GOPS i szkołą."
)


def test_analyze_splits_text_into_card_fields():
    with TestClient(app) as c:
        card = c.post("/api/ideas/analyze", json={"text": IDEA_TEXT, "tags": ["seniorzy"]}).json()["data"]
    assert card["title"] and card["short_desc"] and card["essence"]
    assert card["place"] == "świetlica wiejska, gmina Racławice"
    assert card["budget"] == "ok. 5 tys. zł rocznie"
    assert card["partners"].startswith("GOPS")
    assert card["stage"] in card["stages"]
    assert card["tags"][0] == "seniorzy"  # wybór użytkownika zostaje pierwszy


def test_analyze_detects_stage():
    with TestClient(app) as c:
        running = c.post("/api/ideas/analyze", json={"text": "Prowadzimy od 2 lat klub dla rodziców w Tarnowie."})
        pilot = c.post("/api/ideas/analyze", json={"text": "Planujemy pilotaż busa na telefon dla seniorów."})
    assert running.json()["data"]["stage"] == "Działa, szukamy rozszerzenia"
    assert pilot.json()["data"]["stage"] == "Pilotaż"


def test_analyze_rejects_too_short_text():
    with TestClient(app) as c:
        assert c.post("/api/ideas/analyze", json={"text": "krótko"}).json()["error"]


def _save(c: TestClient) -> dict:
    return c.post("/api/ideas", json={
        "title": "Spotkania cyfrowe", "essence": "Młodzież uczy seniorów smartfona.", "for_whom": "seniorzy",
        "short_desc": "Młodzież uczy seniorów.", "place": "gmina Racławice", "stage": "Pilotaż",
        "budget": "5 tys. zł", "partners": "GOPS", "tags": ["seniorzy"],
    }).json()["data"]


def test_saved_idea_keeps_details_and_attachments_for_admin():
    with TestClient(app) as c:
        saved = _save(c)
        assert saved["id"] and saved["upload_token"]
        token = {"X-Upload-Token": saved["upload_token"]}
        upload = c.post(f"/api/ideas/{saved['id']}/attachments", headers=token,
                        files={"file": ("plan budżetu.pdf", b"%PDF-1.4 test", "application/pdf")})
        assert upload.status_code == 200, upload.text
        attachment_id = upload.json()["data"]["id"]

        ideas = c.get("/api/admin/ideas", headers=ADMIN).json()["data"]
        idea = next(i for i in ideas if i["id"] == saved["id"])
        assert idea["place"] == "gmina Racławice" and idea["budget"] == "5 tys. zł" and idea["stage"] == "Pilotaż"
        assert idea["attachments"] == [{"id": attachment_id, "filename": "plan budżetu.pdf", "size": 13,
                                        "content_type": "application/pdf"}]

        download = c.get(f"/api/admin/ideas/{saved['id']}/attachments/{attachment_id}", headers=ADMIN)
        assert download.status_code == 200 and download.content == b"%PDF-1.4 test"
        assert "attachment" in download.headers["content-disposition"]


def test_upload_requires_the_ideas_token_and_safe_files():
    with TestClient(app) as c:
        saved = _save(c)
        url = f"/api/ideas/{saved['id']}/attachments"
        pdf = {"file": ("a.pdf", b"%PDF", "application/pdf")}
        assert c.post(url, files=pdf).status_code == 403
        assert c.post(url, headers={"X-Upload-Token": "zly-token"}, files=pdf).status_code == 403
        token = {"X-Upload-Token": saved["upload_token"]}
        assert c.post(url, headers=token, files={"file": ("x.html", b"<script>", "text/html")}).status_code == 400
        assert c.post(url, headers=token, files={"file": ("pusty.pdf", b"", "application/pdf")}).status_code == 400
        for i in range(5):
            assert c.post(url, headers=token, files={"file": (f"{i}.txt", b"ok", "text/plain")}).status_code == 200
        assert c.post(url, headers=token, files={"file": ("6.txt", b"ok", "text/plain")}).status_code == 400


def test_attachment_download_is_admin_only():
    with TestClient(app) as c:
        saved = _save(c)
        upload = c.post(f"/api/ideas/{saved['id']}/attachments", headers={"X-Upload-Token": saved["upload_token"]},
                        files={"file": ("a.txt", b"tajne", "text/plain")})
        url = f"/api/admin/ideas/{saved['id']}/attachments/{upload.json()['data']['id']}"
        assert c.get(url).status_code == 401

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


def _text_pdf(text: str) -> bytes:
    """Minimalny PDF z jedną stroną tekstu (Helvetica) — bez zewnętrznych bibliotek."""
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    out += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets)
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


def test_extract_pdf_returns_text():
    pdf = _text_pdf("Spotkania mlodziezy z seniorami w swietlicy wiejskiej")
    with TestClient(app) as c:
        body = c.post("/api/ideas/extract-pdf", files={"file": ("pomysl.pdf", pdf, "application/pdf")}).json()
    assert body["error"] is None, body
    assert "seniorami" in body["data"]["text"] and body["data"]["pages"] == 1


def test_extract_pdf_errors():
    import io

    from pypdf import PdfWriter

    blank = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.write(blank)
    with TestClient(app) as c:
        scan = c.post("/api/ideas/extract-pdf", files={"file": ("skan.pdf", blank.getvalue(), "application/pdf")})
        not_pdf = c.post("/api/ideas/extract-pdf", files={"file": ("plik.pdf", b"hello", "application/pdf")})
        wrong_ext = c.post("/api/ideas/extract-pdf", files={"file": ("plik.txt", b"%PDF", "text/plain")})
    assert "skan" in scan.json()["error"]
    assert not_pdf.json()["error"] and wrong_ext.json()["error"]

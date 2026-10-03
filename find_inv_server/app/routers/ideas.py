"""Kreator pomysłów: analiza opisu na pola fiszki i załączniki do zapisanej fiszki.

Zapis samej fiszki to POST /api/ideas (routers/knowledge.py) — zwraca upload_token, którym autor
wgrywa tu pliki. Pobieranie załączników jest tylko dla admina (routers/admin.py).
"""

import io
import logging
import re
import secrets
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.config import settings
from app.database import get_db
from app.idea_analysis import STAGES, analyze_idea
from app.models import Idea, IdeaAttachment, IdeaDetails

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ideas", tags=["ideas"])

MAX_TEXT = 4000
MAX_FILES = 5
MAX_FILE_BYTES = 10 * 1024 * 1024
# Dokumenty i zdjęcia — bez plików wykonywalnych i HTML, które admin mógłby nieświadomie otworzyć.
ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".odt", ".rtf", ".txt",
    ".xls", ".xlsx", ".ods", ".ppt", ".pptx", ".odp",
    ".jpg", ".jpeg", ".png", ".webp",
}  # fmt: skip


class AnalyzeRequest(BaseModel):
    text: str
    tags: list[str] = Field(default_factory=list)


@router.post("/analyze")
async def analyze(body: AnalyzeRequest):
    text = body.text.strip()[:MAX_TEXT]
    if len(text) < 10:
        return {"data": None, "error": "Opisz pomysł w co najmniej jednym zdaniu"}
    return {"data": {**await analyze_idea(text, body.tags), "stages": STAGES}, "error": None}


MAX_PDF_BYTES = 10 * 1024 * 1024
MAX_PDF_PAGES = 30


@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """Tekst z PDF-u dla kreatora (bez zapisu pliku). Front wkleja go do opisu i puszcza przez analizę fiszki."""
    from pypdf import PdfReader

    if Path(file.filename or "").suffix.lower() != ".pdf":
        return {"data": None, "error": "Wybierz plik PDF"}
    content = await file.read(MAX_PDF_BYTES + 1)
    if len(content) > MAX_PDF_BYTES:
        return {"data": None, "error": "Plik jest większy niż 10 MB"}
    if not content.startswith(b"%PDF"):
        return {"data": None, "error": "To nie jest poprawny plik PDF"}

    try:
        reader = PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            return {"data": None, "error": "PDF jest zabezpieczony hasłem — zapisz go bez hasła i spróbuj ponownie"}
        pages = reader.pages[:MAX_PDF_PAGES]
        text = "\n".join(page.extract_text() or "" for page in pages)
    except Exception:  # pypdf rzuca różne wyjątki przy uszkodzonych plikach
        log.exception("pdf extraction failed")
        return {"data": None, "error": "Nie udało się odczytać tego PDF-a — plik może być uszkodzony"}

    # Łączymy słowa przerwane dywizem na końcu linii i zbędne białe znaki.
    text = re.sub(r"-\n(?=\w)", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) < 10:
        return {"data": None, "error": "W tym PDF-ie nie ma tekstu do odczytania (to chyba skan). Wklej opis ręcznie"}
    truncated = len(text) > MAX_TEXT or len(reader.pages) > MAX_PDF_PAGES
    return {
        "data": {"text": text[:MAX_TEXT], "pages": len(reader.pages), "truncated": truncated},
        "error": None,
    }


def uploads_dir(idea_id: int) -> Path:
    return Path(settings.uploads_path) / "ideas" / str(idea_id)


def _display_name(filename: str) -> str:
    # Tylko nazwa do wyświetlenia: bez ścieżek i znaków sterujących. Na dysku plik ma losową nazwę.
    name = Path(filename.replace("\\", "/")).name
    return "".join(ch for ch in name if ch.isprintable())[:200] or "plik"


@router.post("/{idea_id}/attachments")
async def upload_attachment(
    idea_id: int,
    file: UploadFile = File(...),
    x_upload_token: str | None = Header(default=None),
):
    async with get_db() as db:
        details = (await db.execute(select(IdeaDetails).where(IdeaDetails.idea_id == idea_id))).scalar_one_or_none()
        if details is None or not x_upload_token or not secrets.compare_digest(details.upload_token, x_upload_token):
            raise HTTPException(status_code=403, detail="Brak uprawnień do dodania pliku do tej fiszki")
        if await db.get(Idea, idea_id) is None:
            raise HTTPException(status_code=404, detail="Nie znaleziono fiszki")
        count = (
            await db.execute(select(func.count()).select_from(IdeaAttachment).where(IdeaAttachment.idea_id == idea_id))
        ).scalar_one()
        if count >= MAX_FILES:
            raise HTTPException(status_code=400, detail=f"Do fiszki można dodać najwyżej {MAX_FILES} plików")

    filename = _display_name(file.filename or "")
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Ten typ pliku nie jest obsługiwany")

    directory = uploads_dir(idea_id)
    directory.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{extension}"
    target = directory / stored_name
    size = 0
    try:
        with target.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_BYTES:
                    raise HTTPException(status_code=400, detail="Plik jest większy niż 10 MB")
                out.write(chunk)
    except HTTPException:
        target.unlink(missing_ok=True)
        raise
    if size == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Plik jest pusty")

    async with get_db() as db:
        attachment = IdeaAttachment(
            idea_id=idea_id,
            filename=filename,
            stored_name=stored_name,
            content_type=file.content_type or "application/octet-stream",
            size=size,
        )
        db.add(attachment)
        await db.commit()
        await db.refresh(attachment)
    return {"data": {"id": attachment.id, "filename": attachment.filename, "size": attachment.size}, "error": None}

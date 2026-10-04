from contextlib import asynccontextmanager

import json

from fastapi import FastAPI, Request
from fastapi.responses import Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.config import settings
from app.database import init_db
from app.i18n import current_lang, normalize_lang
from app.translation import should_translate_path, translate_payload, translate_texts
from app.routers import admin, admin_panel, events, grants, health, ideas, knowledge, matchmaking, middleman, tester
from app.routers import auth as auth_router
from app.zasobnik.db import engine as zasobnik_engine
from app.zasobnik.db import init_db as init_zasobnik_db
from app.zasobnik.routers import admin as zasobnik_admin
from app.zasobnik.routers import areas, needs, resources
from app.zasobnik.seed import seed as seed_zasobnik


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Zasobnik wiedzy ma osobną, synchroniczną bazę (zasobnik.db).
    init_zasobnik_db()
    if settings.seed_demo_data:
        with Session(zasobnik_engine) as session:
            seed_zasobnik(session)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def lang_middleware(request: Request, call_next):
    # Frontend wysyła X-Lang (pl/en/uk); odpowiedzi LLM idą w tym języku.
    lang = normalize_lang(request.headers.get("X-Lang") or request.cookies.get("lang"))
    token = current_lang.set(lang)
    try:
        response = await call_next(request)
        # Treści z bazy są po polsku — dla en/uk tłumaczymy odpowiedź JSON (cache w translations.db).
        if (
            lang != "pl"
            and response.status_code == 200
            and response.headers.get("content-type", "").startswith("application/json")
            and should_translate_path(request.url.path)
        ):
            body = b"".join([chunk async for chunk in response.body_iterator])
            try:
                translated = await translate_payload(json.loads(body), lang)
                body = json.dumps(translated, ensure_ascii=False).encode("utf-8")
            except Exception:  # noqa: BLE001 — tłumaczenie nigdy nie psuje odpowiedzi
                pass
            headers = {k: v for k, v in response.headers.items() if k.lower() != "content-length"}
            return Response(content=body, status_code=response.status_code, headers=headers, media_type="application/json")
        return response
    finally:
        current_lang.reset(token)


class TranslateRequest(BaseModel):
    texts: list[str]


@app.post("/api/translate")
async def translate(body: TranslateRequest):
    """Tłumaczy teksty trzymane na froncie (np. dane demo) na język z X-Lang. Brak tłumaczenia = oryginał."""
    texts = [t[:4000] for t in body.texts[:200]]
    mapping = await translate_texts(texts)
    return {"data": [mapping.get(t, t) for t in texts], "error": None}


app.include_router(health.router, prefix="/api")
app.include_router(auth_router.router)
app.include_router(matchmaking.router)
app.include_router(knowledge.router)
app.include_router(ideas.router)
app.include_router(grants.router)
# Panel admina A5 przed routerem A1: wspólne ścieżki /api/admin/* obsługuje A5 (jego frontend),
# ścieżki tylko z A1 (np. /api/admin/ideas) dalej trafiają do admin.router.
app.include_router(admin_panel.router)
app.include_router(admin.router)
app.include_router(middleman.router)
app.include_router(tester.router)
app.include_router(events.router)

# Zasobnik wiedzy: /api/areas, /api/resources, /api/needs, /api/zasobnik/admin/*
app.include_router(areas.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(needs.router, prefix="/api")
app.include_router(zasobnik_admin.router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} działa. Dokumentacja: /docs"}

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.config import settings
from app.database import init_db
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

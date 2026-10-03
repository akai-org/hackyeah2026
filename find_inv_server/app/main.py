from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.config import settings
from app.db import engine, init_db
from app.routers import admin, areas, health, matchmaking, needs, resources
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    if settings.seed_demo_data:
        with Session(engine) as session:
            seed(session)
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

# Zasobnik wiedzy
app.include_router(areas.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(needs.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Matchmaking (router ma własny prefiks /api)
app.include_router(matchmaking.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} działa. Dokumentacja: /docs"}

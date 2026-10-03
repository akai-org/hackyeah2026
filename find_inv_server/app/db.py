from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# check_same_thread=False – FastAPI obsługuje żądania w wielu wątkach.
connect_args = {"check_same_thread": False} if settings.zasobnik_database_url.startswith("sqlite") else {}
engine = create_engine(settings.zasobnik_database_url, connect_args=connect_args)


def init_db() -> None:
    from app import models  # noqa: F401 – rejestruje tabele w metadanych

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

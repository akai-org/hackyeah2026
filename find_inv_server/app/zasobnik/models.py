"""Modele danych modułu „Zasobnik wiedzy”.

Tabele (table=True) trzymają dane w bazie, pozostałe klasy to schematy
wejścia/wyjścia API (to one pojawiają się w Swaggerze).
"""

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel
from sqlmodel import JSON, Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class ResourceType(StrEnum):
    challenge = "challenge"  # wyzwanie społeczne: raporty, Mapa Wyzwań Społecznych
    innovation = "innovation"  # Biblioteka Innowacji Społecznych
    education = "education"  # materiały edukacyjne


class ReporterType(StrEnum):
    resident = "resident"  # mieszkaniec
    ngo = "ngo"  # organizacja pozarządowa
    institution = "institution"  # instytucja pomocy społecznej, szkoła itp.
    local_government = "local_government"  # JST – gmina, powiat
    other = "other"


# ---------- obszary (kwestie społeczne) ----------


class ResourceAreaLink(SQLModel, table=True):
    resource_id: int | None = Field(default=None, foreign_key="resource.id", primary_key=True)
    area_id: int | None = Field(default=None, foreign_key="area.id", primary_key=True)


class AreaBase(SQLModel):
    slug: str = Field(index=True, unique=True, min_length=2, max_length=60, regex=r"^[a-z0-9-]+$")
    name: str = Field(min_length=2, max_length=120)
    description: str = ""
    icon: str | None = None  # nazwa ikony dla frontendu, np. "elderly"


class Area(AreaBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    resources: list["Resource"] = Relationship(back_populates="areas", link_model=ResourceAreaLink)


class AreaCreate(AreaBase):
    pass


class AreaUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None


class AreaRead(AreaBase):
    id: int


class AreaSummary(AreaRead):
    """Obszar z liczbą opublikowanych zasobów każdego typu."""

    counts: dict[ResourceType, int]


# ---------- zasoby: wyzwania, innowacje, materiały ----------


class ResourceBase(SQLModel):
    type: ResourceType = Field(index=True)
    title: str = Field(min_length=2, max_length=300)
    summary: str = Field(default="", max_length=1000)  # krótki opis na kartę/listę
    content: str = ""  # pełna treść (markdown)
    # Kluczowe liczby do wyróżnienia, np. [{"label": "Seniorzy 65+", "value": "19%"}]
    facts: list[dict[str, str]] = Field(default_factory=list, sa_type=JSON)
    tags: list[str] = Field(default_factory=list, sa_type=JSON)
    url: str | None = None  # link do źródła / pełnego opisu
    video_url: str | None = None  # film o innowacji (YouTube, Vimeo…)
    image_url: str | None = None
    attachment_url: str | None = None  # PDF z raportem / materiałem
    source: str | None = None  # np. „Raport o kondycji Małopolski 2025”
    region: str | None = None  # powiat/gmina; None = cała Małopolska
    published: bool = True


class Resource(ResourceBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    views: int = 0
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    areas: list[Area] = Relationship(back_populates="resources", link_model=ResourceAreaLink)


class ResourceCreate(ResourceBase):
    area_slugs: list[str] = []


class ResourceUpdate(SQLModel):
    type: ResourceType | None = None
    title: str | None = None
    summary: str | None = None
    content: str | None = None
    facts: list[dict[str, str]] | None = None
    tags: list[str] | None = None
    url: str | None = None
    video_url: str | None = None
    image_url: str | None = None
    attachment_url: str | None = None
    source: str | None = None
    region: str | None = None
    published: bool | None = None
    area_slugs: list[str] | None = None


class ResourceRead(ResourceBase):
    id: int
    views: int
    created_at: datetime
    updated_at: datetime
    areas: list[AreaRead]


class ResourcePage(BaseModel):
    items: list[ResourceRead]
    total: int


class AreaDetail(AreaRead):
    """Wszystko o jednej kwestii społecznej w jednym miejscu."""

    challenges: list[ResourceRead]
    innovations: list[ResourceRead]
    education: list[ResourceRead]
    related_areas: list[AreaRead]


class ImportResult(BaseModel):
    created: int
    updated: int


# ---------- potrzeby i sygnały do analizy trendów ----------


class NeedBase(SQLModel):
    description: str = Field(min_length=3, max_length=2000)
    region: str | None = Field(default=None, max_length=120)
    reporter_type: ReporterType = ReporterType.resident


class Need(NeedBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    area_id: int | None = Field(default=None, foreign_key="area.id", index=True)
    created_at: datetime = Field(default_factory=utcnow, index=True)


class NeedCreate(NeedBase):
    area_slug: str | None = None  # użytkownik może nie wiedzieć, do jakiego obszaru to należy


class NeedUpdate(SQLModel):
    area_slug: str | None = None  # admin przypisuje/zmienia obszar


class NeedRead(NeedBase):
    id: int
    area: AreaRead | None
    created_at: datetime


class SearchLog(SQLModel, table=True):
    """Każde wyszukiwanie to sygnał, czego ludzie szukają (i czego nie znajdują)."""

    id: int | None = Field(default=None, primary_key=True)
    query: str = Field(index=True)
    area_id: int | None = Field(default=None, foreign_key="area.id")
    results: int
    created_at: datetime = Field(default_factory=utcnow, index=True)


class MonthPoint(BaseModel):
    month: str  # "2026-09"
    needs: int
    searches: int


class AreaTrend(BaseModel):
    area: AreaRead | None  # None = potrzeby bez przypisanego obszaru
    needs: int
    searches: int
    resource_views: int
    needs_last_30d: int
    needs_prev_30d: int
    change_pct: float | None  # None, gdy w poprzednim okresie było 0
    trend: str  # "up" | "down" | "flat" | "new"
    monthly: list[MonthPoint]


class CountItem(BaseModel):
    key: str
    count: int


class TrendsReport(BaseModel):
    since: datetime
    until: datetime
    total_needs: int
    total_searches: int
    areas: list[AreaTrend]
    by_region: list[CountItem]
    by_reporter_type: list[CountItem]
    top_queries: list[CountItem]
    zero_result_queries: list[CountItem]  # czego szukano, a nie ma w zasobniku

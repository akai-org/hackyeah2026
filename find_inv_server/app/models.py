import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(32), default="user")  # user|tester|admin|consultant
    session_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tester: Mapped["Tester | None"] = relationship("Tester", back_populates="user", uselist=False)


class Tester(Base):
    __tablename__ = "testers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(128))
    email: Mapped[str] = mapped_column(String(256))
    organization: Mapped[str | None] = mapped_column(String(256), nullable=True)
    expertise: Mapped[str | None] = mapped_column(String(512), nullable=True)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="tester")


class Innovation(Base):
    __tablename__ = "innovations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(256))
    short_desc: Mapped[str] = mapped_column(Text)
    full_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    area: Mapped[str | None] = mapped_column(String(128), nullable=True)
    target_group: Mapped[str | None] = mapped_column(String(256), nullable=True)
    location: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")  # active|archived|unmaintained
    cost_level: Mapped[str | None] = mapped_column(String(16), nullable=True)  # low|medium|high
    implementation_time_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    testers_count: Mapped[int] = mapped_column(Integer, default=0)
    where_implemented: Mapped[str | None] = mapped_column(String(512), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    embedding_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    tags: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def tags_list(self) -> list[str]:
        return json.loads(self.tags) if self.tags else []


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(256))
    area: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    indicator_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    indicator_unit: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source: Mapped[str | None] = mapped_column(String(256), nullable=True)
    data_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    powiat: Mapped[str | None] = mapped_column(String(128), nullable=True)


class InnovationGapIndex(Base):
    __tablename__ = "innovation_gap_index"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    powiat: Mapped[str] = mapped_column(String(128))
    challenge_area: Mapped[str] = mapped_column(String(128))
    innovations_count: Mapped[int] = mapped_column(Integer, default=0)
    gap_score: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class SearchLog(Base):
    __tablename__ = "search_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    query: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    results_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

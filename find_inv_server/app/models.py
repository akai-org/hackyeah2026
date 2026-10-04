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


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(256))
    essence: Mapped[str] = mapped_column(Text)
    for_whom: Mapped[str | None] = mapped_column(String(256), nullable=True)
    tags: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    author_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    author_email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|reviewed|rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class IdeaDetails(Base):
    """Pola fiszki spoza tabeli ideas. Osobna tabela, bo create_all nie dodaje kolumn do istniejących tabel."""

    __tablename__ = "idea_details"

    idea_id: Mapped[int] = mapped_column(Integer, ForeignKey("ideas.id"), primary_key=True)
    short_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    place: Mapped[str | None] = mapped_column(String(256), nullable=True)
    stage: Mapped[str | None] = mapped_column(String(128), nullable=True)
    budget: Mapped[str | None] = mapped_column(String(256), nullable=True)
    partners: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Jednorazowy klucz do wgrania załączników — tylko autor zapisanej fiszki może do niej dołączyć pliki.
    upload_token: Mapped[str] = mapped_column(String(64))


class IdeaAttachment(Base):
    __tablename__ = "idea_attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(Integer, ForeignKey("ideas.id"), index=True)
    filename: Mapped[str] = mapped_column(String(256))  # nazwa od użytkownika, tylko do wyświetlenia
    stored_name: Mapped[str] = mapped_column(String(128))  # losowa nazwa na dysku
    content_type: Mapped[str] = mapped_column(String(128))
    size: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("forum_posts.id"), nullable=True)
    # Komentarz pod kartą innowacji; None = wątek ogólnego forum.
    innovation_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("innovations.id"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    author_name: Mapped[str] = mapped_column(String(128), default="Gość")
    badge: Mapped[str] = mapped_column(String(32), default="user")  # user|tester|admin|consultant
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class TestReport(Base):
    """Tester zgłasza się do konkretnej innowacji, admin ROPS go przypisuje (albo odrzuca), potem tester ją ocenia."""

    __tablename__ = "test_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    innovation_id: Mapped[int] = mapped_column(Integer, ForeignKey("innovations.id"))
    status: Mapped[str] = mapped_column(String(32), default="requested")  # requested|assigned|rejected|submitted
    motivation: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1–5
    what_worked: Mapped[str | None] = mapped_column(Text, nullable=True)
    improvements: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_note: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    innovation: Mapped["Innovation"] = relationship("Innovation")
    user: Mapped["User"] = relationship("User")


class InnovationRating(Base):
    """Ocena 1–5 gwiazdek wystawiona przez dowolnego użytkownika (nie tylko testera)."""

    __tablename__ = "innovation_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    innovation_id: Mapped[int] = mapped_column(Integer, ForeignKey("innovations.id"), index=True)
    # Sesja użytkownika (jeśli jest) lub None dla anonimowego.
    session_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    rating: Mapped[int] = mapped_column(Integer)  # 1–5
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class TesterAssignment(Base):
    """Tabela przypisań tester ↔ innowacja (widok admina). Badge 'Tester' na komentarzu widać tylko, gdy jest tu wpis."""

    __tablename__ = "tester_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tester_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    innovation_id: Mapped[int] = mapped_column(Integer, ForeignKey("innovations.id"), index=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Event(Base):
    """Zdarzenie analityczne (wyświetlenie karty, klik, start Middlemana…). Z nich liczy /api/admin/analytics/*."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str] = mapped_column(String(32), index=True)  # patrz app.analytics.EVENT_TYPES
    innovation_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("innovations.id"), nullable=True, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    anon_id: Mapped[str | None] = mapped_column(String(64), nullable=True)  # UUID przeglądarki, do liczenia unikalnych osób
    meta: Mapped[str] = mapped_column(Text, default="{}")  # JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)

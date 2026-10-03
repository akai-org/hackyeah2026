"""Testowanie innowacji: tester zgłasza się do konkretnej innowacji, admin ROPS go przypisuje
(albo odrzuca), a przypisany tester wystawia ocenę, feedback i propozycje usprawnień.

Status testu: requested → assigned → submitted, albo requested → rejected.
Dostęp: /api/tester/* dla roli tester (i admin), /api/admin/test-requests/* tylko dla admina
(sesja: cookie "session" lub X-Session-Token).
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.auth import require_role
from app.database import get_db
from app.models import Innovation, Tester, TestReport, User

router = APIRouter(tags=["tester"])

TesterDep = Depends(require_role("tester", "admin"))
AdminDep = Depends(require_role("admin"))

STATUSES = {"requested", "assigned", "rejected", "submitted"}


class RequestBody(BaseModel):
    innovation_id: int
    motivation: str = Field(default="", max_length=2000)


class FeedbackBody(BaseModel):
    rating: int = Field(ge=1, le=5)
    what_worked: str = Field(min_length=1, max_length=4000)
    improvements: str = Field(default="", max_length=4000)
    cost_note: str = Field(default="", max_length=512)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _row(report: TestReport) -> dict:
    return {
        "id": report.id,
        "innovation_id": report.innovation_id,
        "innovation_title": report.innovation.title if report.innovation else None,
        "tester_id": report.user_id,
        "tester_name": report.user.name if report.user else None,
        "status": report.status,
        "motivation": report.motivation,
        "rating": report.rating,
        "what_worked": report.what_worked,
        "improvements": report.improvements,
        "cost_note": report.cost_note,
        "created_at": _iso(report.created_at),
        "decided_at": _iso(report.decided_at),
        "submitted_at": _iso(report.submitted_at),
    }


def _query():
    return select(TestReport).options(selectinload(TestReport.innovation), selectinload(TestReport.user))


async def _get(db, report_id: int, user: User | None = None) -> TestReport:
    q = _query().where(TestReport.id == report_id)
    if user is not None:
        q = q.where(TestReport.user_id == user.id)
    report = (await db.execute(q)).scalar_one_or_none()
    if report is None:
        raise HTTPException(status_code=404, detail="Nie ma takiego testu")
    return report


# ── Tester ───────────────────────────────────────────────


@router.get("/api/tester/tests")
async def my_tests(user: User = TesterDep):
    async with get_db() as db:
        result = await db.execute(
            _query().where(TestReport.user_id == user.id).order_by(TestReport.id.desc())
        )
        return {"data": [_row(r) for r in result.scalars().all()]}


@router.post("/api/tester/tests")
async def request_test(body: RequestBody, user: User = TesterDep):
    async with get_db() as db:
        if await db.get(Innovation, body.innovation_id) is None:
            raise HTTPException(status_code=404, detail="Nie ma takiej innowacji")

        existing = await db.execute(
            select(TestReport).where(TestReport.user_id == user.id, TestReport.innovation_id == body.innovation_id)
        )
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="Już zgłosiłeś się do testu tej innowacji")

        report = TestReport(
            user_id=user.id, innovation_id=body.innovation_id, motivation=body.motivation.strip() or None
        )
        db.add(report)
        await db.commit()
        return {"data": _row(await _get(db, report.id))}


@router.post("/api/tester/tests/{report_id}/feedback")
async def submit_feedback(report_id: int, body: FeedbackBody, user: User = TesterDep):
    async with get_db() as db:
        report = await _get(db, report_id, user)
        if report.status != "assigned":
            raise HTTPException(status_code=409, detail="Ocenić można tylko test przypisany przez ROPS")

        report.rating = body.rating
        report.what_worked = body.what_worked.strip()
        report.improvements = body.improvements.strip() or None
        report.cost_note = body.cost_note.strip() or None
        report.status = "submitted"
        report.submitted_at = datetime.now()
        await db.commit()
        return {"data": _row(report)}


# ── Admin ROPS ───────────────────────────────────────────


@router.get("/api/admin/test-requests")
async def list_test_requests(status: str = "", _: User = AdminDep):
    async with get_db() as db:
        q = _query().order_by(TestReport.id.desc())
        if status in STATUSES:
            q = q.where(TestReport.status == status)
        reports = (await db.execute(q)).scalars().all()

        # Dane ze zgłoszenia testera (e-mail, organizacja), jeśli przyszedł przez formularz /testerzy.
        user_ids = {r.user_id for r in reports}
        testers = (await db.execute(select(Tester).where(Tester.user_id.in_(user_ids)))).scalars().all()
        profiles = {t.user_id: t for t in testers}

        rows = []
        for report in reports:
            profile = profiles.get(report.user_id)
            rows.append({
                **_row(report),
                "tester_email": profile.email if profile else None,
                "tester_organization": profile.organization if profile else None,
            })
        return {"data": rows}


async def _decide(report_id: int, status: str) -> dict:
    async with get_db() as db:
        report = await _get(db, report_id)
        if report.status != "requested":
            raise HTTPException(status_code=409, detail="To zgłoszenie zostało już rozpatrzone")
        report.status = status
        report.decided_at = datetime.now()
        if status == "assigned" and report.innovation:
            report.innovation.testers_count = (report.innovation.testers_count or 0) + 1
        await db.commit()
        return {"data": _row(report)}


@router.post("/api/admin/test-requests/{report_id}/assign")
async def assign_tester(report_id: int, _: User = AdminDep):
    return await _decide(report_id, "assigned")


@router.post("/api/admin/test-requests/{report_id}/reject")
async def reject_tester(report_id: int, _: User = AdminDep):
    return await _decide(report_id, "rejected")

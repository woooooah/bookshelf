"""Letni bralni cilj: koliko knjig zeli uporabnik prebrati v letu."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import ReadingEntry, ReadingGoal, ReadingSession, User
from app.schemas import ReadingGoalOut, ReadingGoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])

Year = Path(ge=1900, le=2100)


def _goal(db: Session, user: User, year: int) -> ReadingGoal | None:
    return db.scalar(
        select(ReadingGoal).where(ReadingGoal.user_id == user.id, ReadingGoal.year == year)
    )


def _read_count(db: Session, user: User, year: int) -> int:
    """Stevilo prebranih knjig v letu; ponovno prebrana knjiga se steje vsakic."""
    return db.scalar(
        select(func.count(ReadingSession.id))
        .join(ReadingSession.reading_entry)
        .where(
            ReadingEntry.user_id == user.id,
            ReadingSession.finished_at >= date(year, 1, 1),
            ReadingSession.finished_at <= date(year, 12, 31),
        )
    )


@router.get("/{year}", response_model=ReadingGoalOut)
def get_goal(
    year: int = Year, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    goal = _goal(db, user, year)
    return ReadingGoalOut(
        year=year,
        target_books=goal.target_books if goal else None,
        read_count=_read_count(db, user, year),
    )


@router.put("/{year}", response_model=ReadingGoalOut)
def set_goal(
    data: ReadingGoalUpdate,
    year: int = Year,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Nastavi ali spremeni cilj za leto (najvec en cilj na leto)."""
    goal = _goal(db, user, year)
    if goal is None:
        db.add(ReadingGoal(user_id=user.id, year=year, target_books=data.target_books))
    else:
        goal.target_books = data.target_books
    try:
        db.commit()
    except IntegrityError:
        # Hkratna zahteva je cilj za to leto ze ustvarila
        db.rollback()
        _goal(db, user, year).target_books = data.target_books
        db.commit()
    return ReadingGoalOut(
        year=year, target_books=data.target_books, read_count=_read_count(db, user, year)
    )


@router.delete("/{year}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    year: int = Year, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    goal = _goal(db, user, year)
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No goal for this year")
    db.delete(goal)
    db.commit()

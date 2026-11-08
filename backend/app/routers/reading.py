"""Status branja: zelim prebrati, trenutno berem, prebrano. Velja za delo, ne za izdajo."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.db import get_db
from app.models import ReadingEntry, ReadingStatus, User, Work
from app.schemas import ReadingEntryOut, ReadingItemOut, ReadingStatusUpdate

router = APIRouter(prefix="/reading", tags=["reading"])


def _entry(db: Session, user: User, work_id: int) -> ReadingEntry | None:
    return db.scalar(
        select(ReadingEntry).where(
            ReadingEntry.user_id == user.id, ReadingEntry.work_id == work_id
        )
    )


@router.get("", response_model=list[ReadingItemOut])
def list_reading(
    reading_status: ReadingStatus | None = Query(default=None, alias="status"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Knjige, ki jim je uporabnik nastavil status (po zeljah samo en status)."""
    query = (
        select(ReadingEntry)
        .where(ReadingEntry.user_id == user.id)
        .options(joinedload(ReadingEntry.work))
        .order_by(ReadingEntry.id.desc())
    )
    if reading_status is not None:
        query = query.where(ReadingEntry.status == reading_status)
    return db.scalars(query).all()


@router.get("/{work_id}", response_model=ReadingEntryOut | None)
def get_reading(
    work_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Status branja za eno knjigo; null, ce ga uporabnik se ni nastavil."""
    return _entry(db, user, work_id)


@router.put("/{work_id}", response_model=ReadingEntryOut)
def set_reading_status(
    work_id: int,
    data: ReadingStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Nastavi status. Knjiga je lahko tudi izven uporabnikove knjiznice."""
    if db.get(Work, work_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not found")

    entry = _entry(db, user, work_id)
    if entry is None:
        entry = ReadingEntry(user_id=user.id, work_id=work_id, status=data.status)
        db.add(entry)
    else:
        entry.status = data.status
    try:
        db.commit()
    except IntegrityError:
        # Hkratna zahteva je vnos ze ustvarila
        db.rollback()
        entry = _entry(db, user, work_id)
        entry.status = data.status
        db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{work_id}", status_code=status.HTTP_204_NO_CONTENT)
def clear_reading_status(
    work_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Odstrani status branja za knjigo."""
    entry = _entry(db, user, work_id)
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No reading status for this book")
    db.delete(entry)
    db.commit()

"""Status branja: zelim prebrati, trenutno berem, prebrano. Velja za delo, ne za izdajo."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import ReadingEntry, ReadingSession, ReadingStatus, User, Work
from app.routers.library import check_not_future
from app.schemas import (
    ReadingEntryOut,
    ReadingItemOut,
    ReadingSessionOut,
    ReadingSessionUpdate,
    ReadingStatusUpdate,
)

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
        .options(joinedload(ReadingEntry.work), selectinload(ReadingEntry.sessions))
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

    if data.day is not None:
        check_not_future(data.day)

    entry = _entry(db, user, work_id)
    if entry is None:
        entry = ReadingEntry(user_id=user.id, work_id=work_id, status=data.status)
        db.add(entry)
        try:
            db.flush()
        except IntegrityError:
            # Hkratna zahteva je vnos ze ustvarila
            db.rollback()
            entry = _entry(db, user, work_id)
    entry.status = data.status
    _update_sessions(entry, data.status, data.day)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Finish date cannot be before the start date"
        )
    db.refresh(entry)
    return entry


def _update_sessions(entry: ReadingEntry, new_status: ReadingStatus, day: date | None) -> None:
    """Uskladi branja (ReadingSession) s statusom.

    - reading: zacne novo branje, ce ga se ni (ponovno branje ohrani prejsnja)
    - read: zakljuci tekoce branje; brez tekocega se branje shrani samo z datumom
    - want_to_read: tekoce branje se zavrze, zakljucena ostanejo
    """
    current = entry.open_session
    if new_status == ReadingStatus.reading:
        if current is None:
            entry.sessions.append(ReadingSession(started_at=day or date.today()))
        elif day is not None:
            current.started_at = day
    elif new_status == ReadingStatus.read:
        if current is not None:
            current.finished_at = day or date.today()
        elif day is not None:
            entry.sessions.append(ReadingSession(finished_at=day))
    elif current is not None:
        entry.sessions.remove(current)


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


@router.patch("/sessions/{session_id}", response_model=ReadingSessionOut)
def update_session(
    session_id: int,
    data: ReadingSessionUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Popravi datuma zacetka in zakljucka enega branja."""
    reading_session = db.get(ReadingSession, session_id)
    if reading_session is None or reading_session.reading_entry.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reading session not found")

    fields = data.model_dump(exclude_unset=True)
    for day in fields.values():
        if day is not None:
            check_not_future(day)

    # Zakljucek se nastavi s statusom "read"; zakljucenemu branju ga ni mogoce izbrisati
    finishing = reading_session.finished_at is None and fields.get("finished_at")
    unfinishing = reading_session.finished_at is not None and fields.get(
        "finished_at", reading_session.finished_at
    ) is None
    if finishing or unfinishing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Use the reading status to start or finish"
        )

    for name, day in fields.items():
        setattr(reading_session, name, day)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Finish date cannot be before the start date"
        )
    db.refresh(reading_session)
    return reading_session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Izbrise zakljuceno branje (npr. napacen vnos). Tekoce branje se konca s statusom."""
    reading_session = db.get(ReadingSession, session_id)
    if reading_session is None or reading_session.reading_entry.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reading session not found")
    if reading_session.finished_at is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Use the reading status to stop reading"
        )
    db.delete(reading_session)
    db.commit()

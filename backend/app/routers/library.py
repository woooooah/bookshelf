"""Moja knjiznica: knjige, ki jih ima uporabnik v lasti. Samo za prijavljene."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import (
    BookFormat,
    Edition,
    EditionStatus,
    LibraryBook,
    Loan,
    ReadingEntry,
    User,
)
from app.schemas import LibraryBookCreate, LibraryBookOut, LibraryItemOut, LoanCreate, LoanOut

router = APIRouter(prefix="/library", tags=["library"])


@router.get("", response_model=list[LibraryItemOut])
def list_library(
    work_id: int | None = Query(default=None, description="Samo izvodi tega dela"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Izvodi uporabnika, najnovejsi prvi, s statusom branja dela."""
    query = (
        select(LibraryBook)
        .join(LibraryBook.edition)
        .where(LibraryBook.user_id == user.id)
        .options(
            joinedload(LibraryBook.edition).joinedload(Edition.work),
            joinedload(LibraryBook.edition).joinedload(Edition.publisher_collection),
            selectinload(LibraryBook.loans),
        )
        .order_by(LibraryBook.added_at.desc(), LibraryBook.id.desc())
    )
    if work_id is not None:
        query = query.where(Edition.work_id == work_id)
    books = db.scalars(query).unique().all()

    statuses = dict(
        db.execute(
            select(ReadingEntry.work_id, ReadingEntry.status).where(
                ReadingEntry.user_id == user.id,
                ReadingEntry.work_id.in_({b.edition.work_id for b in books}),
            )
        ).all()
    )
    return [
        LibraryItemOut.model_validate(book).model_copy(
            update={"reading_status": statuses.get(book.edition.work_id)}
        )
        for book in books
    ]


@router.delete("/{library_book_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(
    library_book_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Odstrani izvod iz knjiznice (skupaj z zgodovino posoj)."""
    book = _own_book(db, library_book_id, user)
    db.delete(book)
    db.commit()


def _clean(text: str | None) -> str | None:
    text = (text or "").strip()
    return text or None


@router.post("", response_model=LibraryBookOut, status_code=status.HTTP_201_CREATED)
def add_to_library(
    data: LibraryBookCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Oznaci izdajo kot "v lasti". Ce jo uporabnik ze ima, brez potrditve vrne 409."""
    edition = db.get(Edition, data.edition_id)
    visible = edition is not None and (
        edition.status == EditionStatus.approved or edition.added_by_user_id == user.id
    )
    if not visible:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Edition not found")

    if not data.confirm_duplicate:
        owned = db.scalar(
            select(func.count(LibraryBook.id)).where(
                LibraryBook.user_id == user.id, LibraryBook.edition_id == edition.id
            )
        )
        if owned:
            # Frontend vprasa, ali zeli dodati se en izvod
            raise HTTPException(status.HTTP_409_CONFLICT, "already_owned")

    # Mere imajo smisel samo za tiskane knjige
    physical = edition.format not in (BookFormat.ebook, BookFormat.audiobook)
    book = LibraryBook(
        user_id=user.id,
        edition_id=edition.id,
        location=_clean(data.location),
        notes=_clean(data.notes),
        height_mm=data.height_mm if physical else None,
        thickness_mm=data.thickness_mm if physical else None,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.get("/locations", response_model=list[str])
def list_locations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lokacije, ki jih je uporabnik ze uporabil (predlogi v obrazcu)."""
    return db.scalars(
        select(LibraryBook.location)
        .where(LibraryBook.user_id == user.id, LibraryBook.location.is_not(None))
        .distinct()
        .order_by(LibraryBook.location)
    ).all()


def _own_book(db: Session, library_book_id: int, user: User) -> LibraryBook:
    book = db.get(LibraryBook, library_book_id)
    # Tuj izvod vrne 404, da ne razkrije, da obstaja
    if book is None or book.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not in your library")
    return book


def check_not_future(day: date) -> None:
    # En dan rezerve zaradi razlike med casovnim pasom uporabnika in streznika
    if day > date.today() + timedelta(days=1):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Date cannot be in the future")


@router.post(
    "/{library_book_id}/loans", response_model=LoanOut, status_code=status.HTTP_201_CREATED
)
def lend_book(
    library_book_id: int,
    data: LoanCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Zabelezi posojo. Knjige ni mogoce posoditi, dokler prejsnja posoja ni vrnjena."""
    book = _own_book(db, library_book_id, user)
    borrower = data.borrower_name.strip()
    if not borrower:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Borrower name is required")
    loaned_at = data.loaned_at or date.today()
    check_not_future(loaned_at)
    if book.active_loan is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "already_loaned")

    loan = Loan(library_book_id=book.id, borrower_name=borrower, loaned_at=loaned_at)
    db.add(loan)
    try:
        db.commit()
    except IntegrityError:
        # Hkratna posoja iste knjige (baza dovoli samo eno aktivno)
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "already_loaned")
    db.refresh(loan)
    return loan

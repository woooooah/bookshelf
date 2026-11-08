"""Posoje knjig iz uporabnikove knjiznice. Vidi jih samo lastnik."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import Edition, LibraryBook, Loan, User
from app.routers.library import check_not_future
from app.schemas import LoanOut, LoanReturn, LoanWithBookOut

router = APIRouter(prefix="/loans", tags=["loans"])


@router.get("", response_model=list[LoanWithBookOut])
def list_loans(
    active: bool = True,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aktivne posoje (active=true) ali zgodovina vrnjenih posoj (active=false)."""
    returned = Loan.returned_at.is_(None) if active else Loan.returned_at.is_not(None)
    order = Loan.loaned_at.desc() if active else Loan.returned_at.desc()
    return db.scalars(
        select(Loan)
        .join(Loan.library_book)
        .where(LibraryBook.user_id == user.id, returned)
        .options(
            joinedload(Loan.library_book)
            .joinedload(LibraryBook.edition)
            .joinedload(Edition.work),
            joinedload(Loan.library_book).selectinload(LibraryBook.loans),
        )
        .order_by(order, Loan.id.desc())
    ).all()


@router.post("/{loan_id}/return", response_model=LoanOut)
def return_loan(
    loan_id: int,
    data: LoanReturn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Oznaci posojo kot vrnjeno. Posoja ostane v zgodovini."""
    loan = db.get(Loan, loan_id)
    if loan is None or loan.library_book.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Loan not found")
    if loan.returned_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "already_returned")

    returned_at = data.returned_at or date.today()
    check_not_future(returned_at)
    if returned_at < loan.loaned_at:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "Return date cannot be before the loan date"
        )

    loan.returned_at = returned_at
    db.commit()
    db.refresh(loan)
    return loan

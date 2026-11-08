"""Posoje knjig iz uporabnikove knjiznice. Vidi jih samo lastnik."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.auth import get_current_user
from app.db import get_db
from app.models import Edition, LibraryBook, Loan, User
from app.schemas import LoanWithBookOut

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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_token_claims
from app.db import get_db
from app.models import User
from app.schemas import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/me", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(
    data: UserCreate,
    claims: dict = Depends(get_token_claims),
    db: Session = Depends(get_db),
):
    """Po registraciji v Firebase ustvari uporabnika v nasi bazi (id = Firebase UID)."""
    if db.get(User, claims["uid"]) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Uporabnik je ze registriran")

    email = claims.get("email")
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Racun nima e-poste")

    # Uporabnisko ime je unikatno ne glede na velike in male crke
    taken = db.scalar(
        select(User.id).where(func.lower(User.username) == data.username.lower())
    )
    if taken:
        raise HTTPException(status.HTTP_409_CONFLICT, "Uporabnisko ime je ze zasedeno")

    user = User(id=claims["uid"], username=data.username, email=email)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Hkratna registracija z enakim imenom ali racunom
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Uporabnisko ime je ze zasedeno")
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)):
    """Podatki prijavljenega uporabnika."""
    return user

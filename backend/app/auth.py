"""Preverjanje prijave s Firebase ID zetonom (ADR-0006).

Frontend poslje zeton v glavi:  Authorization: Bearer <zeton>
Za zascito endpointa dodaj:      user: User = Depends(get_current_user)
"""

import logging
from pathlib import Path

import firebase_admin
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import User

logger = logging.getLogger("uvicorn.error")

# Brez kljuca backend se vedno zazene, endpointi s prijavo pa vrnejo 503
firebase_app = None
if Path(settings.firebase_credentials).is_file():
    firebase_app = firebase_admin.initialize_app(
        credentials.Certificate(settings.firebase_credentials)
    )
else:
    logger.warning(
        "Firebase kljuc %s ne obstaja, prijava ne bo delovala (glej README)",
        settings.firebase_credentials,
    )

bearer_scheme = HTTPBearer(auto_error=False)


def get_token_claims(
    token: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Preveri Firebase zeton in vrne njegovo vsebino (uid, email ...). Brez zetona: 401."""
    if firebase_app is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Firebase is not configured")
    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login required")
    try:
        return firebase_auth.verify_id_token(token.credentials, app=firebase_app)
    except (ValueError, firebase_auth.InvalidIdTokenError, firebase_auth.ExpiredIdTokenError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")


def get_current_user(
    claims: dict = Depends(get_token_claims),
    db: Session = Depends(get_db),
) -> User:
    """Prijavljen uporabnik iz nase baze. Ce se ni registriran ali je blokiran: 403."""
    user = db.get(User, claims["uid"])
    if user is None:
        # Frontend po tej napaki uporabnika poslje na izbiro uporabniskega imena
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not_registered")
    if user.blocked:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "User is blocked")
    return user

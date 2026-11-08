from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.routers import books, library, loans, users

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(library.router)
app.include_router(loans.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    """Preveri, ali se backend lahko poveze z bazo."""
    try:
        db.execute(text("select 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database connection failed")
    return {"status": "ok", "database": "connected"}

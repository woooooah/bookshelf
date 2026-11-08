from collections.abc import Iterator

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# pool_pre_ping: preveri povezavo pred uporabo (Supabase prekine neaktivne povezave)
engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

# Imena omejitev, enaka privzetim imenom v PostgreSQL (npr. loans_pkey, works_openlibrary_key_key).
# Alembic tako ve, kako se omejitev imenuje, ko jo kasneje spreminja ali brise.
NAMING_CONVENTION = {
    "pk": "%(table_name)s_pkey",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "uq": "%(table_name)s_%(column_0_N_name)s_key",
    "ix": "%(table_name)s_%(column_0_N_name)s_idx",
    "ck": "%(table_name)s_%(constraint_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def get_db() -> Iterator[Session]:
    """FastAPI odvisnost: ena seja na zahtevo, ki se na koncu zapre."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

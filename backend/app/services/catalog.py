"""Nas katalog knjig: iskanje in shranjevanje del iz Open Library (US-01)."""

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import BookFormat, Edition, EditionStatus, Work
from app.services import openlibrary

EDITION_FIELDS = ("title", "isbn", "openlibrary_key", "publisher", "publish_year", "page_count",
                  "language", "cover_url")


def search_catalog(db: Session, query: str, limit: int) -> list[Work]:
    """Vsaka beseda iskanja se mora pojaviti v naslovu, avtorju ali seriji."""
    words = query.split()
    conditions = [
        or_(
            Work.title.icontains(w, autoescape=True),
            Work.author.icontains(w, autoescape=True),
            Work.series.icontains(w, autoescape=True),
        )
        for w in words
    ]
    return list(db.scalars(select(Work).where(and_(*conditions)).order_by(Work.title).limit(limit)))


def find_edition_by_isbn(db: Session, isbn13: str) -> Edition | None:
    return db.scalar(
        select(Edition).where(Edition.isbn == isbn13, Edition.status == EditionStatus.approved)
    )


def _add_editions(db: Session, work: Work, editions: list[dict]) -> None:
    """Doda izdaje, ki jih se ni v bazi (ISBN in kljuc Open Library sta unikatna).

    Izdaje brez ISBN se ne shranijo.
    """
    editions = [e for e in editions if e["isbn"]]
    isbns = {e["isbn"] for e in editions if e["isbn"]}
    keys = {e["openlibrary_key"] for e in editions if e["openlibrary_key"]}
    existing = db.execute(
        select(Edition.isbn, Edition.openlibrary_key).where(
            or_(Edition.isbn.in_(isbns), Edition.openlibrary_key.in_(keys))
        )
    ).all()
    seen_isbns = {row.isbn for row in existing if row.isbn}
    seen_keys = {row.openlibrary_key for row in existing if row.openlibrary_key}

    for data in editions:
        isbn, key = data["isbn"], data["openlibrary_key"]
        if (isbn and isbn in seen_isbns) or (key and key in seen_keys):
            continue
        if isbn:
            seen_isbns.add(isbn)
        if key:
            seen_keys.add(key)
        fmt = BookFormat(data["format"]) if data["format"] else None
        work.editions.append(Edition(**{k: data[k] for k in EDITION_FIELDS}, format=fmt))


def import_work(db: Session, work_key: str, extra_edition: dict | None = None) -> Work | None:
    """Vrne delo iz baze; ce ga se ni, ga prenese iz Open Library in shrani z izdajami.

    extra_edition: izdaja, ki mora biti shranjena (npr. najdena po ISBN), tudi ce je ni
    med prvimi izdajami dela.
    """
    work = db.scalar(select(Work).where(Work.openlibrary_key == work_key))
    if work is not None and extra_edition is None:
        return work
    data = None if work is not None else openlibrary.fetch_work(work_key)
    if work is None and data is None:
        return None
    return save_work(db, work_key, data, extra_edition)


def save_work(
    db: Session, work_key: str, data: dict | None, extra_edition: dict | None = None
) -> Work | None:
    """Shrani ze preneseno delo (data iz openlibrary.fetch_work) in dodatno izdajo.

    Ce delo v bazi ze obstaja, se mu doda samo extra_edition.
    """
    work = db.scalar(select(Work).where(Work.openlibrary_key == work_key))
    if work is None:
        if data is None:
            return None
        data = dict(data)
        editions = data.pop("editions")
        work = Work(**data)
        db.add(work)
        _add_editions(db, work, editions + ([extra_edition] if extra_edition else []))
    elif extra_edition:
        _add_editions(db, work, [extra_edition])
    else:
        return work

    try:
        db.commit()
    except IntegrityError:
        # Isto delo je hkrati shranila druga zahteva
        db.rollback()
        return db.scalar(select(Work).where(Work.openlibrary_key == work_key))
    db.refresh(work)
    return work


def load_details(db: Session, work: Work) -> None:
    """Delu, shranjenemu z osnovnimi podatki, doda opis in izdaje iz Open Library.

    Ce Open Library ni dosegljiv, ostane pri osnovnih podatkih in poskusi ob naslednjem ogledu.
    """
    if work.details_loaded or not work.openlibrary_key:
        return
    try:
        data = openlibrary.fetch_work(work.openlibrary_key)
    except openlibrary.OpenLibraryError:
        return
    if data is not None:
        editions = data.pop("editions")
        for field in ("description", "genre", "cover_url", "first_publish_year"):
            if getattr(work, field) is None:
                setattr(work, field, data[field])
        if work.series is None:
            work.series, work.series_number = data["series"], data["series_number"]
        elif work.series_number is None and data["series"] == work.series:
            work.series_number = data["series_number"]
        _add_editions(db, work, editions)
    work.details_loaded = True
    db.commit()
    db.refresh(work)

"""Iskanje in prikaz knjig (US-01). Dostopno tudi neprijavljenim obiskovalcem."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import EditionStatus, Work
from app.schemas import BookDetail, EditionOut, ImportRequest, SearchResponse, SearchResult
from app.services import catalog, openlibrary
from app.services.isbn import to_isbn13

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/books", tags=["books"])

RESULT_COUNT = 10  # ce ima katalog manj zadetkov, se dopolnijo iz Open Library


def _from_work(work: Work, edition=None) -> SearchResult:
    return SearchResult(
        work_id=work.id,
        edition_id=edition.id if edition else None,
        openlibrary_key=work.openlibrary_key,
        title=work.title,
        author=work.author,
        series=work.series,
        series_number=work.series_number,
        cover_url=(edition.cover_url if edition else None) or work.cover_url,
        first_publish_year=work.first_publish_year,
        isbn=edition.isbn if edition else None,
    )


def _detail(work: Work) -> BookDetail:
    """Podatki dela s potrjenimi izdajami (rocno dodane cakajo na administratorja)."""
    editions = [
        EditionOut.model_validate(e) for e in work.editions if e.status == EditionStatus.approved
    ]
    return BookDetail.model_validate(work).model_copy(update={"editions": editions})


def _search_isbn(db: Session, isbn: str) -> SearchResponse:
    """Veljaven ISBN: prikaze tocno to izdajo (shrani jo, ce je se ni v katalogu)."""
    edition = catalog.find_edition_by_isbn(db, isbn)
    if edition is None:
        try:
            data = openlibrary.fetch_edition_by_isbn(isbn)
            if data is not None:
                catalog.import_work(db, data.pop("work_key"), extra_edition=data)
                edition = catalog.find_edition_by_isbn(db, isbn)
        except openlibrary.OpenLibraryError:
            logger.exception("Open Library ISBN lookup failed")
            return SearchResponse(results=[], openlibrary_error=True)
    if edition is None:
        return SearchResponse(results=[])
    return SearchResponse(results=[_from_work(edition.work, edition)])


@router.get("/search", response_model=SearchResponse)
def search_books(
    q: str = Query(min_length=4, max_length=200, description="Naslov, avtor ali ISBN"),
    db: Session = Depends(get_db),
):
    query = q.strip()
    isbn = to_isbn13(query)
    if isbn:
        return _search_isbn(db, isbn)

    results = [_from_work(w) for w in catalog.search_catalog(db, query, limit=20)]
    if len(results) >= RESULT_COUNT:
        return SearchResponse(results=results)

    # Dopolni z Open Library; dela, ki so ze v katalogu, preskoci
    known = {r.openlibrary_key for r in results if r.openlibrary_key}
    try:
        for hit in openlibrary.search(query, limit=RESULT_COUNT * 2):
            if len(results) >= RESULT_COUNT:
                break
            if hit["openlibrary_key"] not in known:
                known.add(hit["openlibrary_key"])
                results.append(SearchResult(**hit))
    except openlibrary.OpenLibraryError:
        logger.exception("Open Library search failed")
        return SearchResponse(results=results, openlibrary_error=True)
    return SearchResponse(results=results)


@router.post("/import", response_model=BookDetail)
def import_book(data: ImportRequest, db: Session = Depends(get_db)):
    """Shrani delo iz Open Library v katalog (ce ga se ni) in vrne njegove podatke."""
    try:
        work = catalog.import_work(db, data.openlibrary_key)
    except openlibrary.OpenLibraryError:
        logger.exception("Open Library import failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Open Library is unavailable")
    if work is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Book not found on Open Library or it has no ISBN"
        )
    return _detail(work)


@router.get("/{work_id}", response_model=BookDetail)
def get_book(work_id: int, db: Session = Depends(get_db)):
    work = db.get(Work, work_id)
    if work is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Book not found")
    return _detail(work)

"""Uvoz vrstic iz Goodreads izvoza: iskanje del in shranjevanje statusa branja.

Vsaka knjiga potrebuje en klic Open Library (osnovni podatki dela in izdaje); opis in
ostale izdaje se prenesejo sele ob prvem ogledu knjige. Klici tecejo vzporedno,
pisanje v bazo pa zaporedno v eni seji.
"""

import re
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ReadingEntry, ReadingSession, ReadingStatus, User, Work
from app.services import catalog, openlibrary

PARALLEL_REQUESTS = 4
SERIES_IN_TITLE = re.compile(r"\s*\(([^()]*?),?\s*#\s*([\d.\-]+)\)\s*$")


def split_title(title: str) -> tuple[str, str | None, int | None]:
    """'The Final Empire (Mistborn, #1)' -> ('The Final Empire', 'Mistborn', 1)."""
    match = SERIES_IN_TITLE.search(title)
    if not match:
        return title.strip(), None, None
    number = match.group(2)
    return (
        title[: match.start()].strip() or title,
        match.group(1).strip() or None,
        int(number) if number.isdigit() else None,  # "#0.5" ali "#1-3" nima ene stevilke
    )


def _lookup(row: dict) -> dict | None:
    """Najde delo: najprej po ISBN, nato po naslovu in avtorju (brez serije v naslovu)."""
    title, series, number = split_title(row["title"])
    author = row["author"].split(",")[0]
    try:
        data = openlibrary.lookup(isbn=row["isbn"]) if row["isbn"] else None
        if data is None:
            data = openlibrary.lookup(title=title, author=author)
        if data is None and ":" in title:
            data = openlibrary.lookup(title=title.split(":")[0], author=author)
    except openlibrary.OpenLibraryError:
        return None
    if data is not None and series:
        # Serija iz Goodreadsa je zanesljivejsa od oznak v Open Library
        data["series"], data["series_number"] = series, number
    return data


def _add_reading(db: Session, user: User, work: Work, row: dict) -> bool:
    """Doda status branja. Vrne False, ce ga je uporabnik za to delo ze imel (ne prepise)."""
    exists = db.scalar(
        select(ReadingEntry.id).where(
            ReadingEntry.user_id == user.id, ReadingEntry.work_id == work.id
        )
    )
    if exists:
        return False

    entry = ReadingEntry(user_id=user.id, work_id=work.id, status=row["status"])
    if row["status"] == ReadingStatus.reading:
        entry.sessions.append(ReadingSession())
    elif row["status"] == ReadingStatus.read and row["date_read"] is not None:
        entry.sessions.append(ReadingSession(finished_at=row["date_read"]))
    db.add(entry)
    db.commit()
    return True


def import_rows(db: Session, user: User, rows: list[dict]) -> list[dict]:
    # Dela, ki jih po ISBN ze najdemo v katalogu, ne potrebujejo klicev Open Library
    known: dict[int, Work] = {}
    for row in rows:
        edition = catalog.find_edition_by_isbn(db, row["isbn"]) if row["isbn"] else None
        if edition is not None:
            known[row["row"]] = edition.work

    pending = [r for r in rows if r["row"] not in known]
    with ThreadPoolExecutor(PARALLEL_REQUESTS) as pool:
        found = dict(zip((r["row"] for r in pending), pool.map(_lookup, pending)))

    results = []
    for row in rows:
        work = known.get(row["row"])
        data = found.get(row["row"])
        if work is None and data is not None:
            editions = data["editions"]
            work = catalog.save_work(
                db, data["openlibrary_key"], data, editions[0] if editions else None
            )

        if work is None:
            outcome = "unrecognized"
        else:
            outcome = "imported" if _add_reading(db, user, work, row) else "existing"
        results.append(
            {
                "row": row["row"],
                "title": row["title"],
                "author": row["author"],
                "result": outcome,
                "work_id": work.id if work else None,
            }
        )
    return results

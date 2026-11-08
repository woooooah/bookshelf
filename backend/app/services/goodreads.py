"""Branje CSV izvoza iz Goodreadsa (My Books -> Import and export -> Export library)."""

import csv
import io
import re
from datetime import date, datetime

from app.models import ReadingStatus
from app.services.isbn import to_isbn13

REQUIRED_COLUMNS = {"Book Id", "Title", "Author", "ISBN", "ISBN13", "Exclusive Shelf", "Date Read"}

SHELF_STATUS = {
    "read": ReadingStatus.read,
    "currently-reading": ReadingStatus.reading,
    "to-read": ReadingStatus.want_to_read,
}


class NotGoodreadsExport(Exception):
    """Datoteka ni CSV izvoz iz Goodreadsa."""


def _isbn(value: str) -> str | None:
    # Goodreads zapise ISBN kot ="0439023483", da ga Excel ne pretvori v stevilo
    return to_isbn13(value.strip().lstrip("=").strip('"')) if value else None


def _date(value: str) -> date | None:
    try:
        return datetime.strptime(value.strip(), "%Y/%m/%d").date()
    except ValueError:
        return None


def _author(value: str) -> str:
    # Goodreads ima vcasih dvojne presledke ("Rachel  Reid")
    return re.sub(r"\s+", " ", value).strip()


def parse_export(content: bytes) -> tuple[list[dict], list[dict]]:
    """Vrne (vrstice za uvoz, preskocene vrstice). Ce datoteka ni izvoz, sprozi napako."""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise NotGoodreadsExport from exc

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(reader.fieldnames):
        raise NotGoodreadsExport

    rows, skipped = [], []
    for line, record in enumerate(reader, start=2):  # 1. vrstica je glava
        title = (record.get("Title") or "").strip()
        author = _author(record.get("Author") or "")
        shelf = (record.get("Exclusive Shelf") or "").strip()
        base = {"row": line, "title": title, "author": author}

        if not title:
            skipped.append({**base, "reason": "Missing title"})
            continue
        status = SHELF_STATUS.get(shelf)
        if status is None:
            skipped.append({**base, "reason": f'Shelf "{shelf}" is not supported'})
            continue

        rows.append(
            {
                **base,
                "goodreads_id": (record.get("Book Id") or "").strip(),
                "isbn": _isbn(record.get("ISBN13") or "") or _isbn(record.get("ISBN") or ""),
                "status": status,
                "date_read": _date(record.get("Date Read") or "") if status == ReadingStatus.read else None,
            }
        )
    return rows, skipped

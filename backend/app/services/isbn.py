"""Preverjanje ISBN stevilk. V bazi se ISBN hrani kot ISBN-13 brez vezajev."""

import re


def _clean(value: str) -> str:
    return re.sub(r"[\s-]", "", value).upper()


def _valid_isbn10(isbn: str) -> bool:
    if not re.fullmatch(r"\d{9}[\dX]", isbn):
        return False
    total = sum((10 - i) * (10 if c == "X" else int(c)) for i, c in enumerate(isbn))
    return total % 11 == 0


def _valid_isbn13(isbn: str) -> bool:
    if not re.fullmatch(r"97[89]\d{10}", isbn):
        return False
    total = sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(isbn))
    return total % 10 == 0


def _isbn10_to_13(isbn10: str) -> str:
    core = "978" + isbn10[:9]
    check = (10 - sum(int(c) * (1 if i % 2 == 0 else 3) for i, c in enumerate(core)) % 10) % 10
    return core + str(check)


def to_isbn13(value: str) -> str | None:
    """Veljaven ISBN-10 ali ISBN-13 (z vezaji ali brez) pretvori v ISBN-13, sicer None."""
    isbn = _clean(value)
    if _valid_isbn13(isbn):
        return isbn
    if _valid_isbn10(isbn):
        return _isbn10_to_13(isbn)
    return None

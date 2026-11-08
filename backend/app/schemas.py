"""Pydantic sheme za zahteve in odgovore API-ja."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import BookFormat, ReadingStatus, UserRole


class UserCreate(BaseModel):
    # 3–30 znakov: crke, stevke, pika, podcrtaj, vezaj (uporabi se v /users/{username})
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9._-]+$")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    role: UserRole
    profile_public: bool


# Knjige ----------------------------------------------------------------------


class SearchResult(BaseModel):
    """Zadetek iskanja: delo iz kataloga (work_id) ali iz Open Library (samo openlibrary_key)."""

    work_id: int | None = None
    edition_id: int | None = None  # samo pri iskanju po ISBN
    openlibrary_key: str | None = None
    title: str
    author: str
    series: str | None = None
    series_number: int | None = None
    cover_url: str | None = None
    first_publish_year: int | None = None
    isbn: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    openlibrary_error: bool = False  # Open Library ni bil dosegljiv; prikazan je samo katalog


class ImportRequest(BaseModel):
    openlibrary_key: str = Field(pattern=r"^/works/OL\d+W$")


class EditionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None
    isbn: str | None
    publisher: str | None
    publish_year: int | None
    page_count: int | None
    language: str | None
    cover_url: str | None
    format: BookFormat | None


class BookDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    genre: str | None
    series: str | None
    series_number: int | None
    description: str | None
    cover_url: str | None
    first_publish_year: int | None
    openlibrary_key: str | None
    editions: list[EditionOut]


# Knjiznica -------------------------------------------------------------------


class LibraryBookCreate(BaseModel):
    edition_id: int
    location: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)
    height_mm: int | None = Field(default=None, gt=0, le=1000)
    thickness_mm: int | None = Field(default=None, gt=0, le=500)
    # Ce uporabnik izdajo ze ima, se nov izvod doda samo s potrditvijo
    confirm_duplicate: bool = False


class LibraryBookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    edition_id: int
    location: str | None
    notes: str | None
    height_mm: int | None
    thickness_mm: int | None
    added_at: datetime


class LibraryWork(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str
    series: str | None
    series_number: int | None
    genre: str | None
    cover_url: str | None


class LibraryEdition(EditionOut):
    work: LibraryWork


class LoanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    borrower_name: str
    loaned_at: date
    returned_at: date | None


class LibraryItemOut(LibraryBookOut):
    """Izvod v knjiznici z izdajo in delom za prikaz."""

    edition: LibraryEdition
    active_loan: LoanOut | None


# Posoje ----------------------------------------------------------------------


class LoanCreate(BaseModel):
    borrower_name: str = Field(min_length=1, max_length=100)
    loaned_at: date | None = None  # privzeto danes


class LoanReturn(BaseModel):
    returned_at: date | None = None  # privzeto danes


class LoanWithBookOut(LoanOut):
    library_book: LibraryItemOut


# Branje -----------------------------------------------------------------------


class ReadingStatusUpdate(BaseModel):
    status: ReadingStatus
    # "reading": datum zacetka (privzeto danes); "read": datum zakljucka (neobvezen)
    day: date | None = None


class ReadingSessionUpdate(BaseModel):
    started_at: date | None = None
    finished_at: date | None = None


class ReadingSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: date | None
    finished_at: date | None


class ReadingEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_id: int
    status: ReadingStatus
    sessions: list[ReadingSessionOut]


class ReadingItemOut(ReadingEntryOut):
    work: LibraryWork


# Bralni cilj ------------------------------------------------------------------


class ReadingGoalUpdate(BaseModel):
    target_books: int = Field(gt=0, le=1000)


class ReadingGoalOut(BaseModel):
    year: int
    target_books: int | None  # None = cilj za to leto se ni nastavljen
    read_count: int  # branja z datumom zakljucka v tem letu (tudi ponovna)


# Uvoz iz Goodreadsa -----------------------------------------------------------


class ImportRow(BaseModel):
    row: int  # vrstica v CSV datoteki
    goodreads_id: str
    title: str
    author: str
    isbn: str | None
    status: ReadingStatus
    date_read: date | None


class SkippedRow(BaseModel):
    row: int
    title: str
    author: str
    reason: str


class ImportPreview(BaseModel):
    rows: list[ImportRow]
    skipped: list[SkippedRow]

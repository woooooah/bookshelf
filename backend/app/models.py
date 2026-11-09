"""SQLAlchemy modeli. Iz njih Alembic ustvari migracije (glej README).

Ko spremenis model, ustvari novo migracijo:
    docker compose run --rm backend alembic revision --autogenerate -m "opis spremembe"
Autogenerate ne zazna sprememb CHECK omejitev; te dopisi v migracijo rocno.
"""

import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Index,
    Numeric,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def pg_enum(enum_cls: type[enum.Enum], name: str) -> Enum:
    # V bazi se shranijo vrednosti ("want_to_read"), ne imena clanov
    return Enum(enum_cls, name=name, values_callable=lambda e: [m.value for m in e])


def id_column() -> Mapped[int]:
    return mapped_column(BigInteger, Identity(always=True), primary_key=True)


def fk(target: str, ondelete: str, nullable: bool = False) -> Mapped:
    return mapped_column(BigInteger, ForeignKey(target, ondelete=ondelete), nullable=nullable)


def user_fk(ondelete: str, nullable: bool = False) -> Mapped:
    return mapped_column(Text, ForeignKey("users.id", ondelete=ondelete), nullable=nullable)


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class BookFormat(str, enum.Enum):
    print = "print"
    ebook = "ebook"
    audiobook = "audiobook"


class EditionStatus(str, enum.Enum):
    approved = "approved"
    pending = "pending"


class ReadingStatus(str, enum.Enum):
    want_to_read = "want_to_read"
    reading = "reading"
    read = "read"


# Uporabniki -------------------------------------------------------------------
# "user" je v PostgreSQL rezervirana beseda, zato "users".
# id je Firebase UID; gesla hrani Firebase (ADR-0006).


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    username: Mapped[str] = mapped_column(Text, unique=True)
    email: Mapped[str] = mapped_column(Text, unique=True)
    role: Mapped[UserRole] = mapped_column(
        pg_enum(UserRole, "user_role"), server_default="user"
    )
    profile_public: Mapped[bool] = mapped_column(server_default=text("false"))
    blocked: Mapped[bool] = mapped_column(server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    library_books: Mapped[list["LibraryBook"]] = relationship(back_populates="user")
    reading_entries: Mapped[list["ReadingEntry"]] = relationship(back_populates="user")
    reading_goals: Mapped[list["ReadingGoal"]] = relationship(back_populates="user")
    shelves: Mapped[list["Shelf"]] = relationship(back_populates="user")


# Katalog ----------------------------------------------------------------------


class Work(Base):
    __tablename__ = "works"
    __table_args__ = (CheckConstraint("series_number > 0", name="series_number_check"),)

    id: Mapped[int] = id_column()
    title: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(Text)
    genre: Mapped[str | None] = mapped_column(Text)
    series: Mapped[str | None] = mapped_column(Text)
    series_number: Mapped[int | None]
    description: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(Text)  # glavna naslovnica dela
    first_publish_year: Mapped[int | None]
    openlibrary_key: Mapped[str | None] = mapped_column(Text, unique=True)  # /works/OL66554W
    # False: shranjeni so samo osnovni podatki (npr. ob uvozu); opis in izdaje se
    # prenesejo ob prvem ogledu knjige
    details_loaded: Mapped[bool] = mapped_column(server_default=text("true"))

    editions: Mapped[list["Edition"]] = relationship(
        back_populates="work", order_by="Edition.publish_year.desc().nulls_last()"
    )


class PublisherCollection(Base):
    __tablename__ = "publisher_collections"

    id: Mapped[int] = id_column()
    name: Mapped[str] = mapped_column(Text, unique=True)
    publisher: Mapped[str | None] = mapped_column(Text)

    editions: Mapped[list["Edition"]] = relationship(back_populates="publisher_collection")


class Edition(Base):
    __tablename__ = "editions"
    __table_args__ = (CheckConstraint("page_count > 0", name="page_count_check"),)

    id: Mapped[int] = id_column()
    work_id: Mapped[int] = fk("works.id", "CASCADE")
    title: Mapped[str | None] = mapped_column(Text)  # naslov izdaje (npr. prevod); prazno = naslov dela
    isbn: Mapped[str | None] = mapped_column(Text, unique=True)  # starejse knjige ga nimajo
    # npr. /books/OL7353617M, za izdaje brez ISBN
    openlibrary_key: Mapped[str | None] = mapped_column(Text, unique=True)
    publisher: Mapped[str | None] = mapped_column(Text)
    publish_year: Mapped[int | None]
    page_count: Mapped[int | None]
    language: Mapped[str | None] = mapped_column(Text)
    cover_url: Mapped[str | None] = mapped_column(Text)
    # Open Library formata pogosto nima
    format: Mapped[BookFormat | None] = mapped_column(pg_enum(BookFormat, "book_format"))
    publisher_collection_id: Mapped[int | None] = fk(
        "publisher_collections.id", "SET NULL", nullable=True
    )
    status: Mapped[EditionStatus] = mapped_column(
        pg_enum(EditionStatus, "edition_status"), server_default="approved"
    )
    added_by_user_id: Mapped[str | None] = user_fk("SET NULL", nullable=True)

    work: Mapped[Work] = relationship(back_populates="editions")
    publisher_collection: Mapped[PublisherCollection | None] = relationship(
        back_populates="editions"
    )


Index(None, Edition.work_id)


# Knjiznica --------------------------------------------------------------------


class Shelf(Base):
    __tablename__ = "shelves"
    __table_args__ = (
        CheckConstraint("width_mm > 0", name="width_mm_check"),
        CheckConstraint("height_mm > 0", name="height_mm_check"),
    )

    id: Mapped[int] = id_column()
    user_id: Mapped[str] = user_fk("CASCADE")
    name: Mapped[str] = mapped_column(Text)
    width_mm: Mapped[int]
    height_mm: Mapped[int]

    user: Mapped[User] = relationship(back_populates="shelves")
    library_books: Mapped[list["LibraryBook"]] = relationship(back_populates="shelf")


# Brez unique(user_id, edition_id): uporabnik ima lahko vec izvodov iste izdaje (US-04).
class LibraryBook(Base):
    __tablename__ = "library_books"
    __table_args__ = (
        CheckConstraint("height_mm > 0", name="height_mm_check"),
        CheckConstraint("thickness_mm > 0", name="thickness_mm_check"),
    )

    id: Mapped[int] = id_column()
    user_id: Mapped[str] = user_fk("CASCADE")
    edition_id: Mapped[int] = fk("editions.id", "RESTRICT")
    location: Mapped[str | None] = mapped_column(Text)  # vedno zasebno
    notes: Mapped[str | None] = mapped_column(Text)  # vedno zasebno
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    shelf_id: Mapped[int | None] = fk("shelves.id", "SET NULL", nullable=True)
    height_mm: Mapped[int | None]
    thickness_mm: Mapped[int | None]

    user: Mapped[User] = relationship(back_populates="library_books")
    edition: Mapped[Edition] = relationship()
    shelf: Mapped[Shelf | None] = relationship(back_populates="library_books")
    # Ob brisanju izvoda baza sama izbrise njegove posoje (ON DELETE CASCADE)
    loans: Mapped[list["Loan"]] = relationship(
        back_populates="library_book",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Loan.loaned_at.desc()",
    )

    @property
    def active_loan(self) -> "Loan | None":
        """Posoja, ki se ni vrnjena (najvec ena)."""
        return next((loan for loan in self.loans if loan.returned_at is None), None)


Index(None, LibraryBook.user_id)
Index(None, LibraryBook.edition_id)


class Loan(Base):
    __tablename__ = "loans"
    __table_args__ = (
        CheckConstraint("length(trim(borrower_name)) > 0", name="borrower_name_check"),
        CheckConstraint(
            "returned_at IS NULL OR returned_at >= loaned_at", name="returned_at_check"
        ),
        # Najvec ena aktivna (nevrnjena) posoja na knjigo (US-06)
        Index(
            "loans_one_active_per_book",
            "library_book_id",
            unique=True,
            postgresql_where=text("returned_at IS NULL"),
        ),
    )

    id: Mapped[int] = id_column()
    library_book_id: Mapped[int] = fk("library_books.id", "CASCADE")
    borrower_name: Mapped[str] = mapped_column(Text)  # izposojevalec nima racuna
    loaned_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    returned_at: Mapped[date | None] = mapped_column(Date)  # prazno = se posojena

    library_book: Mapped[LibraryBook] = relationship(back_populates="loans")


# Branje -----------------------------------------------------------------------


class ReadingEntry(Base):
    __tablename__ = "reading_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "work_id"),  # en vnos na delo
        # 0–5 v korakih po 0.25 (US-08)
        CheckConstraint(
            "rating BETWEEN 0 AND 5 AND rating * 4 = floor(rating * 4)", name="rating_check"
        ),
        CheckConstraint("length(review) <= 5000", name="review_check"),
    )

    id: Mapped[int] = id_column()
    user_id: Mapped[str] = user_fk("CASCADE")
    work_id: Mapped[int] = fk("works.id", "CASCADE")
    status: Mapped[ReadingStatus] = mapped_column(pg_enum(ReadingStatus, "reading_status"))
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2))
    review: Mapped[str | None] = mapped_column(Text)
    review_hidden: Mapped[bool] = mapped_column(server_default=text("false"))

    user: Mapped[User] = relationship(back_populates="reading_entries")
    work: Mapped[Work] = relationship()
    sessions: Mapped[list["ReadingSession"]] = relationship(
        back_populates="reading_entry",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ReadingSession.id",
    )

    @property
    def open_session(self) -> "ReadingSession | None":
        """Branje, ki se poteka (brez datuma zakljucka)."""
        return next((s for s in self.sessions if s.finished_at is None), None)


class ReadingSession(Base):
    __tablename__ = "reading_sessions"
    __table_args__ = (
        CheckConstraint("current_page >= 0", name="current_page_check"),
        CheckConstraint(
            "started_at IS NULL OR finished_at IS NULL OR finished_at >= started_at",
            name="finished_at_check",
        ),
        # Iste knjige ni mogoce brati dvakrat hkrati
        Index(
            "reading_sessions_one_active_per_entry",
            "reading_entry_id",
            unique=True,
            postgresql_where=text("finished_at IS NULL"),
        ),
    )

    id: Mapped[int] = id_column()
    reading_entry_id: Mapped[int] = fk("reading_entries.id", "CASCADE")
    edition_id: Mapped[int | None] = fk("editions.id", "SET NULL", nullable=True)
    started_at: Mapped[date | None] = mapped_column(Date)
    finished_at: Mapped[date | None] = mapped_column(Date)  # prazno = branje se poteka
    current_page: Mapped[int | None]

    reading_entry: Mapped[ReadingEntry] = relationship(back_populates="sessions")
    edition: Mapped[Edition | None] = relationship()


# Za letni cilj: stetje branj po datumu zakljucka
Index(None, ReadingSession.finished_at)


class ReadingGoal(Base):
    __tablename__ = "reading_goals"
    __table_args__ = (
        UniqueConstraint("user_id", "year"),
        CheckConstraint("target_books > 0", name="target_books_check"),
    )

    id: Mapped[int] = id_column()
    user_id: Mapped[str] = user_fk("CASCADE")
    year: Mapped[int]
    target_books: Mapped[int]

    user: Mapped[User] = relationship(back_populates="reading_goals")

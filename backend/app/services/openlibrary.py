"""Klici Open Library API (ADR-0007) in pretvorba odgovorov v nase podatke.

Podatki Open Library so nedosledni (format, serija, zanr), zato jih tu pocistimo.
Uporabljamo samo knjige in izdaje z ISBN; ostale (npr. plakati, stari tiski) preskocimo.
"""

import re
from collections import Counter

import httpx

from app.services.isbn import to_isbn13

BASE_URL = "https://openlibrary.org"
COVER_URL = "https://covers.openlibrary.org/b/id/{}-M.jpg"
MAX_EDITIONS = 50  # popularna dela imajo stotine izdaj

_client = httpx.Client(
    base_url=BASE_URL,
    timeout=10,
    follow_redirects=True,
    # Open Library prosi, da se aplikacija predstavi
    headers={"User-Agent": "BookShelf/0.1 (student project)"},
)


class OpenLibraryError(Exception):
    """Open Library ni dosegljiv ali je vrnil napako."""


def _get(path: str, params: dict | None = None) -> dict | None:
    """GET zahteva; vrne None, ce vir ne obstaja (404)."""
    try:
        response = _client.get(path, params=params)
    except httpx.HTTPError as exc:
        raise OpenLibraryError(str(exc)) from exc
    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        raise OpenLibraryError(f"{path}: {response.status_code}")
    return response.json()


# Pomozne funkcije --------------------------------------------------------------

GENRE_KEYWORDS = [
    ("science fiction", "Science fiction"),
    ("fantasy", "Fantasy"),
    ("horror", "Horror"),
    ("thriller", "Thriller"),
    ("detective", "Mystery"),
    ("mystery", "Mystery"),
    ("romance", "Romance"),
    ("love stories", "Romance"),
    ("historical fiction", "Historical fiction"),
    ("biography", "Biography"),
    ("poetry", "Poetry"),
    ("juvenile", "Children's"),
    ("children", "Children's"),
    ("young adult", "Young adult"),
    ("history", "History"),
    ("fiction", "Fiction"),
]


def _cover(cover_ids: list | None) -> str | None:
    ids = [c for c in cover_ids or [] if isinstance(c, int) and c > 0]
    return COVER_URL.format(ids[0]) if ids else None


def _year(text: str | None) -> int | None:
    match = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", text or "")
    return int(match.group()) if match else None


def _tagged(subjects: list[str], tag: str) -> str | None:
    """Vrednost oznake, npr. 'series:Harry_Potter' -> 'Harry Potter'."""
    for subject in subjects:
        if subject.lower().startswith(tag + ":"):
            return subject.split(":", 1)[1].replace("_", " ").strip() or None
    return None


def _genre(subjects: list[str]) -> str | None:
    tagged = _tagged(subjects, "genre")
    if tagged:
        return tagged[:1].upper() + tagged[1:]
    # Zanr, ki se pojavi v najvec oznakah ("Fiction" samo, ce ni nic bolj natancnega)
    lowered = [s.lower() for s in subjects if ":" not in s]
    counts = Counter()
    for subject in lowered:
        for keyword, genre in GENRE_KEYWORDS:
            if keyword in subject:
                counts[genre] += 1
                break
    specific = [(n, g) for g, n in counts.items() if g != "Fiction"]
    if specific:
        return max(specific)[1]
    return "Fiction" if counts else None


def _split_series(value: str) -> tuple[str | None, int | None]:
    """'Mistborn -- [bk. 1]', 'Harry Potter ; 1', 'Dune #2' -> (ime, stevilka)."""
    number = None
    match = re.search(
        r"(?:#|;|,|\bbk\.?|\bbook|\bvol\.?|\bno\.?|\()\s*(\d{1,3})\b\)?", value, re.I
    )
    if match:
        number = int(match.group(1))
        value = value[: match.start()]
    name = re.sub(r"[\s\-–—;:,(\[]+$", "", value).strip()
    return (name or None), number


def _format(physical_format: str | None) -> str | None:
    text = (physical_format or "").lower()
    if "audio" in text:
        return "audiobook"
    if any(k in text for k in ("ebook", "e-book", "kindle", "epub", "digital")):
        return "ebook"
    print_words = ("paperback", "papberback", "hardcover", "hardback", "mass market", "pocket",
                   "taschenbuch", "brochura", "bunko", "print", "binding", "board book")
    if any(k in text for k in print_words):
        return "print"
    return None


def _isbn13(edition: dict) -> str | None:
    for value in (edition.get("isbn_13") or []) + (edition.get("isbn_10") or []):
        isbn = to_isbn13(value)
        if isbn:
            return isbn
    return None


def _description(value) -> str | None:
    if isinstance(value, dict):
        value = value.get("value")
    return value.strip() if isinstance(value, str) and value.strip() else None


def parse_edition(data: dict) -> dict:
    languages = data.get("languages") or []
    publishers = data.get("publishers") or []
    pages = data.get("number_of_pages")
    return {
        "openlibrary_key": data.get("key"),
        "title": (data.get("title") or "").strip() or None,
        "isbn": _isbn13(data),
        "publisher": publishers[0] if publishers else None,
        "publish_year": _year(data.get("publish_date")),
        "page_count": pages if isinstance(pages, int) and pages > 0 else None,
        "language": languages[0]["key"].rsplit("/", 1)[-1] if languages else None,
        "cover_url": _cover(data.get("covers")),
        "format": _format(data.get("physical_format")),
        "series_raw": (data.get("series") or [None])[0],
    }


# Javne funkcije ----------------------------------------------------------------


def search(query: str, limit: int) -> list[dict]:
    """Iskanje del z vsaj eno izdajo z ISBN. Serija je znana samo, ce ima delo oznako 'series:'."""
    data = _get(
        "/search.json",
        {
            "q": f"{query} isbn:*",
            "limit": limit,
            "fields": "key,title,author_name,cover_i,first_publish_year,subject",
        },
    )
    results = []
    for doc in (data or {}).get("docs", []):
        series, number = _split_series(_tagged(doc.get("subject") or [], "series") or "")
        results.append(
            {
                "openlibrary_key": doc["key"],
                "title": doc.get("title") or "Untitled",
                "author": ", ".join((doc.get("author_name") or [])[:3]) or "Unknown author",
                "series": series,
                "series_number": number,
                "cover_url": _cover([doc.get("cover_i")]),
                "first_publish_year": doc.get("first_publish_year"),
            }
        )
    return results


def fetch_work(work_key: str) -> dict | None:
    """Delo z avtorji in izdajami z ISBN, pripravljeno za shranjevanje.

    None, ce delo ne obstaja ali nima nobene izdaje z ISBN.
    """
    work = _get(f"{work_key}.json")
    if work is None or work.get("type", {}).get("key") == "/type/redirect":
        return None

    editions_data = _get(f"{work_key}/editions.json", {"limit": MAX_EDITIONS}) or {}
    editions = [parse_edition(e) for e in editions_data.get("entries", [])]
    editions = [e for e in editions if e["isbn"]]
    if not editions:
        return None

    authors = []
    for entry in (work.get("authors") or [])[:3]:
        key = (entry.get("author") or {}).get("key")
        author = _get(f"{key}.json") if key else None
        if author and author.get("name"):
            authors.append(author["name"])

    subjects = work.get("subjects") or []
    series, number = _split_series(_tagged(subjects, "series") or "")
    # Pri izdajah je "series" pogosto zbirka zalozbe v drugem jeziku (npr. "Foliot cadet"),
    # zato upostevamo samo angleske izdaje in serijo, ki se ponovi vsaj dvakrat
    edition_series = [
        _split_series(e["series_raw"])
        for e in editions
        if e["series_raw"] and e["language"] == "eng"
    ]
    if not series and edition_series:
        (name, num), count = Counter(edition_series).most_common(1)[0]
        if count >= 2:
            series, number = name, num
    if series and number is None:
        # Zaporedna stevilka je pogosto samo pri izdajah (npr. "Mistborn -- [bk. 1]")
        numbers = Counter(n for _, n in edition_series if n is not None)
        if numbers:
            number = numbers.most_common(1)[0][0]

    years = [e["publish_year"] for e in editions if e["publish_year"]]
    first_year = _year(work.get("first_publish_date")) or (min(years) if years else None)

    return {
        "openlibrary_key": work_key,
        "title": work.get("title") or "Untitled",
        "author": ", ".join(authors) or "Unknown author",
        "genre": _genre(subjects),
        "series": series,
        "series_number": number,
        "description": _description(work.get("description")),
        "cover_url": _cover(work.get("covers")),
        "first_publish_year": first_year,
        "editions": editions,
    }


def fetch_edition_by_isbn(isbn: str) -> dict | None:
    """Izdaja po ISBN in kljuc njenega dela. None, ce je Open Library nima."""
    data = _get(f"/isbn/{isbn}.json")
    if not data or not data.get("works"):
        return None
    edition = parse_edition(data)
    edition["isbn"] = isbn
    edition["work_key"] = data["works"][0]["key"]
    return edition

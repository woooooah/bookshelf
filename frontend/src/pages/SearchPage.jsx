import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, apiGet } from "../api.js";
import { seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";

const MIN_QUERY_LENGTH = 4;

// Rezultati iskanja
export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = (searchParams.get("q") ?? "").trim();
    // Odgovor za doloceno iskanje; ce se query ne ujema, se rezultati se nalagajo
    const [state, setState] = useState({
        query: null,
        status: null,
        data: null,
    });

    useEffect(() => {
        if (query.length < MIN_QUERY_LENGTH) return;
        let ignore = false; // ce uporabnik medtem isce znova, star odgovor zavrzemo
        apiGet(`/books/search?q=${encodeURIComponent(query)}`)
            .then(
                (data) => !ignore && setState({ query, status: "done", data }),
            )
            .catch(
                () =>
                    !ignore && setState({ query, status: "error", data: null }),
            );
        return () => {
            ignore = true;
        };
    }, [query]);

    const tooShort = query.length < MIN_QUERY_LENGTH;
    const status = state.query === query ? state.status : "loading";

    return (
        <section className="space-y-6">
            <SearchForm key={query} initialQuery={query} />

            {tooShort && (
                <p className="text-muted">
                    Enter at least {MIN_QUERY_LENGTH} characters to search.
                </p>
            )}
            {!tooShort && status === "loading" && (
                <p className="text-muted">Searching...</p>
            )}
            {!tooShort && status === "error" && (
                <p className="text-red-700">Search failed. Please try again.</p>
            )}
            {!tooShort && status === "done" && (
                <Results response={state.data} />
            )}
        </section>
    );
}

function SearchForm({ initialQuery }) {
    const [value, setValue] = useState(initialQuery);
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();
        navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Title, author or ISBN"
                aria-label="Search books"
                className="flex-1 rounded-md border border-line-strong px-3 py-2 focus:border-accent focus:outline-none"
            />
            <button
                type="submit"
                className="rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-accent-dark">
                Search
            </button>
        </form>
    );
}

function Results({ response }) {
    const { results, openlibrary_error: openLibraryError } = response;
    const [openingKey, setOpeningKey] = useState(null);
    const [importError, setImportError] = useState("");
    const navigate = useNavigate();

    // Knjigo iz Open Library najprej shranimo v db, nato odpremo njeno stran
    async function openFromOpenLibrary(key) {
        setImportError("");
        setOpeningKey(key);
        try {
            const book = await apiFetch("/books/import", {
                method: "POST",
                body: { openlibrary_key: key },
            });
            navigate(`/books/${book.id}`);
        } catch {
            setImportError(
                "Could not load this book from Open Library. Please try again.",
            );
            setOpeningKey(null);
        }
    }

    return (
        <div className="space-y-3">
            <h1 className="text-lg font-semibold">Results</h1>
            {openLibraryError && (
                <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent-dark">
                    Open Library is unavailable, so only books from our catalog
                    are shown.
                </p>
            )}
            {importError && (
                <p className="text-sm text-red-700">{importError}</p>
            )}
            {results.length === 0 ? (
                <p className="text-muted">No results</p>
            ) : (
                <ul className="divide-y divide-line rounded-md border border-line bg-paper">
                    {results.map((book) => (
                        <li key={book.work_id ?? book.openlibrary_key}>
                            {book.work_id ? (
                                <Link
                                    to={`/books/${book.work_id}`}
                                    className="block hover:bg-cream">
                                    <ResultRow book={book} />
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        openFromOpenLibrary(
                                            book.openlibrary_key,
                                        )
                                    }
                                    disabled={openingKey !== null}
                                    className="block w-full text-left hover:bg-cream disabled:cursor-wait">
                                    <ResultRow
                                        book={book}
                                        loading={
                                            openingKey === book.openlibrary_key
                                        }
                                    />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ResultRow({ book, loading = false }) {
    const series = seriesLabel(book.series, book.series_number);
    return (
        <div className="flex items-center gap-4 p-3">
            <BookCover url={book.cover_url} title={book.title} />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">{book.title}</p>
                <p className="text-ink-soft">{book.author}</p>
                {series && <p className="text-sm text-muted">{series}</p>}
                <p className="text-sm text-muted">
                    {[book.first_publish_year, book.isbn && `ISBN ${book.isbn}`]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
            </div>
            {loading && <span className="text-sm text-muted">Opening...</span>}
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, apiGet } from "../api.js";
import { FORMAT_LABELS, languageName, seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";

// Podrobnosti knjige (wireframe 6)
export default function BookPage() {
    const { id } = useParams();
    // Podatki za doloceno knjigo; ce se id ne ujema, se nalagajo
    const [state, setState] = useState({ id: null, status: null, book: null });

    useEffect(() => {
        let ignore = false;
        apiGet(`/books/${id}`)
            .then((book) => !ignore && setState({ id, status: "done", book }))
            .catch((error) => {
                if (ignore) return;
                const notFound =
                    error instanceof ApiError &&
                    [404, 422].includes(error.status);
                setState({
                    id,
                    status: notFound ? "not-found" : "error",
                    book: null,
                });
            });
        return () => {
            ignore = true;
        };
    }, [id]);

    const status = state.id === id ? state.status : "loading";
    if (status === "loading") return <p className="text-muted">Loading...</p>;
    if (status === "not-found")
        return <h1 className="text-2xl font-bold">Book not found</h1>;
    if (status === "error") {
        return (
            <p className="text-red-700">
                Could not load the book. Please try again.
            </p>
        );
    }

    const { book } = state;
    const series = seriesLabel(book.series, book.series_number);

    return (
        <article className="space-y-10">
            <div className="flex flex-col gap-8 sm:flex-row">
                <BookCover
                    url={book.cover_url}
                    title={book.title}
                    className="h-72 w-48"
                />
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold">{book.title}</h1>
                        <p className="text-lg text-ink-soft">{book.author}</p>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                        {series && <Detail label="Series" value={series} />}
                        {book.first_publish_year && (
                            <Detail
                                label="First published"
                                value={book.first_publish_year}
                            />
                        )}
                        {book.genre && (
                            <Detail label="Genre" value={book.genre} />
                        )}
                    </dl>
                    {book.description && (
                        <p className="max-w-2xl whitespace-pre-line text-ink-soft">
                            {book.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Seznam izdaj je privzeto zaprt; odpre se s klikom */}
            <details className="group rounded-md border border-line bg-paper">
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold hover:bg-cream">
                    <span>Editions ({book.editions.length})</span>
                    <span className="text-sm font-normal text-muted">
                        <span className="group-open:hidden">Show</span>
                        <span className="hidden group-open:inline">Hide</span>
                    </span>
                </summary>
                {book.editions.length === 0 ? (
                    <p className="border-t border-line p-4 text-muted">
                        No editions yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-line border-t border-line">
                        {book.editions.map((edition) => (
                            <EditionRow
                                key={edition.id}
                                edition={edition}
                                workTitle={book.title}
                            />
                        ))}
                    </ul>
                )}
            </details>
        </article>
    );
}

function EditionRow({ edition, workTitle }) {
    const title = edition.title || workTitle;
    return (
        <li className="flex items-center gap-4 p-3">
            <BookCover
                url={edition.cover_url}
                title={title}
                className="h-16 w-11"
            />
            <div className="min-w-0 text-sm">
                <p className="font-medium">{title}</p>
                <p className="text-ink-soft">
                    {[edition.publisher, edition.publish_year]
                        .filter(Boolean)
                        .join(", ") || "Unknown publisher"}
                </p>
                <p className="text-muted">
                    {[
                        languageName(edition.language),
                        FORMAT_LABELS[edition.format],
                        edition.page_count && `${edition.page_count} pages`,
                        edition.isbn && `ISBN ${edition.isbn}`,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
            </div>
        </li>
    );
}

function Detail({ label, value }) {
    return (
        <>
            <dt className="text-muted">{label}</dt>
            <dd>{value}</dd>
        </>
    );
}

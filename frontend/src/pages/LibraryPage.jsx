import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, apiGet } from "../api.js";
import { FORMAT_LABELS, seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";

export default function LibraryPage() {
    const [state, setState] = useState({ status: "loading", items: [] });

    useEffect(() => {
        let ignore = false;
        apiGet("/library")
            .then((items) => !ignore && setState({ status: "done", items }))
            .catch(() => !ignore && setState({ status: "error", items: [] }));
        return () => {
            ignore = true;
        };
    }, []);

    const { status, items } = state;
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState("");

    async function remove(item) {
        if (!window.confirm("Remove this book from your library?")) return;
        setError("");
        setRemovingId(item.id);
        try {
            await apiFetch(`/library/${item.id}`, { method: "DELETE" });
            setState((s) => ({
                ...s,
                items: s.items.filter((i) => i.id !== item.id),
            }));
        } catch {
            setError("Could not remove the book. Please try again.");
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <section className="space-y-6">
            <div className="flex items-baseline justify-between gap-4">
                <h1 className="text-2xl font-bold">My library</h1>
                {status === "done" && items.length > 0 && (
                    <p className="text-muted">
                        {items.length} {items.length === 1 ? "book" : "books"}
                    </p>
                )}
            </div>

            {status === "loading" && <p className="text-muted">Loading...</p>}
            {status === "error" && (
                <p className="text-red-700">
                    Could not load your library. Please try again.
                </p>
            )}
            {error && <p className="text-red-700">{error}</p>}
            {status === "done" && items.length === 0 && (
                <p className="text-muted">
                    Your library is empty. Search for a book and click "I own
                    this" to add it.
                </p>
            )}
            {status === "done" && items.length > 0 && (
                <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                    {items.map((item) => (
                        <LibraryCard
                            key={item.id}
                            item={item}
                            onRemove={() => remove(item)}
                            removing={removingId === item.id}
                            disabled={removingId !== null}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function LibraryCard({ item, onRemove, removing, disabled }) {
    const { edition } = item;
    const { work } = edition;
    const title = edition.title || work.title;
    const series = seriesLabel(work.series, work.series_number);
    const format = FORMAT_LABELS[edition.format];

    return (
        <li className="flex flex-col">
            <Link to={`/books/${work.id}`} className="group block flex-1 space-y-2">
                <BookCover
                    url={edition.cover_url || work.cover_url}
                    title={title}
                    className="aspect-[2/3] h-auto w-full"
                />
                <div className="space-y-1">
                    <p className="font-semibold leading-snug group-hover:text-accent">
                        {title}
                    </p>
                    <p className="text-sm text-ink-soft">{work.author}</p>
                    {series && <p className="text-xs text-muted">{series}</p>}
                    <div className="flex flex-wrap gap-1 pt-1">
                        {format && <Tag>{format}</Tag>}
                        {item.location && <Tag muted>{item.location}</Tag>}
                    </div>
                </div>
            </Link>
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="mt-2 self-start text-xs text-muted hover:text-red-700 disabled:opacity-50">
                {removing ? "Removing..." : "Remove"}
            </button>
        </li>
    );
}

function Tag({ children, muted = false }) {
    return (
        <span
            className={`rounded px-2 py-0.5 text-xs ${
                muted ? "bg-line text-ink-soft" : "bg-accent-soft text-accent-dark"
            }`}
        >
            {children}
        </span>
    );
}

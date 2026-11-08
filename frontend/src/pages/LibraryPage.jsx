import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, apiGet } from "../api.js";
import { FORMAT_LABELS, seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";
import LendForm from "../components/LendForm.jsx";
import LibraryTabs from "../components/LibraryTabs.jsx";
import Modal from "../components/Modal.jsx";

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
    const [lending, setLending] = useState(null);

    function handleLent(loan) {
        setState((s) => ({
            ...s,
            items: s.items.map((i) =>
                i.id === lending.id ? { ...i, active_loan: loan } : i,
            ),
        }));
        setLending(null);
    }

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
            <LibraryTabs />

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
                            onLend={() => setLending(item)}
                            removing={removingId === item.id}
                            disabled={removingId !== null}
                        />
                    ))}
                </ul>
            )}
            <Modal
                open={lending !== null}
                onClose={() => setLending(null)}
                title="Lend book">
                {lending && <LendForm item={lending} onLent={handleLent} />}
            </Modal>
        </section>
    );
}

function LibraryCard({ item, onRemove, onLend, removing, disabled }) {
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
                        {item.active_loan && (
                            <Tag warn>Lent to: {item.active_loan.borrower_name}</Tag>
                        )}
                    </div>
                </div>
            </Link>
            <div className="mt-2 flex gap-3 text-xs">
                {!item.active_loan && (
                    <button
                        type="button"
                        onClick={onLend}
                        className="text-accent hover:text-accent-dark">
                        Lend
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    className="text-muted hover:text-red-700 disabled:opacity-50">
                    {removing ? "Removing..." : "Remove"}
                </button>
            </div>
        </li>
    );
}

const TAG_STYLES = {
    default: "bg-accent-soft text-accent-dark",
    muted: "bg-line text-ink-soft",
    warn: "bg-loan-soft text-loan",
};

function Tag({ children, muted = false, warn = false }) {
    const style = warn ? "warn" : muted ? "muted" : "default";
    return (
        <span className={`rounded px-2 py-0.5 text-xs ${TAG_STYLES[style]}`}>
            {children}
        </span>
    );
}

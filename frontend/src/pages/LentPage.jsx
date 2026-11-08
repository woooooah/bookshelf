import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiFetch, apiGet } from "../api.js";
import { formatDate, todayIso } from "../books.js";
import BookCover from "../components/BookCover.jsx";
import LibraryTabs from "../components/LibraryTabs.jsx";
import Modal from "../components/Modal.jsx";

export default function LentPage() {
    const [state, setState] = useState({
        status: "loading",
        active: [],
        history: [],
    });
    const [returning, setReturning] = useState(null);

    useEffect(() => {
        let ignore = false;
        Promise.all([apiGet("/loans?active=true"), apiGet("/loans?active=false")])
            .then(
                ([active, history]) =>
                    !ignore && setState({ status: "done", active, history }),
            )
            .catch(
                () =>
                    !ignore &&
                    setState({ status: "error", active: [], history: [] }),
            );
        return () => {
            ignore = true;
        };
    }, []);

    // Vrnjena posoja se premakne iz aktivnih v zgodovino
    function handleReturned(loan) {
        setState((s) => ({
            ...s,
            active: s.active.filter((l) => l.id !== loan.id),
            history: [{ ...returning, ...loan }, ...s.history],
        }));
        setReturning(null);
    }

    const { status, active, history } = state;

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-bold">My library</h1>
            <LibraryTabs />

            {status === "loading" && <p className="text-muted">Loading...</p>}
            {status === "error" && (
                <p className="text-red-700">
                    Could not load your loans. Please try again.
                </p>
            )}

            {status === "done" && (
                <>
                    {active.length === 0 ? (
                        <p className="text-muted">
                            None of your books are lent right now.
                        </p>
                    ) : (
                        <ul className="divide-y divide-line rounded-md border border-line bg-paper">
                            {active.map((loan) => (
                                <LoanRow key={loan.id} loan={loan}>
                                    <button
                                        type="button"
                                        onClick={() => setReturning(loan)}
                                        className="shrink-0 rounded-md border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft">
                                        Mark as returned
                                    </button>
                                </LoanRow>
                            ))}
                        </ul>
                    )}

                    {history.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold">History</h2>
                            <ul className="divide-y divide-line rounded-md border border-line bg-paper">
                                {history.map((loan) => (
                                    <LoanRow key={loan.id} loan={loan} />
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            <Modal
                open={returning !== null}
                onClose={() => setReturning(null)}
                title="Mark as returned">
                {returning && (
                    <ReturnForm loan={returning} onReturned={handleReturned} />
                )}
            </Modal>
        </section>
    );
}

function LoanRow({ loan, children }) {
    const { edition } = loan.library_book;
    const { work } = edition;
    const title = edition.title || work.title;
    const returned = loan.returned_at !== null;

    return (
        <li className="flex items-center gap-4 p-3">
            <BookCover
                url={edition.cover_url || work.cover_url}
                title={title}
                className={`h-24 w-16 ${returned ? "opacity-60" : ""}`}
            />
            <div className="min-w-0 flex-1">
                <Link
                    to={`/books/${work.id}`}
                    className="font-semibold hover:text-accent">
                    {title}
                </Link>
                <p className="text-sm text-ink-soft">{work.author}</p>
                <p className="mt-1 text-sm">
                    Lent to{" "}
                    <span className="font-medium">{loan.borrower_name}</span>
                    <span className="text-muted">
                        {" · "}
                        {returned
                            ? `${formatDate(loan.loaned_at)} – ${formatDate(loan.returned_at)}`
                            : `since ${formatDate(loan.loaned_at)}`}
                    </span>
                </p>
            </div>
            {children}
        </li>
    );
}

function ReturnForm({ loan, onReturned }) {
    const [returnedAt, setReturnedAt] = useState(todayIso());
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const title =
        loan.library_book.edition.title || loan.library_book.edition.work.title;

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            const updated = await apiFetch(`/loans/${loan.id}/return`, {
                method: "POST",
                body: { returned_at: returnedAt },
            });
            onReturned(updated);
        } catch (err) {
            if (err instanceof ApiError && err.status === 422) {
                setError(
                    "The date must be between the loan date and today.",
                );
            } else {
                setError("Could not save. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-ink-soft">
                {title}, lent to {loan.borrower_name} on{" "}
                {formatDate(loan.loaned_at)}
            </p>
            <label className="block">
                <span className="text-sm font-medium text-ink-soft">
                    Returned on
                </span>
                <input
                    type="date"
                    value={returnedAt}
                    onChange={(e) => setReturnedAt(e.target.value)}
                    required
                    min={loan.loaned_at}
                    max={todayIso()}
                    className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-accent-dark disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>
        </form>
    );
}

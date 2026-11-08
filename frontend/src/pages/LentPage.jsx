import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import { formatDate } from "../books.js";
import BookCover from "../components/BookCover.jsx";
import LibraryTabs from "../components/LibraryTabs.jsx";

export default function LentPage() {
    const [state, setState] = useState({ status: "loading", loans: [] });

    useEffect(() => {
        let ignore = false;
        apiGet("/loans?active=true")
            .then((loans) => !ignore && setState({ status: "done", loans }))
            .catch(() => !ignore && setState({ status: "error", loans: [] }));
        return () => {
            ignore = true;
        };
    }, []);

    const { status, loans } = state;

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
            {status === "done" && loans.length === 0 && (
                <p className="text-muted">You haven't lent any books.</p>
            )}
            {status === "done" && loans.length > 0 && (
                <ul className="divide-y divide-line rounded-md border border-line bg-paper">
                    {loans.map((loan) => (
                        <LoanRow key={loan.id} loan={loan} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function LoanRow({ loan }) {
    const { edition } = loan.library_book;
    const { work } = edition;
    const title = edition.title || work.title;

    return (
        <li className="flex items-center gap-4 p-3">
            <BookCover
                url={edition.cover_url || work.cover_url}
                title={title}
            />
            <div className="min-w-0 flex-1">
                <Link
                    to={`/books/${work.id}`}
                    className="font-semibold hover:text-accent">
                    {title}
                </Link>
                <p className="text-sm text-ink-soft">{work.author}</p>
                <p className="mt-1 text-sm">
                    Lent to <span className="font-medium">{loan.borrower_name}</span>
                    <span className="text-muted">
                        {" "}
                        · since {formatDate(loan.loaned_at)}
                    </span>
                </p>
            </div>
        </li>
    );
}

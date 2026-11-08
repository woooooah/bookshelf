import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import { seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";

const TABS = [
    { value: "want_to_read", label: "Want to read", empty: "No books you want to read yet." },
    { value: "read", label: "Read", empty: "No books marked as read yet." },
];

export default function ReadingPage() {
    const [state, setState] = useState({ status: "loading", entries: [] });
    const [tab, setTab] = useState("want_to_read");

    useEffect(() => {
        let ignore = false;
        apiGet("/reading")
            .then((entries) => !ignore && setState({ status: "done", entries }))
            .catch(() => !ignore && setState({ status: "error", entries: [] }));
        return () => {
            ignore = true;
        };
    }, []);

    const { status, entries } = state;
    const reading = entries.filter((e) => e.status === "reading");
    const tabEntries = entries.filter((e) => e.status === tab);
    const activeTab = TABS.find((t) => t.value === tab);

    if (status === "loading") return <p className="text-muted">Loading...</p>;
    if (status === "error") {
        return (
            <p className="text-red-700">
                Could not load your reading. Please try again.
            </p>
        );
    }

    return (
        <section className="space-y-10">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">My reading</h1>
                <h2 className="text-lg font-semibold">Currently reading</h2>
                {reading.length === 0 ? (
                    <p className="text-muted">
                        You're not reading anything right now.
                    </p>
                ) : (
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {reading.map((entry) => (
                            <li
                                key={entry.id}
                                className="rounded-md border border-line bg-paper">
                                <BookRow work={entry.work} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="space-y-4">
                <nav className="flex gap-6 border-b border-line">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setTab(t.value)}
                            className={`pb-2 font-medium ${
                                tab === t.value
                                    ? "border-b-2 border-accent text-accent"
                                    : "text-muted hover:text-ink"
                            }`}>
                            {t.label} ({entries.filter((e) => e.status === t.value).length})
                        </button>
                    ))}
                </nav>
                {tabEntries.length === 0 ? (
                    <p className="text-muted">{activeTab.empty}</p>
                ) : (
                    <ul className="divide-y divide-line rounded-md border border-line bg-paper">
                        {tabEntries.map((entry) => (
                            <li key={entry.id}>
                                <BookRow work={entry.work} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function BookRow({ work }) {
    const series = seriesLabel(work.series, work.series_number);
    return (
        <Link
            to={`/books/${work.id}`}
            className="flex items-center gap-4 p-3 hover:bg-cream">
            <BookCover url={work.cover_url} title={work.title} />
            <div className="min-w-0">
                <p className="font-semibold">{work.title}</p>
                <p className="text-sm text-ink-soft">{work.author}</p>
                {series && <p className="text-xs text-muted">{series}</p>}
            </div>
        </Link>
    );
}

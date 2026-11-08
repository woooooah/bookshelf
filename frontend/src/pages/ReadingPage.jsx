import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api.js";
import { formatDate, seriesLabel } from "../books.js";
import BookCover from "../components/BookCover.jsx";
import ReadingGoal from "../components/ReadingGoal.jsx";

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
    const tabEntries = entries
        .filter((e) => e.status === tab)
        .sort((a, b) => (lastFinished(b) ?? "").localeCompare(lastFinished(a) ?? ""));
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
            <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h1 className="text-2xl font-bold">My reading</h1>
                    <Link to="/import" className="text-sm text-accent underline">
                        Import from Goodreads
                    </Link>
                </div>
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
                                <BookRow
                                    work={entry.work}
                                    note={startedNote(entry)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ReadingGoal />
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
                                <BookRow
                                    work={entry.work}
                                    note={tab === "read" ? finishedNote(entry) : null}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

// Datum zadnjega zakljucenega branja (za razvrscanje prebranih)
function lastFinished(entry) {
    return entry.sessions
        .map((s) => s.finished_at)
        .filter(Boolean)
        .sort()
        .at(-1);
}

function startedNote(entry) {
    const open = entry.sessions.find((s) => s.finished_at === null);
    return open?.started_at ? `Started ${formatDate(open.started_at)}` : null;
}

function finishedNote(entry) {
    const day = lastFinished(entry);
    return day ? `Finished ${formatDate(day)}` : null;
}

function BookRow({ work, note }) {
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
                {note && <p className="mt-1 text-sm text-muted">{note}</p>}
            </div>
        </Link>
    );
}

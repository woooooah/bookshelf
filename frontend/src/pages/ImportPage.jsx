import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, apiFetch } from "../api.js";

const BATCH_SIZE = 10;

const STATUS_LABELS = {
    read: "read",
    reading: "currently reading",
    want_to_read: "want to read",
};

export default function ImportPage() {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);
    const [importing, setImporting] = useState(false);

    async function handleFile(event) {
        const file = event.target.files[0];
        event.target.value = "";
        if (!file) return;
        setError("");
        setPreview(null);
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const data = await apiFetch("/imports/goodreads/preview", {
                method: "POST",
                body: form,
            });
            setPreview({ ...data, fileName: file.name });
        } catch (err) {
            if (err instanceof ApiError && err.detail === "not_goodreads_export") {
                setError("File is not a Goodreads export.");
            } else if (err instanceof ApiError && err.status === 413) {
                setError("The file is too large (max 5 MB).");
            } else {
                setError("Could not read the file. Please try again.");
            }
        } finally {
            setUploading(false);
        }
    }

    return (
        <section className="max-w-2xl space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">Import from Goodreads</h1>
                <p className="text-ink-soft">
                    On Goodreads, go to <strong>My Books → Import and export</strong>{" "}
                    and click <strong>Export library</strong>. Then upload the CSV
                    file here.
                </p>
                <p className="text-sm text-muted">
                    Reading statuses and finish dates are imported. Books are not
                    added to My library.
                </p>
            </div>

            <label className="inline-block cursor-pointer rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark">
                {uploading ? "Reading file..." : preview ? "Choose another file" : "Choose CSV file"}
                <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFile}
                    disabled={uploading || importing}
                    className="sr-only"
                />
            </label>

            {error && <p className="text-red-700">{error}</p>}
            {preview && <Preview preview={preview} />}
            {preview && preview.rows.length > 0 && (
                <Importer
                    key={`${preview.fileName}-${preview.rows.length}`}
                    rows={preview.rows}
                    onRunningChange={setImporting}
                />
            )}
        </section>
    );
}

function Preview({ preview }) {
    const { rows, skipped, fileName } = preview;
    const counts = Object.keys(STATUS_LABELS)
        .map((status) => [status, rows.filter((r) => r.status === status).length])
        .filter(([, n]) => n > 0);
    const withoutIsbn = rows.filter((r) => !r.isbn).length;

    return (
        <div className="space-y-4 rounded-md border border-line bg-paper p-4">
            <div>
                <p className="text-sm text-muted">{fileName}</p>
                <p className="text-lg font-semibold">
                    {rows.length} {rows.length === 1 ? "book" : "books"} ready to import
                </p>
                {counts.length > 0 && (
                    <p className="text-ink-soft">
                        {counts.map(([status, n]) => `${n} ${STATUS_LABELS[status]}`).join(" · ")}
                    </p>
                )}
            </div>

            {withoutIsbn > 0 && (
                <p className="text-sm text-ink-soft">
                    {withoutIsbn} {withoutIsbn === 1 ? "book has" : "books have"} no ISBN
                    and will be matched by title and author.
                </p>
            )}

            {skipped.length > 0 && (
                <details className="text-sm">
                    <summary className="cursor-pointer text-ink-soft">
                        {skipped.length} {skipped.length === 1 ? "book" : "books"} will be
                        skipped
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                        {skipped.map((s) => (
                            <li key={s.row}>
                                <span className="font-medium">{s.title || "(no title)"}</span>
                                {s.author && <span className="text-muted"> · {s.author}</span>}
                                <span className="block text-xs text-muted">{s.reason}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

// Uvoz poteka v manjsih delih, da je viden napredek in da zahteve niso predolge
function Importer({ rows, onRunningChange }) {
    const [state, setState] = useState({ status: "ready", done: 0, results: [] });
    const running = state.status === "running";
    const cancelled = useRef(false);

    useEffect(() => {
        onRunningChange(running);
        if (!running) return;
        // Opozorilo, ce uporabnik med uvozom zapre stran
        const warn = (event) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [running, onRunningChange]);

    // Ob odhodu s strani se uvoz ustavi
    useEffect(() => {
        cancelled.current = false;
        return () => {
            cancelled.current = true;
        };
    }, []);

    async function run(start, previous) {
        let results = previous;
        setState({ status: "running", done: start, results });
        for (let i = start; i < rows.length; i += BATCH_SIZE) {
            if (cancelled.current) return;
            try {
                const data = await apiFetch("/imports/goodreads/books", {
                    method: "POST",
                    body: { rows: rows.slice(i, i + BATCH_SIZE) },
                });
                results = [...results, ...data.results];
                setState({
                    status: "running",
                    done: Math.min(i + BATCH_SIZE, rows.length),
                    results,
                });
            } catch {
                setState({ status: "error", done: i, results });
                return;
            }
        }
        setState({ status: "finished", done: rows.length, results });
    }

    const percent = Math.round((state.done / rows.length) * 100);

    if (state.status === "ready") {
        return (
            <button
                type="button"
                onClick={() => run(0, [])}
                className="rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-accent-dark">
                Import {rows.length} {rows.length === 1 ? "book" : "books"}
            </button>
        );
    }

    return (
        <div className="space-y-3 rounded-md border border-line bg-paper p-4">
            <p className="font-medium">
                {state.status === "finished"
                    ? "Import finished"
                    : `Importing ${state.done}/${rows.length}...`}
            </p>
            <div
                role="progressbar"
                aria-valuenow={state.done}
                aria-valuemin={0}
                aria-valuemax={rows.length}
                aria-label="Import progress"
                className="h-2.5 overflow-hidden rounded-full bg-line">
                <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${percent}%` }}
                />
            </div>
            {running && (
                <p className="text-sm text-muted">
                    Keep this page open until the import is finished.
                </p>
            )}
            {state.status === "error" && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <p className="text-red-700">
                        The import stopped at {state.done}/{rows.length}.
                    </p>
                    <button
                        type="button"
                        onClick={() => run(state.done, state.results)}
                        className="rounded-md border border-accent px-3 py-1.5 font-medium text-accent hover:bg-accent-soft">
                        Continue
                    </button>
                </div>
            )}
            {state.status === "finished" && (
                <Link to="/reading" className="text-sm text-accent underline">
                    Go to My reading
                </Link>
            )}
        </div>
    );
}

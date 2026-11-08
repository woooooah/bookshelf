import { useState } from "react";
import { ApiError, apiFetch } from "../api.js";

const STATUS_LABELS = {
    read: "read",
    reading: "currently reading",
    want_to_read: "want to read",
};

export default function ImportPage() {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

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
                    disabled={uploading}
                    className="sr-only"
                />
            </label>

            {error && <p className="text-red-700">{error}</p>}
            {preview && <Preview preview={preview} />}
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

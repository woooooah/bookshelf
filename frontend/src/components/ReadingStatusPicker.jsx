import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError, apiFetch, apiGet } from "../api.js";
import { useAuth } from "../auth/AuthContext.js";
import { READING_STATUSES, formatDate, todayIso } from "../books.js";
import Modal from "./Modal.jsx";

export default function ReadingStatusPicker({ workId }) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // Status velja za dolocenega uporabnika in knjigo
    const key = profile ? `${profile.id}-${workId}` : null;
    const [entry, setEntry] = useState({ key: null, value: null });
    const [prompt, setPrompt] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!key) return;
        let ignore = false;
        apiGet(`/reading/${workId}`)
            .then((value) => !ignore && setEntry({ key, value }))
            .catch(() => !ignore && setEntry({ key, value: null }));
        return () => {
            ignore = true;
        };
    }, [key, workId]);

    const value = entry.key === key ? entry.value : null;
    const current = value?.status ?? null;
    const sessions = value?.sessions ?? [];
    const openSession = sessions.find((s) => s.finished_at === null);
    // Tekoce branje na vrhu, nato zakljucena od najnovejsega
    const readings = [
        ...(openSession ? [openSession] : []),
        ...sessions
            .filter((s) => s.finished_at !== null)
            .sort((a, b) => b.finished_at.localeCompare(a.finished_at)),
    ];

    async function save(status, day = null) {
        const updated = await apiFetch(`/reading/${workId}`, {
            method: "PUT",
            body: { status, day },
        });
        setEntry({ key, value: updated });
    }

    async function clear() {
        setError("");
        setSaving(true);
        try {
            await apiFetch(`/reading/${workId}`, { method: "DELETE" });
            setEntry({ key, value: null });
        } catch {
            setError("Could not save the reading status. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function choose(status) {
        if (!profile) {
            navigate("/login", { state: { from: location } });
            return;
        }
        if (status === current) return;

        if (status === "reading") {
            setPrompt({
                title: "Started reading",
                fields: [{ name: "day", label: "Started on", value: todayIso(), required: true }],
                submit: ({ day }) => save("reading", day),
            });
            return;
        }
        if (status === "read") {
            setPrompt({
                title: "Finished reading",
                fields: [
                    {
                        name: "day",
                        label: "Finished on",
                        value: todayIso(),
                        required: Boolean(openSession),
                        min: openSession?.started_at,
                        hint: openSession
                            ? null
                            : "Optional. Books without a finish date don't count toward your yearly goal.",
                    },
                ],
                submit: ({ day }) => save("read", day || null),
            });
            return;
        }
        if (
            openSession &&
            !window.confirm("Stop reading this book? The current reading will be discarded.")
        ) {
            return;
        }
        setError("");
        setSaving(true);
        try {
            await save(status);
        } catch {
            setError("Could not save the reading status. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function updateSession(session, fields) {
        const updated = await apiFetch(`/reading/sessions/${session.id}`, {
            method: "PATCH",
            body: fields,
        });
        setEntry({
            key,
            value: {
                ...value,
                sessions: sessions.map((s) => (s.id === updated.id ? updated : s)),
            },
        });
    }

    function editSession(session) {
        const fields = [
            {
                name: "started_at",
                label: "Started on",
                value: session.started_at ?? "",
                required: session.finished_at === null,
            },
        ];
        if (session.finished_at !== null) {
            fields.push({
                name: "finished_at",
                label: "Finished on",
                value: session.finished_at,
                required: true,
            });
        }
        setPrompt({
            title: "Edit dates",
            fields,
            submit: (values) =>
                updateSession(session, {
                    started_at: values.started_at || null,
                    ...(values.finished_at && { finished_at: values.finished_at }),
                }),
        });
    }

    async function removeSession(session) {
        if (!window.confirm("Remove this reading?")) return;
        setError("");
        try {
            await apiFetch(`/reading/sessions/${session.id}`, { method: "DELETE" });
            setEntry({
                key,
                value: { ...value, sessions: sessions.filter((s) => s.id !== session.id) },
            });
        } catch {
            setError("Could not remove the reading. Please try again.");
        }
    }

    function addFinishDate() {
        setPrompt({
            title: "Add finish date",
            fields: [{ name: "day", label: "Finished on", value: todayIso(), required: true }],
            submit: ({ day }) => save("read", day),
        });
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
                <fieldset className="inline-flex min-w-0 overflow-hidden rounded-md border border-line-strong">
                    <legend className="sr-only">Reading status</legend>
                    {READING_STATUSES.map(({ value: status, label }) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => choose(status)}
                            disabled={saving}
                            aria-pressed={current === status}
                            className={`border-l border-line-strong px-3 py-2 text-sm font-medium first:border-l-0 disabled:opacity-50 ${
                                current === status
                                    ? "bg-accent text-white"
                                    : "bg-paper text-ink-soft hover:bg-cream"
                            }`}>
                            {label}
                        </button>
                    ))}
                </fieldset>
                {current && (
                    <button
                        type="button"
                        onClick={clear}
                        disabled={saving}
                        className="text-sm text-muted underline hover:text-ink disabled:opacity-50">
                        Clear
                    </button>
                )}
            </div>

            {readings.length > 0 && (
                <div className="max-w-md text-sm">
                    <p className="font-medium text-ink-soft">
                        Your readings ({readings.length})
                    </p>
                    <ul className="divide-y divide-line">
                        {readings.map((session) => (
                            <ReadingRow
                                key={session.id}
                                session={session}
                                onEdit={() => editSession(session)}
                                onRemove={
                                    session.finished_at !== null
                                        ? () => removeSession(session)
                                        : null
                                }
                            />
                        ))}
                    </ul>
                </div>
            )}
            {current === "read" && readings.length === 0 && (
                <p className="text-sm text-muted">
                    No finish date ·{" "}
                    <button
                        type="button"
                        onClick={addFinishDate}
                        className="text-accent underline">
                        Add date
                    </button>
                </p>
            )}

            {error && <p className="text-sm text-red-700">{error}</p>}

            <Modal
                open={prompt !== null}
                onClose={() => setPrompt(null)}
                title={prompt?.title ?? ""}>
                {prompt && (
                    <DatesForm
                        fields={prompt.fields}
                        onSubmit={async (values) => {
                            await prompt.submit(values);
                            setPrompt(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}

function ReadingRow({ session, onEdit, onRemove }) {
    const start = session.started_at ? formatDate(session.started_at) : "?";
    const end = session.finished_at ? formatDate(session.finished_at) : "now";

    return (
        <li className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-ink-soft">
                {start} – {end}
            </span>
            <span className="flex shrink-0 gap-3">
                <button type="button" onClick={onEdit} className="text-accent underline">
                    Edit
                </button>
                {onRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-muted underline hover:text-red-700">
                        Remove
                    </button>
                )}
            </span>
        </li>
    );
}

function DatesForm({ fields, onSubmit }) {
    const [values, setValues] = useState(
        Object.fromEntries(fields.map((f) => [f.name, f.value])),
    );
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            await onSubmit(values);
        } catch (err) {
            setError(
                err instanceof ApiError && err.status === 422
                    ? "Dates cannot be in the future, and the finish date cannot be before the start date."
                    : "Could not save. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
                <label key={field.name} className="block">
                    <span className="text-sm font-medium text-ink-soft">
                        {field.label}
                        {!field.required && " (optional)"}
                    </span>
                    <input
                        type="date"
                        value={values[field.name]}
                        onChange={(e) =>
                            setValues((v) => ({ ...v, [field.name]: e.target.value }))
                        }
                        required={field.required}
                        min={field.min ?? undefined}
                        max={todayIso()}
                        className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                    />
                    {field.hint && (
                        <span className="mt-1 block text-xs text-muted">{field.hint}</span>
                    )}
                </label>
            ))}
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

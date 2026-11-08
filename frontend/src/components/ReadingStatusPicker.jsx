import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, apiGet } from "../api.js";
import { useAuth } from "../auth/AuthContext.js";
import { READING_STATUSES } from "../books.js";

export default function ReadingStatusPicker({ workId }) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // Status velja za dolocenega uporabnika in knjigo
    const key = profile ? `${profile.id}-${workId}` : null;
    const [entry, setEntry] = useState({ key: null, value: null });
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

    const current = entry.key === key ? entry.value?.status : null;

    async function change(status) {
        if (!profile) {
            navigate("/login", { state: { from: location } });
            return;
        }
        setError("");
        setSaving(true);
        try {
            if (status === null) {
                await apiFetch(`/reading/${workId}`, { method: "DELETE" });
                setEntry({ key, value: null });
            } else {
                const value = await apiFetch(`/reading/${workId}`, {
                    method: "PUT",
                    body: { status },
                });
                setEntry({ key, value });
            }
        } catch {
            setError("Could not save the reading status. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
                <div
                    role="group"
                    aria-label="Reading status"
                    className="inline-flex overflow-hidden rounded-md border border-line-strong">
                    {READING_STATUSES.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => change(value)}
                            disabled={saving}
                            aria-pressed={current === value}
                            className={`border-l border-line-strong px-3 py-2 text-sm font-medium first:border-l-0 disabled:opacity-50 ${
                                current === value
                                    ? "bg-accent text-white"
                                    : "bg-paper text-ink-soft hover:bg-cream"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>
                {current && (
                    <button
                        type="button"
                        onClick={() => change(null)}
                        disabled={saving}
                        className="text-sm text-muted underline hover:text-ink disabled:opacity-50">
                        Clear
                    </button>
                )}
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
    );
}

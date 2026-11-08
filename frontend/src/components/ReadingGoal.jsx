import { useEffect, useState } from "react";
import { apiFetch, apiGet } from "../api.js";

export default function ReadingGoal() {
    const [year] = useState(() => new Date().getFullYear());
    const [goal, setGoal] = useState({ status: "loading", data: null });
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        let ignore = false;
        apiGet(`/goals/${year}`)
            .then((data) => !ignore && setGoal({ status: "done", data }))
            .catch(() => !ignore && setGoal({ status: "error", data: null }));
        return () => {
            ignore = true;
        };
    }, [year]);

    async function save(target) {
        const data = await apiFetch(`/goals/${year}`, {
            method: "PUT",
            body: { target_books: target },
        });
        setGoal({ status: "done", data });
        setEditing(false);
    }

    const target = goal.data?.target_books ?? null;
    const read = goal.data?.read_count ?? 0;

    return (
        <aside className="h-fit space-y-3 rounded-md border border-line bg-paper p-4">
            <h2 className="text-lg font-semibold">Reading goal</h2>

            {goal.status === "loading" && <p className="text-sm text-muted">Loading...</p>}
            {goal.status === "error" && (
                <p className="text-sm text-red-700">Could not load your goal.</p>
            )}

            {goal.status === "done" && target !== null && !editing && (
                <GoalProgress
                    read={read}
                    target={target}
                    year={year}
                    onChange={() => setEditing(true)}
                />
            )}

            {goal.status === "done" && (editing || target === null) && (
                <>
                    {target === null && (
                        <p className="text-sm text-ink-soft">
                            Read {read} in {year}
                        </p>
                    )}
                    <GoalForm
                        initial={target}
                        onSave={save}
                        onCancel={target !== null ? () => setEditing(false) : null}
                    />
                </>
            )}
        </aside>
    );
}

function GoalProgress({ read, target, year, onChange }) {
    const percent = Math.min(100, Math.round((read / target) * 100));
    const reached = read >= target;

    return (
        <div className="space-y-2">
            <p className="text-lg">
                Read <span className="font-semibold">{read}/{target}</span> in {year}
            </p>
            <div
                role="progressbar"
                aria-valuenow={read}
                aria-valuemin={0}
                aria-valuemax={target}
                aria-label={`${read} of ${target} books read`}
                className="h-2.5 overflow-hidden rounded-full bg-line">
                <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${percent}%` }}
                />
            </div>
            {reached && (
                <p className="font-medium text-accent-dark">Goal reached</p>
            )}
            <button
                type="button"
                onClick={onChange}
                className="text-sm text-accent underline">
                Change goal
            </button>
        </div>
    );
}

function GoalForm({ initial, onSave, onCancel }) {
    const [value, setValue] = useState(initial ? String(initial) : "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        const target = Number(value);
        if (!Number.isInteger(target) || target < 1) {
            setError("Enter a whole number greater than 0.");
            return;
        }
        setError("");
        setSaving(true);
        try {
            await onSave(target);
        } catch {
            setError("Could not save the goal. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
                <span className="text-sm text-ink-soft">
                    How many books do you want to read this year?
                </span>
                <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50">
                    {saving ? "Saving..." : "Save goal"}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-muted hover:text-ink">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

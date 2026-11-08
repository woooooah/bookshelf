import { useState } from "react";
import { ApiError, apiFetch } from "../api.js";
import { todayIso } from "../books.js";

export default function LendForm({ item, onLent }) {
    const [borrower, setBorrower] = useState("");
    const [loanedAt, setLoanedAt] = useState(todayIso());
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const title = item.edition.title || item.edition.work.title;

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSaving(true);
        try {
            const loan = await apiFetch(`/library/${item.id}/loans`, {
                method: "POST",
                body: { borrower_name: borrower.trim(), loaned_at: loanedAt },
            });
            onLent(loan);
        } catch (err) {
            if (err instanceof ApiError && err.detail === "already_loaned") {
                setError("This book is already lent. Mark it as returned first.");
            } else if (err instanceof ApiError && err.status === 422) {
                setError("Check the name and the date (it cannot be in the future).");
            } else {
                setError("Could not save the loan. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-ink-soft">{title}</p>
            <label className="block">
                <span className="text-sm font-medium text-ink-soft">
                    Lent to
                </span>
                <input
                    value={borrower}
                    onChange={(e) => setBorrower(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Name"
                    className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                />
            </label>
            <label className="block">
                <span className="text-sm font-medium text-ink-soft">Date</span>
                <input
                    type="date"
                    value={loanedAt}
                    onChange={(e) => setLoanedAt(e.target.value)}
                    required
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

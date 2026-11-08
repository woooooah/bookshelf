import { useEffect, useState } from "react";
import { ApiError, apiFetch, apiGet } from "../api.js";
import { FORMAT_LABELS, languageName } from "../books.js";
import BookCover from "./BookCover.jsx";

// Obrazec "Add to library"
export default function AddToLibraryForm({ book, onAdded }) {
    const [editionId, setEditionId] = useState(book.editions[0]?.id ?? null);
    const [location, setLocation] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [thicknessCm, setThicknessCm] = useState("");
    const [notes, setNotes] = useState("");
    const [locations, setLocations] = useState([]);
    const [duplicate, setDuplicate] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Ze uporabljene lokacije kot predlogi
    useEffect(() => {
        apiGet("/library/locations")
            .then(setLocations)
            .catch(() => setLocations([]));
    }, []);

    const edition = book.editions.find((e) => e.id === editionId);
    const physical =
        edition && !["ebook", "audiobook"].includes(edition.format);

    function chooseEdition(id) {
        setEditionId(id);
        setDuplicate(false);
    }

    async function save(confirmDuplicate) {
        setError("");
        setSaving(true);
        try {
            await apiFetch("/library", {
                method: "POST",
                body: {
                    edition_id: editionId,
                    location,
                    notes,
                    height_mm: physical ? cmToMm(heightCm) : null,
                    thickness_mm: physical ? cmToMm(thicknessCm) : null,
                    confirm_duplicate: confirmDuplicate,
                },
            });
            onAdded();
        } catch (err) {
            if (err instanceof ApiError && err.detail === "already_owned") {
                setDuplicate(true);
            } else {
                setError("Could not add the book. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        save(false);
    }

    if (book.editions.length === 0) {
        return (
            <p className="text-muted">
                This book has no editions to choose from.
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink-soft">
                    Which edition do you own?
                </legend>
                <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-md border border-line">
                    {book.editions.map((e) => (
                        <li key={e.id}>
                            <label
                                className={`flex cursor-pointer items-center gap-3 p-2 hover:bg-cream ${
                                    e.id === editionId ? "bg-accent-soft" : ""
                                }`}>
                                <input
                                    type="radio"
                                    name="edition"
                                    checked={e.id === editionId}
                                    onChange={() => chooseEdition(e.id)}
                                    className="accent-accent"
                                />
                                <BookCover
                                    url={e.cover_url}
                                    title={e.title || book.title}
                                    className="h-14 w-10"
                                />
                                <span className="min-w-0 text-sm">
                                    <span className="block font-medium">
                                        {e.title || book.title}
                                    </span>
                                    <span className="block text-muted">
                                        {[
                                            e.publisher,
                                            e.publish_year,
                                            FORMAT_LABELS[e.format],
                                            languageName(e.language),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                </span>
                            </label>
                        </li>
                    ))}
                </ul>
            </fieldset>

            <label className="block">
                <span className="text-sm font-medium text-ink-soft">
                    Location (optional)
                </span>
                <input
                    list="library-locations"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. living room, shelf 2"
                    className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                />
                <datalist id="library-locations">
                    {locations.map((l) => (
                        <option key={l} value={l} />
                    ))}
                </datalist>
            </label>

            {physical && (
                <div className="grid grid-cols-2 gap-3">
                    <NumberField
                        label="Height (cm, optional)"
                        value={heightCm}
                        onChange={setHeightCm}
                    />
                    <NumberField
                        label="Thickness (cm, optional)"
                        value={thicknessCm}
                        onChange={setThicknessCm}
                    />
                </div>
            )}

            <label className="block">
                <span className="text-sm font-medium text-ink-soft">
                    Notes (optional)
                </span>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
                />
            </label>

            {error && <p className="text-sm text-red-700">{error}</p>}

            {duplicate ? (
                <div className="space-y-3 rounded-md bg-accent-soft p-3 text-sm">
                    <p className="font-medium text-accent-dark">
                        You already own this edition.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => save(true)}
                            disabled={saving}
                            className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark disabled:opacity-50">
                            Add another copy
                        </button>
                        <button
                            type="button"
                            onClick={() => setDuplicate(false)}
                            className="rounded-md px-4 py-2 text-ink-soft hover:bg-cream">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !editionId}
                        className="rounded-md bg-accent px-5 py-2 font-medium text-white hover:bg-accent-dark disabled:opacity-50">
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </form>
    );
}

function NumberField({ label, value, onChange }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-ink-soft">{label}</span>
            <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-line-strong bg-paper px-3 py-2 focus:border-accent focus:outline-none"
            />
        </label>
    );
}

// V bazi so mere v milimetrih
function cmToMm(value) {
    const cm = parseFloat(value);
    return Number.isFinite(cm) && cm > 0 ? Math.round(cm * 10) : null;
}

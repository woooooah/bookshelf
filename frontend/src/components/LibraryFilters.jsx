import { FORMAT_LABELS } from "../books.js";
import { FILTER_KEYS, SORT_OPTIONS, uniqueValues } from "../libraryFilters.js";

export default function LibraryFilters({ items, params, onChange }) {
    const options = {
        format: uniqueValues(items, (i) => i.edition.format).map((value) => ({
            value,
            label: FORMAT_LABELS[value] ?? value,
        })),
        genre: uniqueValues(items, (i) => i.edition.work.genre),
        collection: uniqueValues(items, (i) => i.edition.publisher_collection?.name),
        series: uniqueValues(items, (i) => i.edition.work.series),
    };
    const hasChanges = [...FILTER_KEYS, "sort"].some((key) => params.get(key));

    function set(key, value) {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        onChange(next);
    }

    return (
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper p-3">
            <FilterSelect
                label="Format"
                value={params.get("format")}
                options={options.format}
                onChange={(v) => set("format", v)}
            />
            <FilterSelect
                label="Genre"
                value={params.get("genre")}
                options={options.genre}
                onChange={(v) => set("genre", v)}
            />
            <FilterSelect
                label="Publisher collection"
                value={params.get("collection")}
                options={options.collection}
                onChange={(v) => set("collection", v)}
            />
            <FilterSelect
                label="Series"
                value={params.get("series")}
                options={options.series}
                onChange={(v) => set("series", v)}
            />
            <FilterSelect
                label="Read"
                value={params.get("read")}
                options={[
                    { value: "read", label: "Read" },
                    { value: "unread", label: "Unread" },
                ]}
                onChange={(v) => set("read", v)}
            />
            <FilterSelect
                label="Sort by"
                value={params.get("sort")}
                options={SORT_OPTIONS.slice(1)}
                emptyLabel={SORT_OPTIONS[0].label}
                onChange={(v) => set("sort", v)}
            />
            {hasChanges && (
                <button
                    type="button"
                    onClick={() => onChange(new URLSearchParams())}
                    className="py-2 text-sm text-accent underline hover:text-accent-dark">
                    Clear filters
                </button>
            )}
        </div>
    );
}

function FilterSelect({ label, value, options, onChange, emptyLabel = "All" }) {
    const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
    // Izbrana vrednost ostane vidna, tudi ce nobena knjiga vec ne ustreza
    if (value && !normalized.some((o) => o.value === value)) {
        normalized.push({ value, label: value });
    }

    return (
        <label className="block min-w-0">
            <span className="text-xs font-medium text-muted">{label}</span>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                disabled={normalized.length === 0}
                className={`mt-1 block w-40 max-w-full rounded-md border bg-paper px-2 py-1.5 text-sm focus:border-accent focus:outline-none disabled:opacity-50 ${
                    value ? "border-accent text-accent-dark" : "border-line-strong"
                }`}>
                <option value="">{normalized.length === 0 ? "None" : emptyLabel}</option>
                {normalized.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

// Filtriranje in razvrscanje knjig v knjiznici

export const FILTER_KEYS = ["format", "genre", "collection", "series", "read"];

export const SORT_OPTIONS = [
    { value: "", label: "Recently added" },
    { value: "title", label: "Title A–Z" },
    { value: "-title", label: "Title Z–A" },
    { value: "author", label: "Author A–Z" },
    { value: "-author", label: "Author Z–A" },
];

function bookTitle(item) {
    return item.edition.title || item.edition.work.title;
}

// Avtorje razvrscamo po priimku, npr. "Rowling, J. K."
function authorSortKey(item) {
    const name = item.edition.work.author.trim();
    const words = name.split(/\s+/);
    return `${words.at(-1)} ${name}`;
}

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

const FILTER_TESTS = {
    format: (item, value) => item.edition.format === value,
    genre: (item, value) => item.edition.work.genre === value,
    collection: (item, value) => item.edition.publisher_collection?.name === value,
    series: (item, value) => item.edition.work.series === value,
    // Neprebrano so vse knjige brez statusa "prebrano"
    read: (item, value) => (item.reading_status === "read") === (value === "read"),
};

export function applyFilters(items, params) {
    const active = FILTER_KEYS.filter((key) => params.get(key));
    const filtered = items.filter((item) =>
        active.every((key) => FILTER_TESTS[key](item, params.get(key))),
    );

    const sort = params.get("sort") ?? "";
    if (!sort) return filtered;
    const field = sort.replace("-", "");
    const direction = sort.startsWith("-") ? -1 : 1;
    const key = field === "author" ? authorSortKey : bookTitle;
    // Pri enakem avtorju po vrsti v seriji, nato po naslovu
    return filtered.toSorted(
        (a, b) =>
            direction * collator.compare(key(a), key(b)) ||
            (field === "author" &&
                (a.edition.work.series_number ?? 0) - (b.edition.work.series_number ?? 0)) ||
            collator.compare(bookTitle(a), bookTitle(b)),
    );
}

export function uniqueValues(items, pick) {
    const values = new Set(items.map(pick).filter(Boolean));
    return [...values].sort(collator.compare);
}

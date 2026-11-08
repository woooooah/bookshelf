// Pomozne funkcije za prikaz knjig

export function seriesLabel(series, number) {
  if (!series) return null
  return number ? `${series} #${number}` : series
}

export const FORMAT_LABELS = {
  print: 'Print',
  ebook: 'E-book',
  audiobook: 'Audiobook',
}

// Open Library uporablja knjiznicne kode jezikov (MARC), npr. "ger" namesto "deu".
// Brskalnik pozna standardne kode, zato razlicne pretvorimo.
const MARC_TO_ISO = {
  alb: 'sqi', arm: 'hye', baq: 'eus', bur: 'mya', chi: 'zho', cze: 'ces', dut: 'nld',
  fre: 'fra', geo: 'kat', ger: 'deu', gre: 'ell', ice: 'isl', mac: 'mkd', mao: 'mri',
  may: 'msa', per: 'fas', rum: 'ron', scc: 'srp', scr: 'hrv', slo: 'slk', tib: 'bod',
  wel: 'cym',
}
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

export function languageName(code) {
  if (!code) return null
  try {
    return languageNames.of(MARC_TO_ISO[code] ?? code)
  } catch {
    return code // neznana koda
  }
}

// Datumi iz API-ja so oblike "2026-11-08"; brez pretvorbe v UTC
export function formatDate(isoDate) {
    if (!isoDate) return null;
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// Danasnji datum v lokalnem casu, oblike "2026-11-08"
export function todayIso() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

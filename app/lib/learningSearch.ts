/**
 * Keyword search over the Learn feed — runs on the cards already in memory,
 * so it costs no roundtrip and works offline.
 *
 * A card's haystack is everything a reader might type from memory: the
 * material's title and summary in both languages, its topic, its dimension
 * and sub labels, and the title + claim of every one of its ideas. The
 * catalog passed 100 ideas, and people remember an idea ("25 vezes o
 * gasto", "leucina") more often than the material it sits in.
 *
 * Matching is per word and AND-ed: "proteina cafe" only matches a card whose
 * haystack has both. Accents and case are stripped on both sides, so
 * "proteina" finds "proteína". A word of 5+ characters also matches a word
 * one typo away ("leucine" finds "leucina"), which is as far as the
 * proximity goes — two typos would start matching unrelated words.
 */

/** Lowercase, strip diacritics, collapse punctuation into spaces. */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** One searchable blob from many optional fields. */
export function buildHaystack(parts: (string | null | undefined)[]): string {
  return normalize(parts.filter(Boolean).join(' '));
}

/** True when `a` and `b` are at most one edit apart (insert, delete or swap). */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.length - short.length > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (short.length === long.length) {
      i += 1;
      j += 1;
    } else {
      j += 1;
    }
  }
  return edits + (long.length - j) + (short.length - i) <= 1;
}

/** Fuzzy only from 5 characters up — below that a single edit is noise. */
const FUZZY_MIN = 5;

function termMatches(haystackWords: string[], haystack: string, term: string): boolean {
  if (haystack.includes(term)) return true;
  if (term.length < FUZZY_MIN) return false;
  return haystackWords.some((word) => word.length >= FUZZY_MIN && withinOneEdit(word, term));
}

/**
 * Every word of the query must match the haystack (substring, or one typo
 * away). An empty query matches everything — the caller decides whether to
 * filter at all.
 */
export function matchesQuery(haystack: string, query: string): boolean {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const words = haystack.split(' ').filter(Boolean);
  return terms.every((term) => termMatches(words, haystack, term));
}

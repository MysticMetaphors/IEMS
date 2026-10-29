// Shared helpers for queries that return one page of rows at a time.

export type PageRequest = {
  /** What the user typed in the search box. Blank means no filter. */
  search?: string;
  limit: number;
  offset: number;
};

export type Page<T> = {
  rows: T[];
  /** How many rows match the search across ALL pages (not just this one). */
  total: number;
};

/** Put after a LIKE so `%`, `_` and `\` in the search are matched literally. */
export const LIKE_ESCAPE = `ESCAPE '\\'`;

/**
 * Turns the search text into a "contains" pattern for `LIKE ? ESCAPE '\'`.
 * Returns null when the search is blank so the caller can skip the filter.
 *
 * Note: SQLite's LIKE ignores case only for A-Z, so a search that depends on
 * case-folding other letters (for example "é" vs "É") will not match.
 */
export function containsPattern(search?: string): string | null {
  const term = search?.trim();
  if (!term) return null;

  return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Keeps LIMIT / OFFSET to sane whole numbers. */
export function pageBounds({ limit, offset }: PageRequest) {
  return {
    limit: Math.max(1, Math.floor(limit)),
    offset: Math.max(0, Math.floor(offset)),
  };
}

import type { Page } from '@/db/pagination';
import { useCallback, useEffect, useState } from 'react';

type FetchPage<T> = (request: {
  search: string;
  limit: number;
  offset: number;
}) => Promise<Page<T>>;

/**
 * Loads a list one page at a time from the database, so screens never hold
 * (or fetch) more rows than they show.
 *
 * `fetchPage` must be a stable reference, such as an imported function. An
 * inline arrow would change on every render and reload the list each time.
 *
 * - Changing the search goes back to page 1.
 * - A slow response for an old page or search is ignored if a newer one was
 *   requested, so quick typing or tapping never shows stale rows.
 * - If the current page no longer exists (for example its last row was
 *   deleted), it steps back to the last page that does.
 * - Rows from the previous load stay on screen while the next page loads.
 */
export function usePagedList<T>(fetchPage: FetchPage<T>, pageSize: number) {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<{ rows: T[]; total: number }>({
    rows: [],
    total: 0,
  });
  // True until the first load finishes (or again after retry()).
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const query = search.trim();

  useEffect(() => {
    let cancelled = false;

    fetchPage({ search: query, limit: pageSize, offset: (page - 1) * pageSize })
      .then(({ rows, total }) => {
        if (cancelled) return;

        const lastPage = Math.max(1, Math.ceil(total / pageSize));
        if (page > lastPage) {
          // This page is gone; the page change triggers a fresh load.
          setPage(lastPage);
          return;
        }

        setData({ rows, total });
        setError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error('Failed to load page:', err);
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, pageSize, page, query, reloadKey]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  /** Loads the current page again (after a save or delete). */
  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  /** Like reload, but shows the loading state again (for a "Try again" button). */
  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setReloadKey((key) => key + 1);
  }, []);

  /** Clears the search, goes to page 1 and reloads (so a new record is visible). */
  const reset = useCallback(() => {
    setSearchState('');
    setPage(1);
    setReloadKey((key) => key + 1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const startIndex = (page - 1) * pageSize;

  return {
    rows: data.rows,
    total: data.total,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex: startIndex + pageSize,
    search,
    setSearch,
    loading,
    error,
    reload,
    retry,
    reset,
  };
}

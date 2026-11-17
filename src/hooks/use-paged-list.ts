import type { Page } from '@/db/pagination';
import {
  keepPreviousData,
  useQuery,
  type QueryKey,
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';

type FetchPage<T> = (request: {
  search: string;
  limit: number;
  offset: number;
}) => Promise<Page<T>>;

// One shared empty array, so `rows` keeps the same reference until data arrives.
const EMPTY: never[] = [];

type Options<T> = {
  /**
   * Prefix shared by every page of this list, e.g. `queryKeys.classes.pages()`.
   * The search text, page number and page size are added to it, so each page
   * of each search is cached on its own. Invalidating the prefix (or anything
   * above it) refreshes the list.
   */
  queryKey: QueryKey;
  fetchPage: FetchPage<T>;
  pageSize: number;
};

/**
 * Loads a list one page at a time from the database, so screens never hold
 * (or fetch) more rows than they show.
 *
 * Pages are cached by TanStack Query: going back to a page or a search you
 * already visited shows its rows immediately, and they are refreshed in the
 * background when a write invalidates them.
 *
 * - Changing the search goes back to page 1.
 * - A slow response for an old page or search is ignored if a newer one was
 *   requested, so quick typing or tapping never shows stale rows.
 * - If the current page no longer exists (for example its last row was
 *   deleted), it steps back to the last page that does.
 * - Rows from the previous page stay on screen while the next page loads.
 */
export function usePagedList<T>({ queryKey, fetchPage, pageSize }: Options<T>) {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);

  const term = search.trim();

  const query = useQuery({
    queryKey: [...queryKey, { search: term, page, pageSize }],
    queryFn: () =>
      fetchPage({ search: term, limit: pageSize, offset: (page - 1) * pageSize }),
    placeholderData: keepPreviousData,
  });

  const rows = query.data?.rows ?? EMPTY;
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // This page is gone (e.g. its last row was deleted): step back to the last
  // page that exists. Only trust real data, not the previous page's placeholder.
  // (Adjusting state while rendering lets React redo the render right away,
  // without a frame showing the empty page.)
  if (query.data && !query.isPlaceholderData && page > totalPages) {
    setPage(totalPages);
  }

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  /** Shows the loading state again and loads the current page (for a "Try again" button). */
  const { refetch } = query;
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  /** Clears the search and goes to page 1 (so a new record is visible). */
  const reset = useCallback(() => {
    setSearchState('');
    setPage(1);
  }, []);

  const startIndex = (page - 1) * pageSize;

  return {
    rows,
    total,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex: startIndex + pageSize,
    search,
    setSearch,
    // True only until the first rows arrive (and again while retrying after an error).
    loading: query.isPending,
    error: query.isError,
    retry,
    reset,
  };
}

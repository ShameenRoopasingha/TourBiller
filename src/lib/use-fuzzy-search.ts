'use client';

import { useState, useMemo } from 'react';
import Fuse, { type IFuseOptions, type FuseOptionKey } from 'fuse.js';

export interface UseFuzzySearchOptions<T> extends IFuseOptions<T> {
  initialQuery?: string;
}

/**
 * Custom React hook for instant, typo-tolerant fuzzy searching powered by Fuse.js.
 * 
 * @param data Array of items to search through
 * @param keys Array of object property names / paths / weighted objects to index
 * @param options Additional Fuse.js options
 */
export function useFuzzySearch<T>(
  data: T[] = [],
  keys: FuseOptionKey<T>[],
  options?: UseFuzzySearchOptions<T>
) {
  const [query, setQuery] = useState(options?.initialQuery || '');

  const fuse = useMemo(() => {
    return new Fuse(data || [], {
      keys,
      threshold: options?.threshold ?? 0.35,
      ignoreLocation: options?.ignoreLocation ?? true,
      minMatchCharLength: options?.minMatchCharLength ?? 1,
      includeScore: true,
      ...options,
    });
  }, [data, keys, options]);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return data;
    }
    return fuse.search(trimmed).map((result) => result.item);
  }, [query, fuse, data]);

  return {
    query,
    setQuery,
    results,
    count: results.length,
    total: data.length,
    isFiltering: query.trim().length > 0,
    isEmpty: results.length === 0 && data.length > 0,
  };
}

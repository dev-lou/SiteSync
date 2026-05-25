import { writable, type Readable } from 'svelte/store';
import { getConvexClient } from './convex';
import { onQueryUpdate, type ConvexQuery } from '$utils/convex-types';

export type QueryArgs = Record<string, unknown>;

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const queryCache = new Map<string, { store: writable<QueryState<unknown>>; unsubscribe: (() => void) | null }>();

export function useConvexQuery<T = unknown>(
  queryName: string,
  args: QueryArgs = {},
): Readable<QueryState<T>> & { refresh: () => void } {
  const key = `${queryName}:${JSON.stringify(args)}`;

  const cached = queryCache.get(key);
  if (cached) {
    return cached.store as Readable<QueryState<T>> & { refresh: () => void };
  }

  const store = writable<QueryState<T>>({ data: null, loading: true, error: null });
  const client = getConvexClient();

  let unsubscribe: (() => void) | null = null;

  function subscribe() {
    unsubscribe = onQueryUpdate(queryName as ConvexQuery, args, (result) => {
      store.set({ data: result as T, loading: false, error: null });
    });
  }

  function refresh() {
    store.set({ data: null, loading: true, error: null });
    if (unsubscribe) unsubscribe();
    subscribe();
  }

  subscribe();

  const originalSubscribe = store.subscribe;
  const wrappedStore = {
    subscribe: (run: (value: QueryState<T>) => void, invalidate?: (value?: QueryState<T>) => void) => {
      const unsub = originalSubscribe(run, invalidate);
      return () => {
        unsub();
        if (unsubscribe) unsubscribe();
        queryCache.delete(key);
      };
    },
    refresh,
  };

  queryCache.set(key, { store: wrappedStore as writable<QueryState<unknown>>, unsubscribe });

  return wrappedStore as Readable<QueryState<T>> & { refresh: () => void };
}

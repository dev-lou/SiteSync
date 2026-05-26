import { onQueryUpdate, type ConvexQuery } from '$utils/convex-types';

export type QueryArgs = Record<string, unknown>;

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

class QuerySubscription<T> {
  key: string;
  private queryName: string;
  private args: QueryArgs;
  lastAccessed: number;

  state = $state<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  private unsubscribe: (() => void) | null = null;

  constructor(key: string, queryName: string, args: QueryArgs) {
    this.key = key;
    this.queryName = queryName;
    this.args = args;
    this.lastAccessed = Date.now();
  }

  subscribe() {
    if (this.unsubscribe) return; // already subscribed
    this.lastAccessed = Date.now();
    this.unsubscribe = onQueryUpdate(
      this.queryName as ConvexQuery,
      this.args,
      (result: unknown) => {
        this.state.data = result as T;
        this.state.loading = false;
        this.state.error = null;
      },
    );
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.state.data = null;
    this.state.loading = true;
    this.state.error = null;
  }

  refresh() {
    this.state.data = null;
    this.state.loading = true;
    this.state.error = null;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.subscribe();
  }
}

const queryCache = new Map<string, QuerySubscription<any>>();

// Periodically clean up subscriptions that haven't been accessed in 2 minutes.
// This prevents memory leaks since $derived callers can't run explicit cleanup.
const STALE_TIMEOUT_MS = 120_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, sub] of queryCache) {
    if (now - sub.lastAccessed > STALE_TIMEOUT_MS) {
      sub.cleanup();
      queryCache.delete(key);
    }
  }
}, 60_000);

export function useConvexQuery<T = any>(
  queryName: string,
  args: QueryArgs = {},
): QueryState<T> & { refresh: () => void } {
  const key = `${queryName}:${JSON.stringify(args)}`;

  let sub = queryCache.get(key);
  if (!sub) {
    sub = new QuerySubscription<T>(key, queryName, args);
    queryCache.set(key, sub);
    sub.subscribe();
  }

  return {
    get data() {
      return sub!.state.data;
    },
    get loading() {
      return sub!.state.loading;
    },
    get error() {
      return sub!.state.error;
    },
    refresh: () => sub!.refresh(),
  };
}

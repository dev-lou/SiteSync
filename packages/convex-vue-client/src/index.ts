import { ref, onUnmounted, type Ref } from 'vue';
import { ConvexClient } from 'convex/browser';
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';

let clientInstance: ConvexClient | null = null;

export function getConvexClient(url: string): ConvexClient {
  if (!clientInstance) {
    clientInstance = new ConvexClient(url);
  }
  return clientInstance;
}

// Typed overload (FunctionReference)
export function useConvexQuery<F extends FunctionReference<'query'>>(
  client: ConvexClient,
  query: F,
  ...args: FunctionArgs<F>
): {
  data: Ref<FunctionReturnType<F> | undefined>;
  isLoading: Ref<boolean>;
  error: Ref<Error | undefined>;
};

// String-based overload (for Vue widgets without generated types)
export function useConvexQuery(
  client: ConvexClient,
  queryName: string,
  args: Record<string, unknown>,
): {
  data: Ref<unknown | undefined>;
  isLoading: Ref<boolean>;
  error: Ref<Error | undefined>;
};

export function useConvexQuery(
  client: ConvexClient,
  queryName: any,
  ...args: any[]
): {
  data: Ref<any | undefined>;
  isLoading: Ref<boolean>;
  error: Ref<Error | undefined>;
} {
  const data = ref<any>();
  const isLoading = ref(true);
  const error = ref<Error>();

  const queryArgs =
    args[0] !== undefined && typeof args[0] === 'object' && args[0] !== null ? args[0] : {};
  const unsubscribe = client.onUpdate(queryName, queryArgs, (result: any) => {
    data.value = result;
    isLoading.value = false;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return { data, isLoading, error };
}

export function useMutation<F extends FunctionReference<'mutation'>>(
  client: ConvexClient,
  mutation: F,
) {
  const isPending = ref(false);
  const error = ref<Error>();

  async function mutate(...args: FunctionArgs<F>): Promise<FunctionReturnType<F>> {
    isPending.value = true;
    error.value = undefined;
    try {
      const mutationArgs = args[0] !== undefined ? args[0] : {};
      const result = await client.mutation(mutation, mutationArgs);
      return result as FunctionReturnType<F>;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    } finally {
      isPending.value = false;
    }
  }

  return { mutate, isPending, error };
}

export function useOptimisticMutation<F extends FunctionReference<'mutation'>>(
  client: ConvexClient,
  mutation: F,
) {
  const isPending = ref(false);
  const error = ref<Error>();

  async function mutate(
    args: FunctionArgs<F>,
    optimisticUpdate?: (localStore: any, mutationArgs: FunctionArgs<F>) => void,
  ): Promise<FunctionReturnType<F>> {
    isPending.value = true;
    error.value = undefined;

    try {
      const mutationArgs = args[0] !== undefined ? args[0] : {};
      if (optimisticUpdate) {
        return await client.mutation(mutation, mutationArgs);
      }
      return await client.mutation(mutation, mutationArgs);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    } finally {
      isPending.value = false;
    }
  }

  return { mutate, isPending, error };
}

// ── Re-export typed wrappers ──
export { typedMutation, typedQuery } from './convex-types';
export type { ConvexMutation, ConvexQuery, MutationArgs, QueryArgs } from './convex-types';

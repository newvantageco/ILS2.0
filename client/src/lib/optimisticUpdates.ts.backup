/**
 * Optimistic Update Utilities
 * 
 * Provides type-safe wrappers for implementing optimistic updates with TanStack Query.
 * Following the technical directive to make the UI feel instant by updating the client
 * state immediately, then syncing with the server in the background.
 * 
 * Pattern:
 * 1. onMutate: Snapshot current state, immediately update local cache
 * 2. Fire network request in background
 * 3. onSuccess: Invalidate query to fetch fresh data from server
 * 4. onError: Roll back to snapshot, show error toast
 */

import { queryClient } from "./queryClient";
import { feedback } from "./feedback";

type OptimisticUpdateOptions<TData, TVariables> = {
  queryKey: readonly unknown[];
  updater: (oldData: TData | undefined, variables: TVariables) => TData;
  successMessage?: string;
  errorMessage?: string;
};

/**
 * Create optimistic mutation handlers for a given query
 */
export function createOptimisticHandlers<TData = unknown, TVariables = unknown>({
  queryKey,
  updater,
  successMessage = "Updated successfully",
  errorMessage = "Update failed",
}: OptimisticUpdateOptions<TData, TVariables>) {
  return {
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(queryKey, (old) => updater(old, variables));

      // Return a context with the snapshot
      return { previousData };
    },

    onError: (_error: Error, _variables: TVariables, context: any) => {
      // Roll back to the previous value on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, context.previousData);
      }

      feedback.error({
        title: errorMessage,
        description: _error.message,
      });
    },

    onSuccess: () => {
      // Invalidate and refetch to get the authoritative data from the server
      queryClient.invalidateQueries({ queryKey });
      
      if (successMessage) {
        feedback.success({
          title: successMessage,
        });
      }
    },

    // Always refetch after error or success to ensure we have the correct data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Helper for optimistically updating array items (e.g., updating order status)
 */
export function optimisticArrayUpdate<TItem extends { id: string | number }>(
  array: TItem[] | undefined,
  itemId: string | number,
  updater: (item: TItem) => TItem
): TItem[] | undefined {
  if (!array) return array;
  return array.map((item) => (item.id === itemId ? updater(item) : item));
}

/**
 * Helper for optimistically toggling a boolean property
 */
export function optimisticToggle<TItem extends { id: string | number }>(
  array: TItem[] | undefined,
  itemId: string | number,
  property: keyof TItem
): TItem[] | undefined {
  return optimisticArrayUpdate(array, itemId, (item) => ({
    ...item,
    [property]: !item[property],
  }));
}

/**
 * Helper for optimistically removing an item from an array
 */
export function optimisticRemove<TItem extends { id: string | number }>(
  array: TItem[] | undefined,
  itemId: string | number
): TItem[] | undefined {
  if (!array) return array;
  return array.filter((item) => item.id !== itemId);
}

/**
 * Helper for optimistically adding an item to an array
 */
export function optimisticAdd<TItem>(
  array: TItem[] | undefined,
  item: TItem
): TItem[] | undefined {
  if (!array) return [item];
  return [item, ...array];
}

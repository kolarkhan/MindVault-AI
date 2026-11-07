import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as memoriesApi from "@/services/api/memories";
import type { ListMemoriesParams } from "@/services/api/memories";
import type { MemoryOut } from "@/types/api";

export const memoriesKey = (params: ListMemoriesParams = {}) => ["memories", params] as const;

export function useMemories(params: ListMemoriesParams = {}) {
  return useQuery({
    queryKey: memoriesKey(params),
    queryFn: () => memoriesApi.listMemories(params),
  });
}

export function useMemory(id: string | undefined) {
  return useQuery({
    queryKey: ["memory", id],
    queryFn: () => memoriesApi.getMemory(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MemoryOut> }) =>
      memoriesApi.updateMemory(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      queryClient.setQueryData(["memory", updated.id], updated);
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      memoriesApi.deleteMemory(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

import { apiClient } from "@/services/api/client";
import type { SearchResponse } from "@/types/api";

export async function searchMemories(query: string, topK = 6) {
  const { data } = await apiClient.post<SearchResponse>("/search", { query, top_k: topK });
  return data;
}

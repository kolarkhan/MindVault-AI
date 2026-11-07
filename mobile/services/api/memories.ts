import { apiClient } from "@/services/api/client";
import type {
  ExtractedAmount,
  ExtractedDate,
  ExtractedPerson,
  Importance,
  MemoryListResponse,
  MemoryOut,
  ProcessMemoryResponse,
  SourceType,
} from "@/types/api";

export interface ProcessMemoryPayload {
  source_type: SourceType;
  title?: string;
  content: string;
  location?: string;
  importance?: Importance;
  attachment_ids?: string[];
}

export async function processMemory(payload: ProcessMemoryPayload) {
  const { data } = await apiClient.post<ProcessMemoryResponse>("/memories/process", payload);
  return data;
}

export interface ConfirmMemoryPayload {
  title: string;
  category: string;
  tags: string[];
  people: ExtractedPerson[];
  amounts: ExtractedAmount[];
  dates: ExtractedDate[];
  importance: Importance;
}

export async function confirmMemory(draftId: string, payload: ConfirmMemoryPayload) {
  const { data } = await apiClient.post<MemoryOut>(`/memories/${draftId}/confirm`, payload);
  return data;
}

export interface ListMemoriesParams {
  category?: string;
  favorite?: boolean;
  archived?: boolean;
  deleted?: boolean;
  page?: number;
  page_size?: number;
}

export async function listMemories(params: ListMemoriesParams = {}) {
  const { data } = await apiClient.get<MemoryListResponse>("/memories", { params });
  return data;
}

export async function getMemory(id: string) {
  const { data } = await apiClient.get<MemoryOut>(`/memories/${id}`);
  return data;
}

export async function updateMemory(id: string, updates: Partial<MemoryOut>) {
  const { data } = await apiClient.patch<MemoryOut>(`/memories/${id}`, updates);
  return data;
}

export async function deleteMemory(id: string, permanent = false) {
  await apiClient.delete(`/memories/${id}`, { params: { permanent } });
}

import { apiClient } from "@/services/api/client";
import type { CategoryOut } from "@/types/api";

export async function listCategories() {
  const { data } = await apiClient.get<CategoryOut[]>("/categories");
  return data;
}

export async function createCategory(payload: { name: string; icon?: string; color?: string }) {
  const { data } = await apiClient.post<CategoryOut>("/categories", payload);
  return data;
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`/categories/${id}`);
}

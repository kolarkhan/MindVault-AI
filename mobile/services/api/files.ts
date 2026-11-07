import { apiClient } from "@/services/api/client";
import type { UploadedFile } from "@/types/api";

/** `uri` is a local file URI from expo-image-picker / expo-camera. */
export async function uploadFile(uri: string, filename: string, mimeType: string) {
  const formData = new FormData();
  // React Native's FormData accepts this shape even though it doesn't match the DOM File type.
  formData.append("file", { uri, name: filename, type: mimeType } as unknown as Blob);

  const { data } = await apiClient.post<UploadedFile>("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

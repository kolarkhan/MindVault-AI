import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/store/authStore";
import type { ApiErrorBody, TokenPair } from "@/types/api";

// Configure via mobile/.env — see .env.example. Falls back to the standard local-dev
// backend address (works from an iOS Simulator on the same machine only; a physical
// device or Android emulator needs your machine's LAN IP or 10.0.2.2 — see README.md).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const response = await axios.post<TokenPair>(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    await useAuthStore.getState().updateTokens(response.data);
    return response.data;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      refreshPromise ??= refreshTokens();
      const tokens = await refreshPromise;
      refreshPromise = null;

      if (tokens) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        return apiClient(originalRequest);
      }
      await useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail.length > 0) return data.detail[0].msg;
    if (error.message === "Network Error") {
      return "Can't reach the MindVault AI server. Check that the backend is running and EXPO_PUBLIC_API_URL is correct.";
    }
  }
  return fallback;
}

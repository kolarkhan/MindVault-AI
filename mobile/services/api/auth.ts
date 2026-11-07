import { apiClient } from "@/services/api/client";
import type { AuthResponse, TokenPair, UserOut } from "@/types/api";

export async function register(name: string, email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", { name, email, password });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
  return data;
}

export async function refresh(refreshToken: string) {
  const { data } = await apiClient.post<TokenPair>("/auth/refresh", { refresh_token: refreshToken });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get<UserOut>("/auth/me");
  return data;
}

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import type { AuthResponse, TokenPair, UserOut } from "@/types/api";

const ACCESS_TOKEN_KEY = "mindvault_access_token";
const REFRESH_TOKEN_KEY = "mindvault_refresh_token";
const USER_KEY = "mindvault_user";

interface AuthState {
  user: UserOut | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (auth: AuthResponse) => Promise<void>;
  updateTokens: (tokens: TokenPair) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken, userRaw] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    set({
      accessToken,
      refreshToken,
      user: userRaw ? (JSON.parse(userRaw) as UserOut) : null,
      isHydrated: true,
    });
  },

  setSession: async (auth: AuthResponse) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, auth.tokens.access_token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.tokens.refresh_token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(auth.user)),
    ]);
    set({
      user: auth.user,
      accessToken: auth.tokens.access_token,
      refreshToken: auth.tokens.refresh_token,
    });
  },

  updateTokens: async (tokens: TokenPair) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
    ]);
    set({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

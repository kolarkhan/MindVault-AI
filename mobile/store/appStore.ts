import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const ONBOARDED_KEY = "mindvault_onboarded";

interface AppState {
  isOnboarded: boolean;
  hydrate: () => Promise<void>;
  markOnboarded: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  hydrate: async () => {
    const value = await SecureStore.getItemAsync(ONBOARDED_KEY);
    set({ isOnboarded: value === "true" });
  },
  markOnboarded: async () => {
    await SecureStore.setItemAsync(ONBOARDED_KEY, "true");
    set({ isOnboarded: true });
  },
}));

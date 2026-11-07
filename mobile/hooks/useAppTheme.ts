import { useColorScheme } from "react-native";

import { themes, type ThemeColors } from "@/constants/theme";

/** Single source of truth for "which theme is active right now" — reads the OS setting.
 * A manual override (Settings screen) can later write to a small store and this hook
 * would prefer that over the system value; Phase 1 just follows the system. */
export function useAppTheme(): { colors: ThemeColors; scheme: "light" | "dark" } {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { colors: themes[scheme], scheme };
}

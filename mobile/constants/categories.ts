import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

/** Mirrors backend/app/utils/defaults.py — keep in sync if defaults change there. */
export const CATEGORY_ICON_MAP: Record<string, FeatherIconName> = {
  Personal: "user",
  Work: "briefcase",
  Study: "book",
  Finance: "dollar-sign",
  "Important Documents": "file-text",
  "Health Information": "heart",
  Travel: "map-pin",
  Ideas: "zap",
  Relationships: "users",
  Tasks: "check-square",
  Other: "folder",
};

export const SOURCE_TYPE_ICON_MAP: Record<string, FeatherIconName> = {
  text: "type",
  image: "image",
  camera: "camera",
  voice: "mic",
  pdf: "file-text",
  document: "file",
  audio: "headphones",
};

export function iconForCategory(name: string): FeatherIconName {
  return CATEGORY_ICON_MAP[name] ?? "folder";
}

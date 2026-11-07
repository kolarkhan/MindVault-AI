import { create } from "zustand";

import type { AIProcessingResult, Importance, SourceType } from "@/types/api";

/** Transient (non-persisted) state passed between Create Memory → AI Processing →
 * Memory Confirmation. Kept out of URL params because it can carry image previews and
 * full AI extraction payloads that are awkward to serialize into a route. */
interface DraftState {
  sourceType: SourceType;
  title: string;
  content: string;
  location: string;
  importance: Importance;
  attachmentIds: string[];
  localImageUri: string | null;
  draftId: string | null;
  aiResult: AIProcessingResult | null;
  originalContent: string | null;

  startDraft: (input: {
    sourceType: SourceType;
    content: string;
    location?: string;
    importance?: Importance;
    attachmentIds?: string[];
    localImageUri?: string | null;
  }) => void;
  setProcessed: (draftId: string, result: AIProcessingResult, originalContent: string) => void;
  reset: () => void;
}

const initialState = {
  sourceType: "text" as SourceType,
  title: "",
  content: "",
  location: "",
  importance: "normal" as Importance,
  attachmentIds: [] as string[],
  localImageUri: null as string | null,
  draftId: null as string | null,
  aiResult: null as AIProcessingResult | null,
  originalContent: null as string | null,
};

export const useDraftStore = create<DraftState>((set) => ({
  ...initialState,

  startDraft: (input) =>
    set({
      sourceType: input.sourceType,
      content: input.content,
      location: input.location ?? "",
      importance: input.importance ?? "normal",
      attachmentIds: input.attachmentIds ?? [],
      localImageUri: input.localImageUri ?? null,
      draftId: null,
      aiResult: null,
      originalContent: null,
    }),

  setProcessed: (draftId, result, originalContent) =>
    set({ draftId, aiResult: result, originalContent }),

  reset: () => set({ ...initialState }),
}));

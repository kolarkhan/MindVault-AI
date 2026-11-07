import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getApiErrorMessage } from "@/services/api/client";
import * as filesApi from "@/services/api/files";
import * as memoriesApi from "@/services/api/memories";
import { spacing, typography } from "@/constants/theme";
import { useDraftStore } from "@/store/draftStore";

type Step = "uploading" | "understanding" | "done" | "error";

const STEP_COPY: Record<Exclude<Step, "done" | "error">, string> = {
  uploading: "Uploading attachment…",
  understanding: "AI is reading and understanding your memory…",
};

/** The dedicated "AI Processing" screen from the spec: shows real progress tied to the
 * actual network calls (upload, then extraction) — never a fake timed animation
 * disconnected from what's actually happening. */
export default function ProcessingScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const draft = useDraftStore();
  const [step, setStep] = useState<Step>(draft.localImageUri ? "uploading" : "understanding");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, []);

  async function run() {
    try {
      let attachmentIds = draft.attachmentIds;

      if (draft.localImageUri) {
        setStep("uploading");
        const filename = draft.localImageUri.split("/").pop() ?? "photo.jpg";
        const ext = filename.split(".").pop()?.toLowerCase();
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        const uploaded = await filesApi.uploadFile(draft.localImageUri, filename, mimeType);
        attachmentIds = [uploaded.id];
      }

      setStep("understanding");
      const response = await memoriesApi.processMemory({
        source_type: draft.sourceType,
        content: draft.content,
        location: draft.location || undefined,
        importance: draft.importance,
        attachment_ids: attachmentIds,
      });

      draft.setProcessed(response.draft_id, response.result, response.original_content);
      setStep("done");
      router.replace("/memory/confirm");
    } catch (e) {
      setError(getApiErrorMessage(e, "AI processing failed. Please try again."));
      setStep("error");
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {step === "error" ? (
          <>
            <View style={[styles.iconWrap, { backgroundColor: colors.danger + "1A" }]}>
              <Feather name="alert-triangle" size={28} color={colors.danger} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
            {error ? <ErrorBanner message={error} /> : null}
            <Button label="Try again" onPress={() => { setError(null); run(); }} style={styles.retry} />
            <Button label="Cancel" variant="ghost" onPress={() => router.replace("/(tabs)")} />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {STEP_COPY[step as "uploading" | "understanding"]}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              This won&apos;t be saved until you review and confirm it.
            </Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { ...typography.subtitle, textAlign: "center", marginTop: spacing.lg, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, textAlign: "center" },
  retry: { marginTop: spacing.lg, marginBottom: spacing.sm },
});

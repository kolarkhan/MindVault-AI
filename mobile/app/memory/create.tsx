import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { SOURCE_TYPE_ICON_MAP } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";
import { useDraftStore } from "@/store/draftStore";
import type { Importance } from "@/types/api";

const IMPORTANCE_OPTIONS: { key: Importance; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
];

const SOURCE_LABEL: Record<string, string> = {
  text: "Text memory",
  image: "Photo memory",
  camera: "Camera capture",
};

export default function CreateMemoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const draft = useDraftStore();

  const [content, setContent] = useState(draft.content);
  const [location, setLocation] = useState(draft.location);
  const [importance, setImportance] = useState<Importance>(draft.importance);
  const [localImageUri, setLocalImageUri] = useState<string | null>(draft.localImageUri);
  const [error, setError] = useState<string | null>(null);

  const isImageFlow = draft.sourceType === "image" || draft.sourceType === "camera";

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setLocalImageUri(result.assets[0].uri);
  };

  const captureFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to capture a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setLocalImageUri(result.assets[0].uri);
  };

  const handleContinue = () => {
    setError(null);
    if (isImageFlow && !localImageUri) {
      setError(draft.sourceType === "camera" ? "Capture a photo to continue." : "Choose a photo to continue.");
      return;
    }
    if (!isImageFlow && !content.trim()) {
      setError("Write something before continuing.");
      return;
    }

    draft.startDraft({
      sourceType: draft.sourceType,
      content: content.trim(),
      location: location.trim() || undefined,
      importance,
      localImageUri,
    });
    router.replace("/memory/processing");
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {SOURCE_LABEL[draft.sourceType] ?? "New memory"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {isImageFlow ? (
          <View style={styles.imageSection}>
            {localImageUri ? (
              <Image source={{ uri: localImageUri }} style={styles.preview} contentFit="cover" />
            ) : (
              <Pressable
                onPress={draft.sourceType === "camera" ? captureFromCamera : pickFromLibrary}
                style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
              >
                <Feather name={SOURCE_TYPE_ICON_MAP[draft.sourceType]} size={28} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: spacing.xs }}>
                  {draft.sourceType === "camera" ? "Tap to open camera" : "Tap to choose a photo"}
                </Text>
              </Pressable>
            )}
            {localImageUri ? (
              <Pressable onPress={draft.sourceType === "camera" ? captureFromCamera : pickFromLibrary}>
                <Text style={[styles.retake, { color: colors.accent }]}>
                  {draft.sourceType === "camera" ? "Retake photo" : "Choose a different photo"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          label={isImageFlow ? "Caption (optional)" : "What do you want to remember?"}
          value={content}
          onChangeText={setContent}
          placeholder={
            isImageFlow ? "Add context for this photo…" : "e.g. I gave Ahmed 15,000 rupees on Friday."
          }
          multiline
          numberOfLines={isImageFlow ? 2 : 5}
          style={isImageFlow ? undefined : styles.textArea}
          textAlignVertical="top"
        />

        <TextField label="Location (optional)" value={location} onChangeText={setLocation} placeholder="e.g. Lahore" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Importance</Text>
        <View style={styles.importanceRow}>
          {IMPORTANCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setImportance(opt.key)}
              style={[
                styles.importancePill,
                { backgroundColor: importance === opt.key ? colors.accent : colors.surfaceMuted },
              ]}
            >
              <Text style={{ color: importance === opt.key ? colors.textInverted : colors.textPrimary, fontWeight: "600" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button label="Continue" onPress={handleContinue} style={styles.continueButton} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
  headerTitle: { ...typography.subtitle },
  imageSection: { alignItems: "center", marginBottom: spacing.md },
  preview: { width: "100%", height: 220, borderRadius: radius.lg },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  retake: { ...typography.bodySmall, fontWeight: "600", marginTop: spacing.sm },
  textArea: { minHeight: 120 },
  label: { ...typography.bodySmall, fontWeight: "600", marginBottom: spacing.sm },
  importanceRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  importancePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  continueButton: { marginBottom: spacing.xl },
});

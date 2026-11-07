import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { CategoryChip } from "@/components/memory/CategoryChip";
import { FinanceCard } from "@/components/memory/FinanceCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/hooks/useCategories";
import { getApiErrorMessage } from "@/services/api/client";
import * as memoriesApi from "@/services/api/memories";
import { radius, spacing, typography } from "@/constants/theme";
import { useDraftStore } from "@/store/draftStore";
import type { ExtractedPerson } from "@/types/api";

export default function ConfirmMemoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const draft = useDraftStore();
  const categoriesQuery = useCategories();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [people, setPeople] = useState<ExtractedPerson[]>([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.aiResult || !draft.draftId) {
      router.replace("/(tabs)");
      return;
    }
    setTitle(draft.aiResult.summary.slice(0, 60));
    setCategory(draft.aiResult.suggested_category);
    setTags(draft.aiResult.suggested_tags);
    setPeople(draft.aiResult.people);
  }, []);

  if (!draft.aiResult || !draft.draftId) return null;
  const result = draft.aiResult;

  const addTag = () => {
    const clean = newTag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setNewTag("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addPerson = () => {
    const clean = newPersonName.trim();
    if (clean && !people.some((p) => p.name === clean)) {
      setPeople([...people, { name: clean, context: null }]);
    }
    setNewPersonName("");
  };

  const removePerson = (name: string) => setPeople(people.filter((p) => p.name !== name));

  const handleConfirm = async () => {
    if (!title.trim()) {
      setError("Give this memory a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await memoriesApi.confirmMemory(draft.draftId as string, {
        title: title.trim(),
        category,
        tags,
        people,
        amounts: result.amounts,
        dates: result.dates,
        importance: draft.importance,
      });
      draft.reset();
      router.replace(`/memory/${saved.id}`);
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't save this memory. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert("Discard this memory?", "Nothing will be saved.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          draft.reset();
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={handleDiscard}>
          <Feather name="x" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Review & confirm</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.providerRow}>
          <Badge label={result.provider === "mock" ? "Mock AI mode" : "AI processed"} tone={result.provider === "mock" ? "warning" : "accent"} />
        </View>

        {result.uncertainty_notes.length > 0 ? (
          <Card style={[styles.noteCard, { backgroundColor: colors.warning + "1A", borderColor: "transparent" }]}>
            <Feather name="info" size={16} color={colors.warning} />
            <View style={{ flex: 1 }}>
              {result.uncertainty_notes.map((note, i) => (
                <Text key={i} style={[styles.noteText, { color: colors.textPrimary }]}>
                  {note}
                </Text>
              ))}
            </View>
          </Card>
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}

        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Give this memory a title" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Original content</Text>
        <Card style={styles.contentCard}>
          <Text style={{ color: colors.textPrimary }}>{draft.originalContent}</Text>
        </Card>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {(categoriesQuery.data ?? []).map((c) => (
            <CategoryChip key={c.id} name={c.name} selected={category === c.name} onPress={() => setCategory(c.name)} />
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Tags</Text>
        <View style={styles.chipWrap}>
          {tags.map((tag) => (
            <Pressable key={tag} onPress={() => removeTag(tag)} style={[styles.tagChip, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={{ color: colors.textPrimary }}>#{tag}</Text>
              <Feather name="x" size={12} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
        <View style={styles.addRow}>
          <TextField value={newTag} onChangeText={setNewTag} placeholder="Add a tag" onSubmitEditing={addTag} style={styles.addInput} />
          <Button label="Add" onPress={addTag} fullWidth={false} variant="secondary" />
        </View>

        {people.length > 0 || result.people.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>People mentioned</Text>
            <View style={styles.chipWrap}>
              {people.map((p) => (
                <Pressable key={p.name} onPress={() => removePerson(p.name)} style={[styles.tagChip, { backgroundColor: colors.surfaceMuted }]}>
                  <Feather name="user" size={12} color={colors.textSecondary} />
                  <Text style={{ color: colors.textPrimary }}>{p.name}</Text>
                  <Feather name="x" size={12} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextField
                value={newPersonName}
                onChangeText={setNewPersonName}
                placeholder="Add a person"
                onSubmitEditing={addPerson}
                style={styles.addInput}
              />
              <Button label="Add" onPress={addPerson} fullWidth={false} variant="secondary" />
            </View>
          </>
        ) : null}

        <FinanceCard amounts={result.amounts} />

        {result.dates.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Dates mentioned</Text>
            {result.dates.map((d, i) => (
              <View key={i} style={[styles.dateRow, { borderColor: colors.border }]}>
                <Feather name="calendar" size={14} color={d.is_uncertain ? colors.warning : colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, flex: 1 }}>
                  {d.label}
                  {d.date ? ` — ${d.date}` : ""}
                </Text>
                {d.is_uncertain ? <Badge label="Uncertain" tone="warning" /> : null}
              </View>
            ))}
          </>
        ) : null}

        <Button label="Save memory" onPress={handleConfirm} loading={saving} style={styles.saveButton} />
        <Button label="Discard" variant="ghost" onPress={handleDiscard} style={styles.discardButton} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md },
  headerTitle: { ...typography.subtitle },
  providerRow: { marginBottom: spacing.sm },
  noteCard: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  noteText: { ...typography.bodySmall },
  label: { ...typography.bodySmall, fontWeight: "600", marginTop: spacing.md, marginBottom: spacing.sm },
  contentCard: { marginBottom: spacing.sm },
  categoryScroll: { marginBottom: spacing.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap" },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  addRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  addInput: { flex: 1 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  saveButton: { marginTop: spacing.xl },
  discardButton: { marginTop: spacing.sm, marginBottom: spacing.xl },
});

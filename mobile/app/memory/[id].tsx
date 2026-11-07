import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { FinanceCard } from "@/components/memory/FinanceCard";
import { PersonChip } from "@/components/memory/PersonChip";
import { iconForCategory } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useDeleteMemory, useMemory, useUpdateMemory } from "@/hooks/useMemories";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";

export default function MemoryDetailScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const memoryQuery = useMemory(id);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  if (memoryQuery.isLoading) return <LoadingState label="Loading memory…" />;
  if (memoryQuery.isError || !memoryQuery.data) {
    return (
      <ScreenContainer>
        <ErrorBanner message={getApiErrorMessage(memoryQuery.error, "Couldn't load this memory.")} />
      </ScreenContainer>
    );
  }

  const memory = memoryQuery.data;

  const toggleFavorite = () => updateMemory.mutate({ id: memory.id, updates: { is_favorite: !memory.is_favorite } });

  const toggleArchive = () => updateMemory.mutate({ id: memory.id, updates: { is_archived: !memory.is_archived } });

  const saveTitle = () => {
    if (titleDraft.trim()) updateMemory.mutate({ id: memory.id, updates: { title: titleDraft.trim() } });
    setEditingTitle(false);
  };

  const handleDelete = () => {
    Alert.alert("Move to trash?", "You can restore this later from Trash.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMemory.mutate({ id: memory.id });
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleFavorite} style={styles.headerAction}>
            <Feather name="star" size={20} color={memory.is_favorite ? colors.warning : colors.textMuted} />
          </Pressable>
          <Pressable onPress={toggleArchive} style={styles.headerAction}>
            <Feather name="archive" size={20} color={memory.is_archived ? colors.accent : colors.textMuted} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.headerAction}>
            <Feather name="trash-2" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {editingTitle ? (
          <TextField
            value={titleDraft}
            onChangeText={setTitleDraft}
            autoFocus
            onSubmitEditing={saveTitle}
            onBlur={saveTitle}
          />
        ) : (
          <Pressable
            onPress={() => {
              setTitleDraft(memory.title);
              setEditingTitle(true);
            }}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>{memory.title}</Text>
          </Pressable>
        )}

        <View style={styles.metaRow}>
          <Badge label={memory.category} tone="accent" />
          {memory.importance === "high" ? <Badge label="High importance" tone="warning" /> : null}
          {memory.ai_provider === "mock" ? <Badge label="Mock AI mode" tone="neutral" /> : null}
        </View>

        <Text style={[styles.timestamp, { color: colors.textMuted }]}>
          Captured {format(new Date(memory.created_at), "MMM d, yyyy 'at' h:mm a")}
          {memory.location ? ` · ${memory.location}` : ""}
        </Text>

        {memory.summary ? (
          <Card style={[styles.summaryCard, { backgroundColor: colors.accentSoft, borderColor: "transparent" }]}>
            <View style={styles.summaryHeader}>
              <Feather name="cpu" size={14} color={colors.accent} />
              <Text style={[styles.summaryLabel, { color: colors.accent }]}>AI summary</Text>
            </View>
            <Text style={{ color: colors.textPrimary }}>{memory.summary}</Text>
          </Card>
        ) : null}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Original content</Text>
        <Card style={styles.contentCard}>
          <Text style={{ color: colors.textPrimary }}>{memory.content}</Text>
        </Card>

        <FinanceCard amounts={memory.amounts} />

        {memory.people.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>People</Text>
            <View style={styles.chipWrap}>
              {memory.people.map((p) => (
                <PersonChip key={p.name} name={p.name} />
              ))}
            </View>
          </>
        ) : null}

        {memory.tags.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Tags</Text>
            <View style={styles.chipWrap}>
              {memory.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} />
              ))}
            </View>
          </>
        ) : null}

        {memory.dates.length > 0 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Dates</Text>
            {memory.dates.map((d, i) => (
              <View key={i} style={[styles.dateRow, { borderColor: colors.border }]}>
                <Feather name={iconForCategory("Other")} size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textPrimary, flex: 1 }}>
                  {d.label}
                  {d.date ? ` — ${d.date}` : " — date uncertain"}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md },
  headerActions: { flexDirection: "row", gap: spacing.md },
  headerAction: { padding: 2 },
  title: { ...typography.displayMd, marginTop: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  timestamp: { ...typography.caption, marginTop: spacing.sm, marginBottom: spacing.md },
  summaryCard: { marginBottom: spacing.md },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xs },
  summaryLabel: { ...typography.caption, fontWeight: "700", textTransform: "uppercase" },
  label: { ...typography.bodySmall, fontWeight: "600", marginTop: spacing.md, marginBottom: spacing.sm },
  contentCard: { marginBottom: spacing.sm },
  chipWrap: { flexDirection: "row", flexWrap: "wrap" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});

import { format, isThisYear } from "date-fns";
import { useMemo } from "react";
import { RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useMemories } from "@/hooks/useMemories";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";
import type { MemoryOut } from "@/types/api";

interface Section {
  title: string;
  data: MemoryOut[];
}

function groupByMonth(memories: MemoryOut[]): Section[] {
  const groups = new Map<string, MemoryOut[]>();
  for (const memory of memories) {
    const date = new Date(memory.created_at);
    const label = isThisYear(date) ? format(date, "MMMM") : format(date, "MMMM yyyy");
    const bucket = groups.get(label) ?? [];
    bucket.push(memory);
    groups.set(label, bucket);
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export default function TimelineScreen() {
  const { colors } = useAppTheme();
  const memoriesQuery = useMemories({ page_size: 200 });
  const sections = useMemo(() => groupByMonth(memoriesQuery.data?.items ?? []), [memoriesQuery.data]);

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Timeline</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your memories, chronologically.</Text>
      </View>

      {memoriesQuery.isError ? (
        <View style={styles.padded}>
          <ErrorBanner message={getApiErrorMessage(memoriesQuery.error, "Couldn't load your timeline.")} />
        </View>
      ) : null}

      {memoriesQuery.isLoading ? (
        <LoadingState label="Building your timeline…" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={memoriesQuery.isRefetching} onRefresh={() => memoriesQuery.refetch()} />}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={[styles.rail, { backgroundColor: colors.border }]} />
              <View style={styles.itemContent}>
                <MemoryCard memory={item} />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title="Nothing here yet" description="Your captured memories will appear on this timeline." />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.sm },
  title: { ...typography.displayMd },
  subtitle: { ...typography.body },
  padded: { paddingHorizontal: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { ...typography.title },
  itemRow: { flexDirection: "row" },
  rail: { width: 2, marginRight: spacing.sm, marginLeft: 3 },
  itemContent: { flex: 1 },
});

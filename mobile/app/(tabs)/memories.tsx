import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { CategoryChip } from "@/components/memory/CategoryChip";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/hooks/useCategories";
import { useMemories } from "@/hooks/useMemories";
import { getApiErrorMessage } from "@/services/api/client";
import { radius, spacing, typography } from "@/constants/theme";

type FilterMode = "all" | "favorites" | "archived" | "trash";

const FILTERS: { key: FilterMode; label: string }[] = [
  { key: "all", label: "All" },
  { key: "favorites", label: "Favorites" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
];

export default function AllMemoriesScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    if (params.category) setCategory(params.category);
  }, [params.category]);

  const categoriesQuery = useCategories();
  const memoriesQuery = useMemories({
    category,
    favorite: filter === "favorites" ? true : undefined,
    archived: filter === "archived",
    deleted: filter === "trash",
    page_size: 100,
  });

  const items = memoriesQuery.data?.items ?? [];

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>All Memories</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterPill,
              { backgroundColor: filter === f.key ? colors.accent : colors.surfaceMuted },
            ]}
          >
            <Text style={{ color: filter === f.key ? colors.textInverted : colors.textPrimary, fontWeight: "600" }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categoriesQuery.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.categoryRow}
        renderItem={({ item }) => (
          <CategoryChip
            name={item.name}
            count={item.memory_count}
            selected={category === item.name}
            onPress={() => setCategory(category === item.name ? undefined : item.name)}
          />
        )}
      />

      {memoriesQuery.isLoading ? (
        <LoadingState label="Loading your memories…" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={memoriesQuery.isRefetching} onRefresh={() => memoriesQuery.refetch()} />}
          ListHeaderComponent={
            memoriesQuery.isError ? (
              <ErrorBanner message={getApiErrorMessage(memoriesQuery.error, "Couldn't load memories.")} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === "trash" ? "Trash is empty" : "No memories found"}
              description={
                filter === "trash"
                  ? "Deleted memories will show up here."
                  : "Try a different category, or capture a new memory from the Home tab."
              }
            />
          }
          renderItem={({ item }) => <MemoryCard memory={item} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { ...typography.displayMd },
  filterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2, borderRadius: radius.pill },
  categoryRow: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
});

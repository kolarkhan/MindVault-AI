import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoryChip } from "@/components/memory/CategoryChip";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { iconForCategory } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCategories } from "@/hooks/useCategories";
import { useMemories } from "@/hooks/useMemories";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useDraftStore } from "@/store/draftStore";
import type { SourceType } from "@/types/api";

export default function HomeDashboard() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const startDraft = useDraftStore((s) => s.startDraft);

  const memoriesQuery = useMemories({ page_size: 50 });
  const categoriesQuery = useCategories();

  const memories = memoriesQuery.data?.items ?? [];

  const recent = memories.slice(0, 5);
  const important = useMemo(() => memories.filter((m) => m.importance === "high").slice(0, 5), [memories]);
  const upcomingDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return memories
      .flatMap((m) => m.dates.filter((d) => d.date && !d.is_uncertain).map((d) => ({ memory: m, date: d })))
      .filter((entry) => new Date(entry.date.date as string) >= today)
      .sort((a, b) => (a.date.date as string).localeCompare(b.date.date as string))
      .slice(0, 3);
  }, [memories]);

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const startCapture = (sourceType: SourceType) => {
    if (sourceType === "voice") {
      Alert.alert(
        "Voice capture is coming soon",
        "Voice memories are planned for a future update. For now, try Text, Photo, or Camera."
      );
      return;
    }
    startDraft({ sourceType, content: "" });
    router.push("/memory/create");
  };

  return (
    <ScreenContainer padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={memoriesQuery.isRefetching} onRefresh={() => memoriesQuery.refetch()} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting},</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{firstName}</Text>
          <Text style={[styles.prompt, { color: colors.textMuted }]}>What&apos;s on your mind?</Text>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/search")}
          style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]}
        >
          <Feather name="search" size={18} color={colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Ask MindVault anything…</Text>
        </Pressable>

        <View style={styles.quickActions}>
          <QuickAction icon="type" label="Text" onPress={() => startCapture("text")} />
          <QuickAction icon="image" label="Photo" onPress={() => startCapture("image")} />
          <QuickAction icon="camera" label="Camera" onPress={() => startCapture("camera")} />
          <QuickAction icon="mic" label="Voice" onPress={() => startCapture("voice")} soon />
        </View>

        {memoriesQuery.isError ? (
          <ErrorBanner message={getApiErrorMessage(memoriesQuery.error, "Couldn't load your memories.")} />
        ) : null}

        <SectionHeader title="Statistics" />
        <View style={styles.statsRow}>
          <StatTile label="Memories" value={memoriesQuery.data?.total ?? 0} icon="layers" />
          <StatTile label="Categories" value={categoriesQuery.data?.length ?? 0} icon="grid" />
          <StatTile label="Important" value={important.length} icon="star" />
        </View>

        {upcomingDates.length > 0 ? (
          <>
            <SectionHeader title="Upcoming dates" />
            {upcomingDates.map(({ memory, date }) => (
              <Pressable key={`${memory.id}-${date.label}`} onPress={() => router.push(`/memory/${memory.id}`)}>
                <Card style={styles.upcomingCard}>
                  <View style={[styles.upcomingIcon, { backgroundColor: colors.accentSoft }]}>
                    <Feather name="calendar" size={16} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]}>{memory.title}</Text>
                    <Text style={[styles.upcomingDate, { color: colors.textSecondary }]}>
                      {date.label} · {date.date}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        ) : null}

        <SectionHeader title="Categories" href="/categories" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {(categoriesQuery.data ?? []).map((category) => (
            <CategoryChip
              key={category.id}
              name={category.name}
              count={category.memory_count}
              onPress={() => router.push({ pathname: "/(tabs)/memories", params: { category: category.name } })}
            />
          ))}
        </ScrollView>

        {important.length > 0 ? (
          <>
            <SectionHeader title="Important memories" href="/(tabs)/memories" />
            {important.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </>
        ) : null}

        <SectionHeader title="Recent memories" href="/(tabs)/memories" />
        {memoriesQuery.isLoading ? null : recent.length === 0 ? (
          <EmptyState
            icon={iconForCategory("Other")}
            title="No memories yet"
            description="Capture your first memory with the quick actions above."
          />
        ) : (
          recent.map((memory) => <MemoryCard key={memory.id} memory={memory} />)
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function QuickAction({
  icon,
  label,
  onPress,
  soon = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  soon?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: colors.accentSoft }]}>
        <Feather name={icon} size={20} color={colors.accent} />
        {soon ? <View style={[styles.soonDot, { backgroundColor: colors.warning }]} /> : null}
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ComponentProps<typeof Feather>["name"] }) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.statTile}>
      <Feather name={icon} size={16} color={colors.accent} />
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: { marginTop: spacing.md },
  greeting: { ...typography.body },
  name: { ...typography.displayLg },
  prompt: { ...typography.body, marginTop: spacing.xs },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  searchPlaceholder: { ...typography.body },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg },
  quickAction: { alignItems: "center", gap: spacing.xs, width: 72 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  soonDot: { position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4 },
  quickActionLabel: { ...typography.caption },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statTile: { flex: 1, alignItems: "flex-start", gap: 4 },
  statValue: { ...typography.title },
  statLabel: { ...typography.caption },
  categoryRow: { paddingVertical: spacing.xs },
  upcomingCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  upcomingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  upcomingTitle: { ...typography.subtitle },
  upcomingDate: { ...typography.caption },
});

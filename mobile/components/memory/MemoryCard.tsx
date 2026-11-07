import { Feather } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { iconForCategory, SOURCE_TYPE_ICON_MAP } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";
import type { MemoryOut } from "@/types/api";

export function MemoryCard({ memory }: { memory: MemoryOut }) {
  const { colors } = useAppTheme();
  const router = useRouter();
  const sourceIcon = SOURCE_TYPE_ICON_MAP[memory.source_type] ?? "file";
  const categoryIcon = iconForCategory(memory.category);

  return (
    <Pressable onPress={() => router.push(`/memory/${memory.id}`)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <Feather name={categoryIcon} size={18} color={colors.accent} />
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {memory.title}
              </Text>
              {memory.is_favorite ? <Feather name="star" size={14} color={colors.warning} /> : null}
            </View>
            <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
              {memory.summary || memory.content}
            </Text>
            <View style={styles.metaRow}>
              <Badge label={memory.category} tone="accent" />
              <View style={styles.metaItem}>
                <Feather name={sourceIcon} size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 2 },
  title: { ...typography.subtitle, flex: 1 },
  summary: { ...typography.bodySmall, marginBottom: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...typography.caption },
});

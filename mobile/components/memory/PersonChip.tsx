import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";

export function PersonChip({ name }: { name: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
      <Feather name="user" size={12} color={colors.textSecondary} />
      <Text style={[styles.label, { color: colors.textPrimary }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: { ...typography.bodySmall, fontWeight: "600" },
});

import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { iconForCategory } from "@/constants/categories";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface Props {
  name: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
}

export function CategoryChip({ name, selected = false, onPress, count }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceMuted,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Feather name={iconForCategory(name)} size={14} color={selected ? colors.textInverted : colors.textSecondary} />
      <Text style={[styles.label, { color: selected ? colors.textInverted : colors.textPrimary }]}>{name}</Text>
      {typeof count === "number" ? (
        <Text style={[styles.count, { color: selected ? colors.textInverted : colors.textMuted }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { ...typography.bodySmall, fontWeight: "600" },
  count: { ...typography.caption },
});

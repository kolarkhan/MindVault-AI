import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";

interface Props {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export function ListRow({ icon, label, value, onPress, danger = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: danger ? colors.danger + "1A" : colors.surfaceMuted }]}>
        <Feather name={icon} size={16} color={danger ? colors.danger : colors.textSecondary} />
      </View>
      <Text style={[styles.label, { color: danger ? colors.danger : colors.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
      {onPress ? <Feather name="chevron-right" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { ...typography.body, flex: 1 },
  value: { ...typography.bodySmall },
});

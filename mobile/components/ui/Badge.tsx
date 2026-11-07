import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface Props {
  label: string;
  tone?: "accent" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ label, tone = "neutral" }: Props) {
  const { colors } = useAppTheme();
  const backgroundColor = {
    accent: colors.accentSoft,
    success: colors.success + "26",
    warning: colors.warning + "26",
    danger: colors.danger + "26",
    neutral: colors.surfaceMuted,
  }[tone];
  const textColor = {
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.textSecondary,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  label: { ...typography.caption },
});

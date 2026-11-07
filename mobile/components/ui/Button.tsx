import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: Props) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = {
    primary: colors.accent,
    secondary: colors.surfaceMuted,
    ghost: "transparent",
    danger: colors.danger,
  }[variant];

  const textColor = {
    primary: colors.textInverted,
    secondary: colors.textPrimary,
    ghost: colors.accent,
    danger: colors.textInverted,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1 },
        fullWidth && styles.fullWidth,
        variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { width: "100%" },
  label: { ...typography.subtitle },
});

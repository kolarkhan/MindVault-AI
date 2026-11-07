import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";
import { Button } from "@/components/ui/Button";

interface Props {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Used everywhere a list could be empty — never shows fabricated placeholder data,
 * only an honest "nothing here yet" state with a clear next action. */
export function EmptyState({ icon = "inbox", title, description, actionLabel, onAction }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
        <Feather name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.subtitle, marginBottom: spacing.xs, textAlign: "center" },
  description: { ...typography.bodySmall, textAlign: "center", marginBottom: spacing.md },
  action: { marginTop: spacing.sm },
});

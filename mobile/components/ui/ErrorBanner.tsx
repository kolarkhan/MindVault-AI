import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing, typography } from "@/constants/theme";

export function ErrorBanner({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.danger + "1A", borderColor: colors.danger + "40" }]}>
      <Feather name="alert-circle" size={18} color={colors.danger} />
      <Text style={[styles.text, { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  text: { ...typography.bodySmall, flex: 1 },
});

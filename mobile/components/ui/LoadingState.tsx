import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";

export function LoadingState({ label }: { label?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} size="large" />
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  label: { ...typography.body, marginTop: spacing.md },
});

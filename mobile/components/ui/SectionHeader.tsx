import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: Parameters<ReturnType<typeof useRouter>["push"]>[0];
}

export function SectionHeader({ title, actionLabel = "See all", onAction, href }: Props) {
  const { colors } = useAppTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onAction) onAction();
    else if (href) router.push(href);
  };

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {onAction || href ? (
        <Pressable onPress={handlePress}>
          <Text style={[styles.action, { color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  title: { ...typography.title },
  action: { ...typography.bodySmall, fontWeight: "600" },
});

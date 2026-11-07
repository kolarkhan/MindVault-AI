import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing } from "@/constants/theme";

interface Props extends PropsWithChildren {
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Every screen wraps its content in this — keeps background color, safe-area, and
 * default padding consistent everywhere instead of each screen reinventing it. */
export function ScreenContainer({ children, padded = true, style }: Props) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.flex, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});

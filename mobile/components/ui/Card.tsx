import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, shadow, spacing } from "@/constants/theme";

interface Props extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.surface, borderColor: colors.border },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.card,
  },
  padded: { padding: spacing.md },
});

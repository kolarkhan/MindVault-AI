import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";
import type { ExtractedAmount } from "@/types/api";

const TXN_LABEL: Record<ExtractedAmount["transaction_type"], string> = {
  lent: "Lent",
  borrowed: "Borrowed",
  gave: "Gave",
  received: "Received",
  spent: "Spent",
  other: "Recorded",
};

/** Financial memory card per the spec's "Finance Memory" feature — a dedicated Finance
 * screen is Phase 2, but every memory with extracted amounts renders this on its detail
 * page today. Never invents a transaction that wasn't explicitly extracted. */
export function FinanceCard({ amounts }: { amounts: ExtractedAmount[] }) {
  const { colors } = useAppTheme();
  if (amounts.length === 0) return null;

  return (
    <Card style={[styles.card, { backgroundColor: colors.accentSoft, borderColor: "transparent" }]}>
      <View style={styles.header}>
        <Feather name="dollar-sign" size={16} color={colors.accent} />
        <Text style={[styles.headerText, { color: colors.accent }]}>Financial details</Text>
      </View>
      {amounts.map((amount, index) => (
        <View key={index} style={[styles.row, index > 0 && styles.rowBorder, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.amount, { color: colors.textPrimary }]}>
              {amount.currency} {amount.amount.toLocaleString()}
            </Text>
            {amount.person ? (
              <Text style={[styles.subtext, { color: colors.textSecondary }]}>
                {TXN_LABEL[amount.transaction_type]} {amount.transaction_type === "received" ? "from" : "to"} {amount.person}
              </Text>
            ) : (
              <Text style={[styles.subtext, { color: colors.textSecondary }]}>{TXN_LABEL[amount.transaction_type]}</Text>
            )}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  headerText: { ...typography.caption, fontWeight: "700", textTransform: "uppercase" },
  row: { paddingVertical: spacing.xs },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xs },
  amount: { ...typography.title },
  subtext: { ...typography.bodySmall },
});

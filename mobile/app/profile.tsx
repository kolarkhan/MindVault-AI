import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{user.name}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
      </View>

      <Card>
        <Row label="Plan" value={user.plan === "pro" ? "Pro" : "Free"} />
        <Row label="Email verified" value={user.email_verified ? "Yes" : "Not verified yet"} />
        <Row label="Member since" value={format(new Date(user.created_at), "MMMM yyyy")} last />
      </Card>
    </ScreenContainer>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: spacing.md },
  avatarSection: { alignItems: "center", marginVertical: spacing.xl },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { ...typography.title },
  email: { ...typography.bodySmall, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm + 2 },
});

import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ListRow } from "@/components/ui/ListRow";
import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

      <Card style={styles.card}>
        <ListRow icon="user" label="Profile" value={user?.name} onPress={() => router.push("/profile")} />
        <ListRow icon="grid" label="Categories" onPress={() => router.push("/categories")} />
        <ListRow icon="star" label="Plan" value={user?.plan === "pro" ? "Pro" : "Free"} onPress={() => router.push("/(tabs)/settings")} />
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PRIVACY</Text>
      <Card style={styles.card}>
        <ListRow
          icon="shield"
          label="Privacy & data"
          onPress={() =>
            Alert.alert(
              "Privacy & data",
              "MindVault AI processes what you explicitly save to generate summaries, tags, and search answers. Your memories are never shared with other users. Data export and account deletion tools are on the roadmap."
            )
          }
        />
        <ListRow
          icon="cpu"
          label="How AI processing works"
          onPress={() =>
            Alert.alert(
              "AI processing",
              "MindVault AI never invents facts. It only extracts information you explicitly wrote or spoke, and clearly marks anything uncertain for your confirmation before saving."
            )
          }
        />
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
      <Card style={styles.card}>
        <ListRow icon="info" label="Version" value={Constants.expoConfig?.version ?? "0.1.0"} />
      </Card>

      <View style={styles.signOutWrap}>
        <ListRow icon="log-out" label="Sign out" onPress={handleSignOut} danger />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.displayMd, marginTop: spacing.md, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg, paddingVertical: 0 },
  sectionLabel: { ...typography.caption, marginBottom: spacing.sm, marginLeft: spacing.xs },
  signOutWrap: { marginTop: spacing.md },
});

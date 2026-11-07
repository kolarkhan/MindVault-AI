import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAppStore } from "@/store/appStore";
import { spacing, typography } from "@/constants/theme";

const HIGHLIGHTS: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; description: string }[] = [
  {
    icon: "edit-3",
    title: "Capture anything, instantly",
    description: "Text, voice, photos, and documents — save it in seconds, in your own words.",
  },
  {
    icon: "cpu",
    title: "AI that understands, never invents",
    description: "MindVault organizes and tags what you save — it never makes up facts you didn't give it.",
  },
  {
    icon: "message-circle",
    title: "Ask, and get grounded answers",
    description: 'Ask "What did I discuss with Ahmed?" and get an answer backed by your own memories.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const markOnboarded = useAppStore((s) => s.markOnboarded);

  const handleContinue = async () => {
    await markOnboarded();
    router.replace("/(auth)/login");
  };

  return (
    <ScreenContainer>
      <View style={styles.brandRow}>
        <View style={[styles.logoDot, { backgroundColor: colors.accent }]} />
        <Text style={[styles.brand, { color: colors.textPrimary }]}>MindVault AI</Text>
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>Your second brain,{"\n"}always remembering.</Text>

      <View style={styles.highlights}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.highlightRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
              <Feather name={item.icon} size={20} color={colors.accent} />
            </View>
            <View style={styles.highlightText}>
              <Text style={[styles.highlightTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.highlightDescription, { color: colors.textSecondary }]}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button label="Get started" onPress={handleContinue} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg },
  logoDot: { width: 12, height: 12, borderRadius: 6 },
  brand: { ...typography.subtitle },
  headline: { ...typography.displayLg, marginTop: spacing.xl, marginBottom: spacing.xl },
  highlights: { flex: 1, gap: spacing.lg },
  highlightRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  highlightText: { flex: 1 },
  highlightTitle: { ...typography.subtitle, marginBottom: 2 },
  highlightDescription: { ...typography.bodySmall },
  footer: { paddingBottom: spacing.lg, paddingTop: spacing.md },
});

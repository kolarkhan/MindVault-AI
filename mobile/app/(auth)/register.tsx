import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as authApi from "@/services/api/auth";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkStyle = StyleSheet.flatten([styles.link, { color: colors.accent }]);

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill in your name, email, and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.register(name.trim(), email.trim(), password);
      await setSession(auth);
      router.replace("/(tabs)");
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start building your second brain in under a minute.
          </Text>

          {error ? <ErrorBanner message={error} /> : null}

          <TextField label="Name" value={name} onChangeText={setName} autoComplete="name" placeholder="Your name" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          <Button label="Create account" onPress={handleRegister} loading={loading} style={styles.submit} />

          <View style={styles.footerRow}>
            <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={linkStyle}>Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  title: { ...typography.displayMd, marginBottom: spacing.xs },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  link: { ...typography.bodySmall, fontWeight: "600" },
  submit: { marginTop: spacing.md },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});

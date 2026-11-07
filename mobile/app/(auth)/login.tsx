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

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkStyle = StyleSheet.flatten([styles.link, { color: colors.accent }]);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.login(email.trim(), password);
      await setSession(auth);
      router.replace("/(tabs)");
    } catch (e) {
      setError(getApiErrorMessage(e, "Couldn't sign you in. Check your credentials and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to pick up right where you left off.
          </Text>

          {error ? <ErrorBanner message={error} /> : null}

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
            autoComplete="password"
            placeholder="••••••••"
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Text style={linkStyle}>Forgot password?</Text>
          </Link>

          <Button label="Sign in" onPress={handleLogin} loading={loading} style={styles.submit} />

          <View style={styles.footerRow}>
            <Text style={{ color: colors.textSecondary }}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <Text style={linkStyle}>Create one</Text>
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

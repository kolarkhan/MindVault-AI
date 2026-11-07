import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as authApi from "@/services/api/auth";
import { getApiErrorMessage } from "@/services/api/client";
import { spacing, typography } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError("Enter the email you registered with.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Reset your password</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        We&apos;ll generate a reset link for your account.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {sent ? (
        <View style={[styles.confirmation, { backgroundColor: colors.accentSoft }]}>
          <Feather name="check-circle" size={20} color={colors.accent} />
          <Text style={[styles.confirmationText, { color: colors.textPrimary }]}>
            If that email is registered, a password reset link has been generated. In this development build,
            check the backend server logs for the link.
          </Text>
        </View>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Button label="Send reset link" onPress={handleSubmit} loading={loading} style={styles.submit} />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: spacing.md },
  title: { ...typography.displayMd, marginBottom: spacing.xs, marginTop: spacing.md },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  submit: { marginTop: spacing.md },
  confirmation: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: 14 },
  confirmationText: { ...typography.bodySmall, flex: 1 },
});

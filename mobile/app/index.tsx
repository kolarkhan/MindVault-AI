import { Redirect } from "expo-router";

import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

/** The very first route. RootLayout only mounts this once auth + app state is hydrated
 * from secure storage, so this is a pure, synchronous redirect decision. */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  if (user) return <Redirect href="/(tabs)" />;
  if (!isOnboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(auth)/login" />;
}

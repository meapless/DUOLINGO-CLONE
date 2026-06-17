import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useLanguageStore } from "@/store/useLanguageStore";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const hasHydrated = useLanguageStore((s) => s.hasHydrated);

  // Wait for Clerk to restore the session and the stored language to load
  // before deciding where to go.
  if (!isLoaded || !hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#6c4ef5" />
      </View>
    );
  }

  // Not authenticated → show onboarding.
  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  // Authenticated but no language chosen yet → force language selection.
  if (!selectedLanguage) {
    return <Redirect href="/language-select" />;
  }

  // Authenticated → main app (bottom tab navigation).
  return <Redirect href="/home" />;
}

import { useAuth, useClerk, useUser } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { getLanguage } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const hasHydrated = useLanguageStore((s) => s.hasHydrated);
  const clearLanguage = useLanguageStore((s) => s.clearLanguage);

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

  const language = getLanguage(selectedLanguage);

  // Authenticated → home (placeholder until the home UI step).
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="heading--h1 text-center">Welcome to Lingua 🎉</Text>
      <Text className="body--md mt-2 text-center text-text-secondary">
        {user?.primaryEmailAddress?.emailAddress ?? "You're signed in."}
      </Text>
      <Text className="body--md mt-1 text-center text-text-secondary">
        Learning {language?.name ?? selectedLanguage}
      </Text>

      <TouchableOpacity
        onPress={() => clearLanguage()}
        activeOpacity={0.9}
        className="btn btn--outline mt-8 px-8"
      >
        <Text className="btn__label--dark">Clear language (testing)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => signOut()}
        activeOpacity={0.9}
        className="btn btn--ghost mt-3 px-8"
      >
        <Text className="btn__label--dark">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import TabBar from "@/components/TabBar";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const hasHydrated = useLanguageStore((s) => s.hasHydrated);

  // Wait for Clerk and the persisted language to load before guarding.
  if (!isLoaded || !hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#6c4ef5" />
      </View>
    );
  }

  // Signing out flips `isSignedIn` → send the user back to onboarding.
  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  // No language chosen (e.g. cleared from Profile) → back to the picker.
  if (!selectedLanguage) {
    return <Redirect href="/language-select" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="learn" options={{ title: "Learn" }} />
      <Tabs.Screen name="ai-teacher" options={{ title: "AI Teacher" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

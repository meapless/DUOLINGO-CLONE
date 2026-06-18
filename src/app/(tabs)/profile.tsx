import { useClerk, useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getLanguage } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const posthog = usePostHog();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const clearLanguage = useLanguageStore((s) => s.clearLanguage);

  const language = selectedLanguage ? getLanguage(selectedLanguage) : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="heading--h2 text-center">Profile</Text>
        <Text className="body--md mt-2 text-center text-text-secondary">
          {user?.primaryEmailAddress?.emailAddress ?? "You're signed in."}
        </Text>
        {language && (
          <Text className="body--md mt-1 text-center text-text-secondary">
            Learning {language.name}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => clearLanguage()}
          activeOpacity={0.9}
          className="btn btn--outline mt-8 px-8"
        >
          <Text className="btn__label--dark">Clear language (testing)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            posthog?.capture("user_signed_out");
            posthog?.reset();
            signOut();
          }}
          activeOpacity={0.9}
          className="btn btn--ghost mt-3 px-8"
        >
          <Text className="btn__label--dark">Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

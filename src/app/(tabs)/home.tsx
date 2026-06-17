import { useUser } from "@clerk/expo";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getLanguage } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";

export default function HomeScreen() {
  const { user } = useUser();

  const selectedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const language = selectedLanguage ? getLanguage(selectedLanguage) : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 px-6">
        <Text className="heading--h2 mt-2">
          {user?.firstName ? `Hi, ${user.firstName}!` : "Welcome back!"}
        </Text>

        {/* ── Currently learning ── */}
        {language ? (
          <View className="card--surface mt-6 flex-row items-center">
            <View className="h-12 w-12 overflow-hidden rounded-full bg-background">
              <Image
                source={{ uri: language.flag }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="body--caption">{"You're learning"}</Text>
              <Text className="card__title">{language.name}</Text>
            </View>
          </View>
        ) : (
          <Text className="body--md mt-6 text-text-secondary">
            No language selected yet.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

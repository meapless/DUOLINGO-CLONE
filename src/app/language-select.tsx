import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChevronLeftIcon, SearchIcon } from "@/components/icons";
import LanguageCard from "@/components/LanguageCard";
import { images } from "@/constants/images";
import { getAvailableLanguages } from "@/data/languages";
import { useLanguageStore } from "@/store/useLanguageStore";
import type { LanguageCode } from "@/types/learning";

export default function LanguageSelect() {
  const router = useRouter();
  const posthog = usePostHog();
  const { width } = useWindowDimensions();
  const allLanguages = getAvailableLanguages();

  const storedLanguage = useLanguageStore((s) => s.selectedLanguage);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const [query, setQuery] = useState("");
  // Pre-select the stored language if there is one, otherwise the first option.
  const [selected, setSelected] = useState<LanguageCode>(
    storedLanguage ?? allLanguages[0]?.code,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allLanguages;
    return allLanguages.filter(
      (language) =>
        language.name.toLowerCase().includes(q) ||
        language.nativeName.toLowerCase().includes(q),
    );
  }, [query, allLanguages]);

  const handleConfirm = () => {
    if (!selected) return;
    posthog?.capture("language_selected", { language_code: selected });
    // Persist the choice, then go to home. `replace` so the picker isn't left
    // on the back stack (this screen can be the entry point on first launch).
    setLanguage(selected);
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1">
        {/* ── Header ── */}
        <View className="relative h-12 flex-row items-center justify-center px-6">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="absolute left-6"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeftIcon />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-[17px] text-text-primary">
            Choose a language
          </Text>
        </View>

        {/* ── Search ── */}
        <View className="mt-2 flex-row items-center rounded-2xl bg-surface px-4 py-3 mx-6">
          <SearchIcon />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search languages"
            placeholderTextColor="#6b7280"
            className="ml-2 flex-1 font-poppins text-body-md text-text-primary"
            style={{ paddingVertical: 0 }}
          />
        </View>

        {/* ── List ── */}
        <ScrollView
          className="mt-5 flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <Text className="mb-3 font-poppins-semibold text-body-md text-text-primary">
            Popular
          </Text>

          {filtered.map((language) => (
            <LanguageCard
              key={language.code}
              language={language}
              selected={language.code === selected}
              onPress={() => setSelected(language.code)}
            />
          ))}

          {filtered.length === 0 && (
            <Text className="mt-6 text-center font-poppins text-body-md text-text-secondary">
              No languages found.
            </Text>
          )}
        </ScrollView>

        {/* ── Footer: confirm button + earth illustration ── */}
        <View className="px-6">
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.9}
            disabled={!selected}
            className={`btn btn--primary w-full ${selected ? "" : "opacity-50"}`}
          >
            <Text className="btn__label">Confirm</Text>
          </TouchableOpacity>
        </View>

        {/* Earth illustration — full width at the bottom. The asset is a square
            with transparent padding around the scene, so we render it full width
            and clip it into a band that reveals the landmarks, the green globe,
            and the water, with only the very bottom curve running off-screen. */}
        <View
          style={{ height: width * 0.64, width, overflow: "hidden", marginTop: 12 }}
        >
          <Image
            source={images.earth}
            resizeMode="cover"
            style={{ width, height: width, marginTop: -width * 0.07 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

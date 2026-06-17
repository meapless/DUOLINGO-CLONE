import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 px-6 pb-4">
        {/* ── Logo ── */}
        <View className="mt-2 flex-row items-center justify-center">
          <Image
            source={images.mascotLogo}
            className="h-9 w-9"
            resizeMode="contain"
          />
          <Text className="ml-2 font-poppins-bold text-h2 text-text-primary">
            Lingua
          </Text>
        </View>

        {/* ── Heading + Subtitle ── */}
        <View className="mt-8">
          <Text className="heading--h1">
            Your AI language{" "}
            <Text className="heading--h1 text-brand-purple">teacher.</Text>
          </Text>
          <Text className="body--md mt-3">
            Real conversations, personalized lessons, anytime, anywhere.
          </Text>
        </View>

        {/* ── Illustration with speech bubbles ── */}
        <View className="relative flex-1 items-center justify-center">
          {/* Hello! */}
          <View className="absolute left-2 top-6 z-10 rounded-2xl bg-surface px-4 py-2">
            <Text className="font-poppins-semibold text-body-md text-text-primary">
              Hello!
            </Text>
          </View>

          {/* ¡Hola! */}
          <View
            className="absolute right-4 top-2 z-10 rounded-2xl px-4 py-2"
            style={{ backgroundColor: "#ECE8FD" }}
          >
            <Text className="font-poppins-semibold text-body-md text-brand-purple">
              ¡Hola!
            </Text>
          </View>

          {/* 你好! */}
          <View
            className="absolute right-1 top-28 z-10 rounded-2xl px-4 py-2"
            style={{ backgroundColor: "#FDE9E7" }}
          >
            <Text className="font-poppins-semibold text-body-md text-error">
              你好!
            </Text>
          </View>

          <Image
            source={images.mascotWelcome}
            className="h-full w-full"
            resizeMode="contain"
          />
        </View>

        {/* ── Get Started button ── */}
        <TouchableOpacity
          className="btn btn--primary mt-4 w-full flex-row"
          activeOpacity={0.9}
          onPress={() => router.push("/sign-up")}
        >
          <Text className="btn__label">Get Started</Text>
          <View className="absolute bottom-0 right-6 top-0 justify-center">
            <Text className="btn__label">›</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

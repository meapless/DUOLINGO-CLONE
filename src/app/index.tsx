import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-h2 mt-90 text-center color-brand-purple">
        Lingua Franca
      </Text>

      <Link href="/onboarding" className="btn btn--primary mt-8 px-8">
        <Text className="btn__label">Open Onboarding</Text>
      </Link>
    </View>
  );
}

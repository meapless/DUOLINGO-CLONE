import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Temporary placeholder used by the tab screens until each screen's UI is built.
export default function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="heading--h2 text-center">{title}</Text>
        <Text className="body--md mt-2 text-center text-text-secondary">
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

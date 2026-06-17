import { useAuth, useClerk, useUser } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Wait for Clerk to restore the session before deciding where to go.
  if (!isLoaded) {
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

  // Authenticated → home (placeholder until the home UI step).
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="heading--h1 text-center">Welcome to Lingua 🎉</Text>
      <Text className="body--md mt-2 text-center text-text-secondary">
        {user?.primaryEmailAddress?.emailAddress ?? "You're signed in."}
      </Text>

      <TouchableOpacity
        onPress={() => signOut()}
        activeOpacity={0.9}
        className="btn btn--outline mt-8 px-8"
      >
        <Text className="btn__label--dark">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

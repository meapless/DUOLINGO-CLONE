import { ClerkProvider, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect } from "react";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

if (!posthogApiKey) {
  throw new Error("Add EXPO_PUBLIC_POSTHOG_API_KEY to your .env file");
}

SplashScreen.preventAutoHideAsync();

function NavigationTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();

  useEffect(() => {
    posthog?.screen(pathname);
  }, [pathname, posthog]);

  return null;
}

function UserTracker() {
  const posthog = usePostHog();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName;
      posthog?.identify(user.id, {
        $set: {
          ...(email && { email }),
          ...(name && { name }),
        },
      });
    }
  }, [isLoaded, user, posthog]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PostHogProvider
      apiKey={posthogApiKey}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        captureAppLifecycleEvents: true,
      }}
      autocapture={{
        captureScreens: false, // manual tracking via NavigationTracker
        captureTouches: true,
        propsToCapture: ["testID"],
        maxElementsCaptured: 20,
      }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <NavigationTracker />
        <UserTracker />
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkProvider>
    </PostHogProvider>
  );
}

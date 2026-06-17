import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { AppleIcon, FacebookIcon, GoogleIcon } from "@/components/icons";

// Completes the browser-based OAuth session when control returns to the app.
WebBrowser.maybeCompleteAuthSession();

type Strategy = "oauth_google" | "oauth_facebook" | "oauth_apple";

type SocialButtonProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

function SocialButton({
  icon,
  label,
  onPress,
  loading,
  disabled,
}: SocialButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      className={`h-14 flex-row items-center justify-center rounded-2xl border border-border bg-background ${
        disabled && !loading ? "opacity-60" : ""
      }`}
    >
      {/* Icon pinned left, label optically centered in the button */}
      <View className="absolute left-5">{icon}</View>
      {loading ? (
        <ActivityIndicator color="#6c4ef5" />
      ) : (
        <Text className="font-poppins-semibold text-body-md text-text-primary">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SocialAuthButtons() {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);

  // Warm up the browser on Android for a faster OAuth hand-off.
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleSSO = async (strategy: Strategy) => {
    if (activeStrategy) return;
    setActiveStrategy(strategy);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: Linking.createURL("/"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      // Surface in dev; OAuth requires the provider to be enabled in Clerk.
      console.error(`${strategy} sign-in failed`, err);
    } finally {
      setActiveStrategy(null);
    }
  };

  return (
    <View>
      {/* ── "or continue with" divider ── */}
      <View className="my-5 flex-row items-center">
        <View className="h-px flex-1 bg-border" />
        <Text className="mx-3 font-poppins text-body-sm text-text-secondary">
          or continue with
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      {/* ── Social providers ── */}
      <View className="gap-3">
        <SocialButton
          icon={<GoogleIcon />}
          label="Continue with Google"
          onPress={() => handleSSO("oauth_google")}
          loading={activeStrategy === "oauth_google"}
          disabled={!!activeStrategy}
        />
        <SocialButton
          icon={<FacebookIcon />}
          label="Continue with Facebook"
          onPress={() => handleSSO("oauth_facebook")}
          loading={activeStrategy === "oauth_facebook"}
          disabled={!!activeStrategy}
        />
        <SocialButton
          icon={<AppleIcon />}
          label="Continue with Apple"
          onPress={() => handleSSO("oauth_apple")}
          loading={activeStrategy === "oauth_apple"}
          disabled={!!activeStrategy}
        />
      </View>
    </View>
  );
}

import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthInput from "@/components/AuthInput";
import { ChevronLeftIcon } from "@/components/icons";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import VerificationModal from "@/components/VerificationModal";
import { images } from "@/constants/images";
import { getClerkErrorMessage } from "@/lib/clerk";

export default function SignIn() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const submitting = fetchStatus === "fetching";

  // Primary flow: email + password.
  const handlePasswordSignIn = async () => {
    if (!email || !password || submitting) return;
    setFormError(null);

    const { error } = await signIn.password({ identifier: email, password });
    if (error) {
      setFormError(getClerkErrorMessage(error));
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize();
      router.replace("/");
    } else {
      setFormError("Additional verification is required to sign in.");
    }
  };

  // Alternative flow: passwordless magic code emailed to the user.
  const handleSendMagicCode = async () => {
    if (!email || submitting) return;
    setFormError(null);

    const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (error) {
      setFormError(getClerkErrorMessage(error));
      return;
    }

    setShowVerification(true);
  };

  const handleVerify = async (code: string): Promise<string | null> => {
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) {
      return getClerkErrorMessage(error);
    }

    if (signIn.status === "complete") {
      await signIn.finalize();
      setShowVerification(false);
      router.replace("/");
      return null;
    }

    return "We couldn't verify that code. Please try again.";
  };

  const handleResend = async (): Promise<string | null> => {
    const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
    return error ? getClerkErrorMessage(error) : null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      >
        {/* ── Back button ── */}
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="mt-2 h-8 w-8 justify-center"
        >
          <ChevronLeftIcon />
        </TouchableOpacity>

        {/* ── Heading ── */}
        <Text className="heading--h1 mt-3">Welcome back</Text>
        <Text className="body--md mt-2 text-text-secondary">
          Log in to continue your language journey ✨
        </Text>

        {/* ── Mascot with sparkles ── */}
        <View className="relative my-2 h-44 items-center justify-center">
          <Text className="absolute left-10 top-4 text-2xl text-warning">
            ✦
          </Text>
          <Text className="absolute right-12 top-2 text-lg text-lingua-blue">
            ✦
          </Text>
          <Text className="absolute right-8 bottom-6 text-xl text-lingua-purple">
            ✦
          </Text>
          <Image
            source={images.mascotAuth}
            className="h-44 w-44"
            resizeMode="contain"
          />
        </View>

        {/* ── Form ── */}
        <View className="gap-3">
          <AuthInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="alex@gmail.com"
            keyboardType="email-address"
          />
          <AuthInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
          />
        </View>

        {/* ── Error message ── */}
        {formError && (
          <Text className="mt-3 font-poppins-medium text-body-sm text-error">
            {formError}
          </Text>
        )}

        {/* ── Sign In button (password) ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePasswordSignIn}
          disabled={submitting}
          className={`btn btn--primary mt-5 w-full ${submitting ? "opacity-70" : ""}`}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="btn__label">Sign In</Text>
          )}
        </TouchableOpacity>

        {/* ── Magic code option ── */}
        <TouchableOpacity
          className="mt-4 self-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={submitting}
          onPress={handleSendMagicCode}
        >
          <Text className="font-poppins-semibold text-body-md text-lingua-purple">
            Email me a magic code instead
          </Text>
        </TouchableOpacity>

        {/* ── Social auth ── */}
        <SocialAuthButtons />

        {/* ── Footer ── */}
        <View className="mt-6 flex-row items-center justify-center">
          <Text className="font-poppins text-body-md text-text-secondary">
            Don&apos;t have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/sign-up")}>
            <Text className="font-poppins-bold text-body-md text-lingua-purple">
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <VerificationModal
        visible={showVerification}
        email={email}
        onClose={() => setShowVerification(false)}
        onVerify={handleVerify}
        onResend={handleResend}
      />
    </SafeAreaView>
  );
}

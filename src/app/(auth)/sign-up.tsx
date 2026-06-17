import { useSignUp } from "@clerk/expo";
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

export default function SignUp() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const submitting = fetchStatus === "fetching";

  // Start the sign-up: create the account, then email a verification code.
  const handleSignUp = async () => {
    if (!email || !password || submitting) return;
    setFormError(null);

    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
      });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setFormError(getClerkErrorMessage(sendError));
        return;
      }

      setShowVerification(true);
    } catch (err) {
      const unexpectedError =
        err instanceof Error
          ? { message: err.message }
          : { message: "Unexpected sign-up error." };

      setFormError(getClerkErrorMessage(unexpectedError));
    }
  };

  // Verify the emailed code, then finalize the session and go home.
  const handleVerify = async (code: string): Promise<string | null> => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      return getClerkErrorMessage(error);
    }

    if (signUp.status === "complete") {
      await signUp.finalize();
      setShowVerification(false);
      router.replace("/");
      return null;
    }

    return "We couldn't verify that code. Please try again.";
  };

  const handleResend = async (): Promise<string | null> => {
    const { error } = await signUp.verifications.sendEmailCode();
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
        <Text className="heading--h1 mt-3">Create your account</Text>
        <Text className="body--md mt-2 text-text-secondary">
          Start your language journey today ✨
        </Text>

        {/* ── Mascot with sparkles ── */}
        <View className="relative my-2 h-44 items-center justify-center">
          <Text className="absolute left-10 top-4 text-2xl text-warning">
            ✦
          </Text>
          <Text className="absolute right-12 top-2 text-lg text-brand-blue">
            ✦
          </Text>
          <Text className="absolute right-8 bottom-6 text-xl text-brand-purple">
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

        {/* ── Sign Up button ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSignUp}
          disabled={submitting}
          className={`btn btn--primary mt-5 w-full ${submitting ? "opacity-70" : ""}`}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="btn__label">Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Clerk bot sign-up protection (invisible CAPTCHA fallback) */}
        <View nativeID="clerk-captcha" />

        {/* ── Social auth ── */}
        <SocialAuthButtons />

        {/* ── Footer ── */}
        <View className="mt-6 flex-row items-center justify-center">
          <Text className="font-poppins text-body-md text-text-secondary">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/sign-in")}>
            <Text className="font-poppins-bold text-body-md text-brand-purple">
              Log in
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

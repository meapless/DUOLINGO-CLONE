import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CODE_LENGTH = 6;

type VerificationModalProps = {
  visible: boolean;
  email: string;
  onClose: () => void;
  /**
   * Verifies the entered code. Resolve with an error message to display,
   * or `null` on success (the parent handles navigation/closing).
   */
  onVerify: (code: string) => Promise<string | null>;
  /** Re-sends the verification code. */
  onResend?: () => Promise<string | null> | void;
};

export default function VerificationModal({
  visible,
  email,
  onClose,
  onVerify,
  onResend,
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const submittingRef = useRef(false);

  // Reset the field and focus the keyboard every time the modal opens.
  const handleShow = () => {
    setCode("");
    setError(null);
    setSubmitting(false);
    submittingRef.current = false;
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  // Auto-submit as soon as the last digit lands.
  useEffect(() => {
    if (code.length !== CODE_LENGTH || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    onVerify(code)
      .then((message) => {
        // On success the parent closes the modal; on failure, show the error.
        if (message) {
          setError(message);
          setCode("");
          inputRef.current?.focus();
        }
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  }, [code, onVerify]);

  const handleChange = (text: string) => {
    if (submittingRef.current) return;
    const digits = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setError(null);
    setCode(digits);
  };

  const handleResend = async () => {
    if (!onResend) return;
    setError(null);
    setCode("");
    const message = await onResend();
    if (message) setError(message);
    inputRef.current?.focus();
  };

  const cells = Array.from({ length: CODE_LENGTH });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={handleShow}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Dim backdrop — tap outside the card to dismiss */}
        <Pressable
          onPress={onClose}
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0, 19, 40, 0.45)" }}
        >
          {/* Card — inner Pressable absorbs taps so they don't close the modal */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="w-full rounded-3xl bg-background p-6"
          >
            <Text className="heading--h2 text-center">Check your email</Text>
            <Text className="body--md mt-2 text-center text-text-secondary">
              We sent a 6-digit code to{" "}
              <Text className="font-poppins-semibold text-text-primary">
                {email || "your email"}
              </Text>
              . Enter it below to continue.
            </Text>

            {/* Code cells */}
            <View className="mt-6 flex-row gap-2">
              {cells.map((_, index) => {
                const digit = code[index] ?? "";
                const isActive = index === code.length;
                const isFilled = digit !== "";
                return (
                  <View
                    key={index}
                    className={`h-14 flex-1 items-center justify-center rounded-2xl border ${
                      error
                        ? "border-error bg-background"
                        : isActive || isFilled
                          ? "border-brand-purple bg-surface"
                          : "border-border bg-background"
                    }`}
                  >
                    <Text className="font-poppins-bold text-h3 text-text-primary">
                      {digit}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Hidden input that actually captures the number-pad entry */}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              editable={!submitting}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
            />

            {/* Status row: spinner while verifying, error otherwise */}
            <View className="mt-4 h-5 items-center justify-center">
              {submitting ? (
                <ActivityIndicator color="#6c4ef5" />
              ) : error ? (
                <Text className="font-poppins-medium text-body-sm text-error">
                  {error}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              className="mt-4 self-center"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={submitting}
              onPress={handleResend}
            >
              <Text className="font-poppins-medium text-body-sm text-text-secondary">
                Didn&apos;t get a code?{" "}
                <Text className="font-poppins-semibold text-brand-purple">
                  Resend
                </Text>
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

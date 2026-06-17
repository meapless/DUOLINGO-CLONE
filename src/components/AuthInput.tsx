import { useState } from "react";
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { EyeIcon, EyeOffIcon } from "@/components/icons";

type AuthInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Renders the field as a password input with a show/hide eye toggle. */
  secure?: boolean;
};

export default function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  secure = false,
}: AuthInputProps) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="rounded-2xl border border-border bg-background px-4 pb-2.5 pt-2">
      <Text className="font-poppins text-caption text-text-secondary">
        {label}
      </Text>

      <View className="flex-row items-center">
        <TextInput
          className="flex-1 p-0 font-poppins-medium text-body-lg text-text-primary"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={hidden}
        />

        {secure && (
          <TouchableOpacity
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="pl-2"
          >
            {hidden ? <EyeIcon /> : <EyeOffIcon />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

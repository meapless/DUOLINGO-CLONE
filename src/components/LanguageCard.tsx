import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CheckIcon, ChevronRightIcon } from "@/components/icons";
import type { Language } from "@/types/learning";

type LanguageCardProps = {
  language: Language;
  selected: boolean;
  onPress: () => void;
};

/**
 * A selectable language row used in the language picker: circular flag, name,
 * learner count, and a right-side indicator (purple check when selected, a
 * chevron otherwise). Elevated with a soft shadow like the design.
 */
export default function LanguageCard({
  language,
  selected,
  onPress,
}: LanguageCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      // Border color is themed via className; background + shadow are inline
      // because they are dynamic / platform-specific (see AGENTS style rules).
      className={`mb-3 flex-row items-center rounded-2xl border p-3 ${
        selected ? "border-brand-purple" : "border-transparent"
      }`}
      style={[
        styles.shadow,
        { backgroundColor: selected ? "#F4F1FE" : "#ffffff" },
      ]}
    >
      {/* Flag */}
      <View className="h-11 w-11 overflow-hidden rounded-full bg-surface">
        <Image
          source={{ uri: language.flag }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>

      {/* Name + learners */}
      <View className="ml-3 flex-1">
        <Text className="font-poppins-semibold text-body-lg text-text-primary">
          {language.name}
        </Text>
        <Text className="body--sm">{language.learners} learners</Text>
      </View>

      {/* Right indicator */}
      {selected ? (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-purple">
          <CheckIcon />
        </View>
      ) : (
        <ChevronRightIcon />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
});

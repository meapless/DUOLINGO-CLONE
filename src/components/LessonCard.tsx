import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { CheckIcon } from "@/components/icons";
import type { Lesson } from "@/types/learning";

export type LessonStatus = "completed" | "in-progress" | "available";

interface LessonCardProps {
  lesson: Lesson;
  lessonNumber: number;
  status: LessonStatus;
  onPress: () => void;
}

const PLACEHOLDER = "https://picsum.photos/seed/lesson/80/80";

export default function LessonCard({
  lesson,
  lessonNumber,
  status,
  onPress,
}: LessonCardProps) {
  const imageUri = lesson.image ?? PLACEHOLDER;

  if (status === "completed") {
    return (
      <Pressable onPress={onPress} style={styles.cardCompleted}>
        <View className="flex-1">
          <Text className="font-poppins text-caption text-text-secondary">
            Lesson {lessonNumber}
          </Text>
          <Text className="font-poppins-semibold text-h4 text-text-primary mt-0.5" numberOfLines={1}>
            {lesson.title}
          </Text>
        </View>
        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View className="ml-2.5 h-8 w-8 items-center justify-center rounded-full bg-success">
          <CheckIcon size={15} color="#ffffff" />
        </View>
      </Pressable>
    );
  }

  if (status === "in-progress") {
    return (
      <Pressable onPress={onPress} style={styles.cardInProgress}>
        <View className="flex-1">
          <Text className="font-poppins text-caption text-white/70">
            Lesson {lessonNumber}
          </Text>
          <Text
            className="font-poppins-semibold text-h4 text-white mt-0.5"
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
          <View className="mt-2 self-start rounded-full bg-warning px-3 py-1">
            <Text className="font-poppins-bold text-caption text-text-primary">
              In progress
            </Text>
          </View>
        </View>
        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  // available
  return (
    <Pressable onPress={onPress} style={styles.cardAvailable}>
      <View className="flex-1">
        <Text className="font-poppins text-caption text-text-secondary">
          Lesson {lessonNumber}
        </Text>
        <Text
          className="font-poppins-semibold text-h4 text-text-primary mt-0.5"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <Text className="font-poppins text-body-sm text-text-secondary mt-0.5">
          {lesson.vocabulary.length} words · {lesson.xpReward} XP
        </Text>
      </View>
      <Image
        source={{ uri: imageUri }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardCompleted: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInProgress: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6c4ef5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#6c4ef5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAvailable: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginLeft: 12,
  },
});

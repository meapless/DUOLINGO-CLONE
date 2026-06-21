import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { CheckIcon, PlayIcon } from "@/components/icons";
import type { Lesson } from "@/types/learning";

export type LessonStatus = "completed" | "in-progress" | "available";

interface LessonCardProps {
  lesson: Lesson;
  lessonNumber: number;
  status: LessonStatus;
  /** Whether this card is currently selected (reveals the Start button). */
  selected?: boolean;
  /** Tap the card body — selects/deselects it. */
  onPress: () => void;
  /** Tap the revealed Start button — opens the lesson. */
  onStart?: () => void;
}

const PLACEHOLDER = "https://picsum.photos/seed/lesson/80/80";

export default function LessonCard({
  lesson,
  lessonNumber,
  status,
  selected = false,
  onPress,
  onStart,
}: LessonCardProps) {
  const imageUri = lesson.image ?? PLACEHOLDER;
  const isInProgress = status === "in-progress";

  const cardStyle =
    status === "in-progress" ? styles.cardInProgress : styles.cardBase;

  // Text colors flip on the purple in-progress card.
  const metaClass = isInProgress ? "text-white/70" : "text-text-secondary";
  const titleClass = isInProgress ? "text-white" : "text-text-primary";

  return (
    <Pressable
      onPress={onPress}
      style={[cardStyle, selected && styles.cardSelected]}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className={`font-poppins text-caption ${metaClass}`}>
            Lesson {lessonNumber}
          </Text>
          <Text
            className={`font-poppins-semibold text-h4 mt-0.5 ${titleClass}`}
            numberOfLines={1}
          >
            {lesson.title}
          </Text>

          {status === "in-progress" ? (
            <View className="mt-2 self-start rounded-full bg-warning px-3 py-1">
              <Text className="font-poppins-bold text-caption text-text-primary">
                In progress
              </Text>
            </View>
          ) : (
            <Text className="font-poppins text-body-sm text-text-secondary mt-0.5">
              {lesson.vocabulary.length} words · {lesson.xpReward} XP
            </Text>
          )}
        </View>

        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {status === "completed" ? (
          <View className="ml-2.5 h-8 w-8 items-center justify-center rounded-full bg-success">
            <CheckIcon size={15} color="#ffffff" />
          </View>
        ) : null}
      </View>

      {/* Revealed only when this card is selected */}
      {selected ? (
        <Pressable
          onPress={onStart}
          style={[
            styles.startBtn,
            isInProgress ? styles.startBtnOnPurple : styles.startBtnDefault,
          ]}
        >
          <PlayIcon
            size={18}
            color={isInProgress ? "#6c4ef5" : "#ffffff"}
          />
          <Text
            style={[
              styles.startBtnText,
              { color: isInProgress ? "#6c4ef5" : "#ffffff" },
            ]}
          >
            {status === "completed" ? "Practice again" : "Start lesson"}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardBase: {
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
  cardSelected: {
    borderWidth: 2,
    borderColor: "#6c4ef5",
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginLeft: 12,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    height: 46,
    borderRadius: 14,
  },
  startBtnDefault: {
    backgroundColor: "#6c4ef5",
  },
  startBtnOnPurple: {
    backgroundColor: "#ffffff",
  },
  startBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
  },
});

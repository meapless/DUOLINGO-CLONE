import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LessonCard, { type LessonStatus } from "@/components/LessonCard";
import { BookmarkIcon } from "@/components/icons";
import { images } from "@/constants/images";
import { getLanguage } from "@/data/languages";
import { getLessonsByUnit } from "@/data/lessons";
import { getUnitsByLanguage } from "@/data/units";
import { useLessonStore } from "@/store/useLessonStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import type { Lesson, Unit } from "@/types/learning";

type Tab = "lessons" | "practice";

/** Derive per-lesson status from store state. */
function getLessonStatus(
  lesson: Lesson,
  completedLessons: string[],
  inProgressLessonId: string | null,
): LessonStatus {
  if (completedLessons.includes(lesson.id)) return "completed";
  if (inProgressLessonId === lesson.id) return "in-progress";
  return "available";
}

/** Pick the unit to feature: the one that contains the in-progress lesson,
 *  or fall back to the last unit with accessible content. */
function resolveCurrentUnit(
  units: Unit[],
  inProgressLessonId: string | null,
): Unit | undefined {
  if (inProgressLessonId) {
    const found = units.find((u) => u.lessonIds.includes(inProgressLessonId));
    if (found) return found;
  }
  return units[units.length - 1] ?? units[0];
}

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  const code = useLanguageStore((s) => s.selectedLanguage);
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const inProgressLessonId = useLessonStore((s) => s.inProgressLessonId);
  const setInProgress = useLessonStore((s) => s.setInProgress);
  const markCompleted = useLessonStore((s) => s.markCompleted);

  const language = code ? getLanguage(code) : undefined;
  const allUnits = code ? getUnitsByLanguage(code) : [];
  const currentUnit = resolveCurrentUnit(allUnits, inProgressLessonId);
  const unitLessons = currentUnit ? getLessonsByUnit(currentUnit.id) : [];

  const completedCount = unitLessons.filter((l) =>
    completedLessons.includes(l.id),
  ).length;

  function handleLessonPress(lesson: Lesson) {
    const status = getLessonStatus(lesson, completedLessons, inProgressLessonId);

    if (status === "completed") {
      Alert.alert(lesson.title, "You've completed this lesson! Would you like to review it?", [
        { text: "Not now", style: "cancel" },
        { text: "Review", onPress: () => Alert.alert("Coming soon", "Lesson review is coming in the next update!") },
      ]);
      return;
    }

    if (status === "in-progress") {
      Alert.alert("Continue lesson", `Resume "${lesson.title}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => Alert.alert("Coming soon", "The lesson player is coming in the next update!") },
      ]);
      return;
    }

    // available — set it as in progress
    Alert.alert("Start lesson", `Start "${lesson.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        onPress: () => {
          setInProgress(lesson.id);
          Alert.alert("Coming soon", "The lesson player is coming in the next update!");
        },
      },
    ]);
  }

  if (!code || !currentUnit) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Image source={images.mascotWelcome} style={styles.emptyMascot} resizeMode="contain" />
          <Text className="heading--h3 mt-6 text-center">Pick a language first</Text>
          <Text className="body--sm mt-2 text-center">
            Go to your profile to choose the language you want to learn.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* ── Top action bar ── */}
      <View className="flex-row items-center justify-end px-5 pt-2 pb-1">
        <View className="flex-row items-center">
          {language ? (
            <Image
              source={{ uri: language.flag }}
              style={styles.flag}
              resizeMode="cover"
            />
          ) : null}
          <View className="ml-3">
            <BookmarkIcon size={22} color="#001328" />
          </View>
        </View>
      </View>

      {/* ── Unit illustration ── */}
      <View style={styles.illustrationWrap}>
        <Image
          source={images.mascotWelcome}
          style={styles.mascot}
          resizeMode="contain"
        />
      </View>

      {/* ── Unit title + progress ── */}
      <View className="px-6 pt-4 pb-3">
        <Text className="heading--h2 text-center">{currentUnit.title}</Text>
        <Text className="body--sm text-center mt-1">
          Unit {currentUnit.order} · {completedCount} / {unitLessons.length} lessons
        </Text>
      </View>

      {/* ── Lessons / Practice tabs ── */}
      <View style={styles.tabRow}>
        {(["lessons", "practice"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab && styles.tabLabelActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {/* ── Content ── */}
      {activeTab === "lessons" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {unitLessons.map((lesson, index) => {
            const status = getLessonStatus(lesson, completedLessons, inProgressLessonId);
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                lessonNumber={index + 1}
                status={status}
                onPress={() => handleLessonPress(lesson)}
              />
            );
          })}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="heading--h3 text-center">Practice coming soon</Text>
          <Text className="body--sm mt-2 text-center">
            Timed challenges and review exercises will appear here.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  flag: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  illustrationWrap: {
    alignItems: "center",
    backgroundColor: "#dff0ff",
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 16,
  },
  mascot: {
    width: 140,
    height: 120,
  },
  emptyMascot: {
    width: 160,
    height: 160,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginHorizontal: 24,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabel: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#6b7280",
  },
  tabLabelActive: {
    color: "#6c4ef5",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "10%",
    right: "10%",
    height: 2,
    borderRadius: 1,
    backgroundColor: "#6c4ef5",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
});

import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";

import LessonCard, { type LessonStatus } from "@/components/LessonCard";
import { BookmarkIcon, ChevronLeftIcon } from "@/components/icons";
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
  const router = useRouter();
  const posthog = usePostHog();
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  const code = useLanguageStore((s) => s.selectedLanguage);
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const inProgressLessonId = useLessonStore((s) => s.inProgressLessonId);
  const setInProgress = useLessonStore((s) => s.setInProgress);

  const language = code ? getLanguage(code) : undefined;
  const allUnits = code ? getUnitsByLanguage(code) : [];
  const currentUnit = resolveCurrentUnit(allUnits, inProgressLessonId);
  const unitLessons = currentUnit ? getLessonsByUnit(currentUnit.id) : [];

  const completedCount = unitLessons.filter((l) =>
    completedLessons.includes(l.id),
  ).length;

  function handleLessonPress(lesson: Lesson) {
    const status = getLessonStatus(lesson, completedLessons, inProgressLessonId);
    posthog?.capture("lesson_opened", {
      lesson_id: lesson.id,
      language_code: code,
      status,
    });

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
      {/* ── Header: back · title/subtitle · bookmark ── */}
      <View className="flex-row items-center px-5 pt-1 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={10} className="pr-2">
          <ChevronLeftIcon size={26} color="#001328" />
        </Pressable>

        <View className="flex-1 px-1">
          <Text className="font-poppins-bold text-h3 text-text-primary" numberOfLines={1}>
            {currentUnit.title}
          </Text>
          <Text className="font-poppins-medium text-body-sm text-text-secondary">
            Unit {currentUnit.order} · {completedCount} / {unitLessons.length} lessons
          </Text>
        </View>

        <Pressable hitSlop={10} className="pl-2">
          <BookmarkIcon size={24} color={inProgressLessonId ? "#6c4ef5" : "#001328"} />
        </Pressable>
      </View>

      {/* ── Hero scene: sky gradient + castle behind + mascot in front ── */}
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#bfe4ff" />
              <Stop offset="0.7" stopColor="#e6f5ff" />
              <Stop offset="1" stopColor="#eafbef" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
          {/* soft sun */}
          <Circle cx="18%" cy="26%" r="26" fill="#fff3c4" opacity={0.9} />
        </Svg>

        {/* ground strip */}
        <View style={styles.heroGround} />

        {/* castle sits toward the back-right */}
        <Image
          source={images.palace}
          style={styles.heroCastle}
          resizeMode="contain"
        />

        {/* fox mascot waves in the foreground-left */}
        <Image
          source={images.mascotWelcome}
          style={styles.heroMascot}
          resizeMode="contain"
        />

        {/* language flag chip, floating top-right */}
        {language ? (
          <View style={styles.flagChip}>
            <Image source={{ uri: language.flag }} style={styles.flag} resizeMode="cover" />
          </View>
        ) : null}
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
  hero: {
    height: 190,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroGround: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 46,
    backgroundColor: "#c8efce",
  },
  heroCastle: {
    position: "absolute",
    bottom: 4,
    right: 8,
    width: 150,
    height: 150,
  },
  heroMascot: {
    position: "absolute",
    bottom: 0,
    left: 16,
    width: 130,
    height: 150,
  },
  flagChip: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  flag: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    marginTop: 16,
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

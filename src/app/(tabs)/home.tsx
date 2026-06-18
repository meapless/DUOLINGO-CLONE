import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import {
  BellIcon,
  CheckIcon,
  FireIcon,
  HeadphonesIcon,
  LearnIcon,
  SparklesIcon,
} from "@/components/icons";
import { images } from "@/constants/images";
import { getLanguage } from "@/data/languages";
import { getLessonsByLanguage } from "@/data/lessons";
import { getUnitsByLanguage } from "@/data/units";
import { useLanguageStore } from "@/store/useLanguageStore";
import { colors } from "@/theme/tokens";
import type { LanguageCode, Level } from "@/types/learning";

/** Greeting word shown in the header, in the language being learned. */
const GREETINGS: Record<LanguageCode, string> = {
  es: "Hola",
  fr: "Bonjour",
  de: "Hallo",
  ja: "こんにちは",
  ko: "안녕",
  zh: "你好",
};

/** A single row in the "Today's plan" list. */
type PlanItem = {
  key: string;
  title: string;
  subtitle: string;
  Icon: (props: { size?: number; color?: string }) => React.ReactNode;
  bg: string;
  done: boolean;
};

/** CEFR-style level label derived from a unit's difficulty. */
const LEVEL_LABELS: Record<Level, string> = {
  beginner: "A1",
  intermediate: "B1",
  advanced: "C1",
};

// Local progress values for now — these will move to a Zustand XP/streak store
// in a later step. Kept simple so the home screen renders end-to-end today.
const DAILY_XP = 15;
const DAILY_GOAL = 20;
const STREAK_DAYS = 12;

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const posthog = usePostHog();

  const code = useLanguageStore((s) => s.selectedLanguage);
  const language = code ? getLanguage(code) : undefined;
  const units = code ? getUnitsByLanguage(code) : [];
  const lessons = code ? getLessonsByLanguage(code) : [];

  const currentUnit = units[0];
  const hello = code ? GREETINGS[code] : "Hi";
  const firstName = user?.firstName ?? "there";

  const goalPercent = Math.min(100, Math.round((DAILY_XP / DAILY_GOAL) * 100));

  // ── Today's plan: the three core daily activities. Content comes from the
  // selected language's lesson data, with fallbacks so every language renders
  // all three rows even if it has no AI-conversation lesson yet. ──
  const totalWords = lessons.reduce((sum, l) => sum + l.vocabulary.length, 0);
  const conversation = lessons.find((l) => l.type === "aiTeacher");
  const firstLesson = lessons.find((l) => l.type !== "aiTeacher") ?? lessons[0];

  const plan: PlanItem[] = [
    {
      key: "lesson",
      title: "Lesson",
      subtitle: firstLesson?.title ?? "Start your first lesson",
      Icon: LearnIcon,
      bg: colors.lingua.purple,
      done: true,
    },
    {
      key: "conversation",
      title: "AI Conversation",
      subtitle: conversation?.description ?? "Talk about your day",
      Icon: HeadphonesIcon,
      bg: colors.lingua.blue,
      done: false,
    },
    {
      key: "new-words",
      title: "New words",
      subtitle: `${totalWords} words`,
      Icon: SparklesIcon,
      bg: "#ff6f61",
      done: false,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }}
      >
        {/* ── Header: greeting + streak + notifications ── */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            {language ? (
              <Image
                source={{ uri: language.flag }}
                className="h-8 w-8 rounded-full"
                resizeMode="cover"
              />
            ) : null}
            <Text
              className="ml-2.5 font-poppins-semibold text-[17px] text-text-primary"
              numberOfLines={1}
            >
              {hello}, {firstName}! 👋
            </Text>
          </View>

          <View className="ml-3 flex-row items-center">
            <View className="flex-row items-center">
              <FireIcon size={20} color={colors.semantic.streak} />
              <Text className="ml-1 font-poppins-bold text-body-md text-text-primary">
                {STREAK_DAYS}
              </Text>
            </View>
            <Pressable className="ml-4" hitSlop={8}>
              <BellIcon size={22} color={colors.neutral.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ── Daily goal ── */}
        <View className="mt-6 rounded-[24px] bg-[#fdf0e6] p-5">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="font-poppins-medium text-body-md text-text-secondary">
                Daily goal
              </Text>
              <View className="mt-1 flex-row items-baseline">
                <Text className="font-poppins-bold text-h1 text-text-primary">
                  {DAILY_XP}
                </Text>
                <Text className="ml-1.5 font-poppins-medium text-body-md text-text-secondary">
                  / {DAILY_GOAL} XP
                </Text>
              </View>
            </View>
            <Image source={images.treasure} className="h-16 w-16" resizeMode="contain" />
          </View>

          <View className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#f6d9bf]">
            <View
              style={{ width: `${goalPercent}%` }}
              className="h-full rounded-full bg-streak"
            />
          </View>
        </View>

        {/* ── Continue learning ── */}
        <View className="mt-5 overflow-hidden rounded-[24px]">
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="continueGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.lingua.purple} />
                <Stop offset="1" stopColor={colors.lingua.blue} />
              </SvgLinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#continueGrad)" />
          </Svg>

          <Image
            source={images.palace}
            className="absolute -bottom-1 right-1 h-40 w-40"
            resizeMode="contain"
          />

          <View className="p-5 pr-32">
            <Text className="font-poppins-medium text-body-sm text-white/80">
              Continue learning
            </Text>
            <Text className="mt-1 font-poppins-bold text-h1 text-white">
              {language?.name ?? "Your language"}
            </Text>
            {currentUnit ? (
              <Text className="mt-0.5 font-poppins-medium text-body-md text-white/80">
                {LEVEL_LABELS[currentUnit.level]} · Unit {currentUnit.order}
              </Text>
            ) : null}

            <Pressable
              onPress={() => {
                posthog?.capture("lesson_continued", {
                  language_code: code,
                  unit_order: currentUnit?.order,
                });
                router.push("/learn");
              }}
              className="mt-4 self-start rounded-full bg-white px-7 py-3"
            >
              <Text className="font-poppins-bold text-body-md text-lingua-purple">
                Continue
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Today's plan ── */}
        <View className="mt-7 flex-row items-center justify-between">
          <Text className="heading--h3">Today&apos;s plan</Text>
          <Pressable onPress={() => router.push("/learn")} hitSlop={8}>
            <Text className="font-poppins-semibold text-body-md text-lingua-purple">
              View all
            </Text>
          </Pressable>
        </View>

        <View className="mt-2">
          {plan.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                posthog?.capture("plan_item_tapped", {
                  item_key: item.key,
                  item_title: item.title,
                  language_code: code,
                });
                router.push("/learn");
              }}
              className="flex-row items-center py-3"
            >
              <View
                style={{ backgroundColor: item.bg }}
                className="h-12 w-12 items-center justify-center rounded-[14px]"
              >
                <item.Icon size={22} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-poppins-semibold text-body-lg text-text-primary">
                  {item.title}
                </Text>
                <Text className="body--sm" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              {item.done ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-lingua-purple">
                  <CheckIcon size={15} color="#ffffff" />
                </View>
              ) : (
                <View className="h-7 w-7 rounded-full border-2 border-border" />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

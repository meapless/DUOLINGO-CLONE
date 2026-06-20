import { useUser } from "@clerk/expo";
import {
  CallingState,
  StreamCall,
  StreamVideo,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import {
  BellIcon,
  CameraIcon,
  ChevronLeftIcon,
  MicIcon,
  PhoneIcon,
  SpeakerIcon,
  SubtitlesIcon,
  VideoIcon,
} from "@/components/icons";
import { images } from "@/constants/images";
import { getLesson, getLessonsByLanguage } from "@/data/lessons";
import { useAudioLessonCall } from "@/hooks/useAudioLessonCall";
import { useLanguageStore } from "@/store/useLanguageStore";
import { colors } from "@/theme/tokens";
import type { LanguageCode, Lesson } from "@/types/learning";

/** A single thing the AI teacher "says" — target text plus its translation. */
type TeacherLine = { text: string; translation?: string };

/** Friendly opener per language so the session starts like the design bubble. */
const PRAISE: Record<LanguageCode, TeacherLine> = {
  es: { text: "¡Muy bien! 👏", translation: "That was great!" },
  fr: { text: "Très bien ! 👏", translation: "That was great!" },
  de: { text: "Sehr gut! 👏", translation: "That was great!" },
  ja: { text: "とても良い！👏", translation: "That was great!" },
  ko: { text: "아주 좋아요! 👏", translation: "That was great!" },
  zh: { text: "很好！👏", translation: "That was great!" },
};

/** Mocked end-of-turn feedback shown under the controls. */
const FEEDBACK: { label: string; value: string; color: string }[] = [
  { label: "Speaking", value: "Excellent", color: colors.lingua.green },
  { label: "Pronunciation", value: "Great", color: colors.lingua.green },
  { label: "Grammar", value: "Good", color: colors.lingua.green },
];

/** High-level connection status shown in the header. */
type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "error";

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; color: string }
> = {
  connecting: { label: "Connecting…", color: colors.semantic.streak },
  connected: { label: "Connected", color: colors.semantic.success },
  reconnecting: { label: "Reconnecting…", color: colors.semantic.streak },
  ended: { label: "Call ended", color: colors.neutral.textSecondary },
  error: { label: "Connection failed", color: colors.semantic.error },
};

/** Resolve which lesson to teach: the tapped one, else a sensible default. */
function resolveLesson(
  lessonId: string | undefined,
  code: LanguageCode | null,
): Lesson | undefined {
  if (lessonId) {
    const found = getLesson(lessonId);
    if (found) return found;
  }
  const langLessons = code ? getLessonsByLanguage(code) : [];
  return (
    langLessons.find((l) => l.type === "aiTeacher") ??
    langLessons.find((l) => l.phrases.length > 0) ??
    langLessons[0]
  );
}

/** Build the teacher's spoken lines from the lesson's content. */
function buildTeacherLines(lesson: Lesson, code: LanguageCode): TeacherLine[] {
  const lines: TeacherLine[] = [PRAISE[code]];

  // AI teacher context: open with the conversation starters.
  lesson.aiTeacherPrompt?.conversationStarters.forEach((text) =>
    lines.push({ text }),
  );

  // Phrases the learner is practising (target + translation).
  lesson.phrases.forEach((p) =>
    lines.push({ text: p.text, translation: p.translation }),
  );

  // Fall back to vocabulary so non-phrase lessons still have something to say.
  if (lines.length === 1) {
    lesson.vocabulary.forEach((v) =>
      lines.push({ text: v.word, translation: v.translation }),
    );
  }

  return lines;
}

export default function AITeacherScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useUser();

  const code = useLanguageStore((s) => s.selectedLanguage);
  const lesson = resolveLesson(lessonId, code);

  // lessonCode is derived from the lesson id prefix, falling back to the selected language.
  const lessonCode = (lesson?.id.split("-")[0] as LanguageCode) ?? code;

  // Stream audio call lifecycle for this lesson (token → client → join).
  const { client, call, phase, error, endCall, retry } = useAudioLessonCall({
    lessonId: lesson?.id,
    languageCode: lessonCode ?? undefined,
    lessonTitle: lesson?.title,
  });

  useEffect(() => {
    if (lesson) {
      posthog?.capture("audio_lesson_opened", {
        lesson_id: lesson.id,
        lesson_type: lesson.type,
        language_code: lessonCode,
      });
    }
  }, [lesson, lessonCode, posthog]);

  const dismiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/learn");
    }
  }, [router]);

  // When the user returns to this tab after ending a call, restart the session.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useFocusEffect(
    useCallback(() => {
      if (phaseRef.current === "ended") {
        retry();
      }
    }, [retry]),
  );

  const leaveAndDismiss = useCallback(async () => {
    posthog?.capture("audio_lesson_call_ended", { lesson_id: lesson?.id ?? "" });
    await endCall();
    dismiss();
  }, [endCall, dismiss, posthog, lesson?.id]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Image
            source={images.mascotWelcome}
            style={styles.emptyMascot}
            resizeMode="contain"
          />
          <Text className="heading--h3 mt-6 text-center">No lesson selected</Text>
          <Text className="body--sm mt-2 text-center">
            Pick a lesson from the Learn tab to start an audio session.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error / ended before a call is live: render the static layout with the
  // matching status and a retry affordance — no Stream providers needed.
  if (phase === "error" || !client || !call) {
    return (
      <AudioLessonView
        lesson={lesson}
        lessonCode={lessonCode ?? "es"}
        userName={user?.fullName}
        userImage={user?.imageUrl}
        status={phase === "error" ? "error" : "connecting"}
        errorMessage={phase === "error" ? error : null}
        micEnabled={false}
        isSpeakingWhileMuted={false}
        canToggleMic={false}
        onToggleMic={() => {}}
        onEndCall={leaveAndDismiss}
        onRetry={retry}
      />
    );
  }

  // Call is live: provide the client + call and let the bound view read state.
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallBoundView
          lesson={lesson}
          lessonCode={lessonCode ?? "es"}
          userName={user?.fullName}
          userImage={user?.imageUrl}
          onEndCall={leaveAndDismiss}
          onRetry={retry}
        />
      </StreamCall>
    </StreamVideo>
  );
}

/** Reads live call/mic state from the SDK and feeds the presentational view. */
function CallBoundView({
  lesson,
  lessonCode,
  userName,
  userImage,
  onEndCall,
  onRetry,
}: {
  lesson: Lesson;
  lessonCode: LanguageCode;
  userName: string | null | undefined;
  userImage: string | null | undefined;
  onEndCall: () => void;
  onRetry: () => void;
}) {
  const call = useCall();
  const posthog = usePostHog();
  const { useCallCallingState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();

  // Map the SDK's calling state onto our header status.
  const status: ConnectionStatus =
    callingState === CallingState.JOINED
      ? "connected"
      : callingState === CallingState.RECONNECTING ||
          callingState === CallingState.RECONNECTING_FAILED ||
          callingState === CallingState.OFFLINE
        ? "reconnecting"
        : callingState === CallingState.LEFT
          ? "ended"
          : "connecting";

  useEffect(() => {
    if (status === "connected") {
      posthog?.capture("audio_lesson_call_joined", { lesson_id: lesson.id });
    }
  }, [status, posthog, lesson.id]);

  const toggleMic = useCallback(() => {
    call?.microphone.toggle().catch((e) => console.error("mic toggle", e));
  }, [call]);

  return (
    <AudioLessonView
      lesson={lesson}
      lessonCode={lessonCode}
      userName={userName}
      userImage={userImage}
      status={status}
      errorMessage={null}
      micEnabled={micStatus === "enabled"}
      isSpeakingWhileMuted={isSpeakingWhileMuted}
      canToggleMic={status === "connected" || status === "reconnecting"}
      onToggleMic={toggleMic}
      onEndCall={onEndCall}
      onRetry={onRetry}
    />
  );
}

/** Pure presentational audio-lesson screen. Owns only local UI toggles. */
function AudioLessonView({
  lesson,
  lessonCode,
  userName,
  userImage,
  status,
  errorMessage,
  micEnabled,
  isSpeakingWhileMuted,
  canToggleMic,
  onToggleMic,
  onEndCall,
  onRetry,
}: {
  lesson: Lesson;
  lessonCode: LanguageCode;
  userName: string | null | undefined;
  userImage: string | null | undefined;
  status: ConnectionStatus;
  errorMessage: string | null;
  micEnabled: boolean;
  isSpeakingWhileMuted: boolean;
  canToggleMic: boolean;
  onToggleMic: () => void;
  onEndCall: () => void;
  onRetry: () => void;
}) {
  const teacherLines = useMemo(
    () => buildTeacherLines(lesson, lessonCode),
    [lesson, lessonCode],
  );

  const [lineIndex, setLineIndex] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  // Gentle breathing pulse behind the teacher so the screen feels alive.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.18 }],
    opacity: 0.35 - pulse.value * 0.3,
  }));

  const statusMeta = STATUS_META[status];
  const isConnecting = status === "connecting";
  const firstName = userName?.split(" ")[0];
  const line = teacherLines[lineIndex] ?? teacherLines[0];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* ── Header: back · status · video/bell ── */}
      <View className="flex-row items-center px-5 pt-1 pb-3">
        <Pressable onPress={onEndCall} hitSlop={8}>
          <ChevronLeftIcon size={26} color={colors.neutral.textPrimary} />
        </Pressable>

        <View className="ml-2 flex-1">
          <Text className="font-poppins-semibold text-h4 text-text-primary">
            AI Teacher
          </Text>
          <View className="mt-0.5 flex-row items-center">
            <View
              style={[styles.statusDot, { backgroundColor: statusMeta.color }]}
            />
            <Text
              className="ml-1.5 font-poppins-medium text-caption"
              style={{ color: statusMeta.color }}
            >
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="mr-4">
            <VideoIcon size={24} color={colors.neutral.textPrimary} />
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>12</Text>
            </View>
          </View>
          <BellIcon size={22} color={colors.neutral.textPrimary} />
        </View>
      </View>

      {/* ── Teacher stage ── */}
      <View style={styles.stage}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <SvgLinearGradient id="stageGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#eef0ff" />
              <Stop offset="1" stopColor="#e3f1ff" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#stageGrad)" />
        </Svg>

        {/* User name badge */}
        <View style={styles.nameBadge}>
          {userImage ? (
            <Image
              source={{ uri: userImage }}
              style={styles.nameBadgeImg}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.nameBadgeLetter}>
              {firstName?.[0]?.toUpperCase() ?? "U"}
            </Text>
          )}
          <View style={styles.nameBadgeLabel}>
            <Text style={styles.nameBadgeLabelText} numberOfLines={1}>
              {firstName ?? "You"}
            </Text>
          </View>
        </View>

        {/* Teacher avatar */}
        <View className="flex-1 items-center justify-center">
          <Animated.View style={[styles.pulseRing, ringStyle]} />
          <View style={styles.avatarWrap}>
            <Image
              source={images.mascotWelcome}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          {isConnecting ? (
            <View style={styles.connectingPill}>
              <ActivityIndicator size="small" color={colors.lingua.purple} />
              <Text style={styles.connectingText}>Connecting your audio…</Text>
            </View>
          ) : null}
        </View>

        {/* Speaking-while-muted hint */}
        {isSpeakingWhileMuted ? (
          <View style={styles.mutedHint}>
            <Text style={styles.mutedHintText}>You&apos;re muted</Text>
          </View>
        ) : null}

        {/* Error banner with retry, or the teacher response bubble */}
        {status === "error" ? (
          <View style={styles.bubble}>
            <View className="flex-1">
              <Text className="font-poppins-semibold text-body-md text-text-primary">
                Couldn&apos;t connect
              </Text>
              <Text className="mt-0.5 font-poppins text-body-sm text-text-secondary">
                {errorMessage ?? "Please check your connection and try again."}
              </Text>
            </View>
            <Pressable onPress={onRetry} hitSlop={8} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.bubble}>
            <View className="flex-1">
              <Text className="font-poppins-semibold text-body-lg text-text-primary">
                {line.text}
              </Text>
              {subtitlesOn && line.translation ? (
                <Text className="mt-0.5 font-poppins text-body-sm text-text-secondary">
                  {line.translation}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => setLineIndex((i) => (i + 1) % teacherLines.length)}
              hitSlop={8}
              style={styles.speakerBtn}
            >
              <SpeakerIcon size={20} color={colors.lingua.purple} />
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Controls ── */}
      <View className="flex-row justify-around px-6 pt-5">
        <ControlButton
          Icon={CameraIcon}
          label="Camera"
          onPress={() => setCameraOn((v) => !v)}
          dim={!cameraOn}
        />
        <ControlButton
          Icon={MicIcon}
          label={micEnabled ? "Mic" : "Muted"}
          onPress={onToggleMic}
          alert={!micEnabled}
          dim={!canToggleMic}
        />
        <ControlButton
          Icon={SubtitlesIcon}
          label="Subtitles"
          onPress={() => setSubtitlesOn((v) => !v)}
          dim={!subtitlesOn}
        />
        <ControlButton Icon={PhoneIcon} label="End Call" onPress={onEndCall} end />
      </View>

      {/* ── Feedback ── */}
      <View className="flex-row px-5 pt-5 pb-3" style={styles.feedbackRow}>
        {FEEDBACK.map((item) => (
          <View key={item.label} style={styles.feedbackCard} className="flex-1">
            <Text className="font-poppins-medium text-caption text-text-secondary">
              {item.label}
            </Text>
            <Text
              className="mt-1 font-poppins-semibold text-body-md"
              style={{ color: item.color }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

/** One round control button with a label underneath. */
function ControlButton({
  Icon,
  label,
  onPress,
  end,
  alert,
  dim,
}: {
  Icon: (props: { size?: number; color?: string }) => React.ReactNode;
  label: string;
  onPress: () => void;
  end?: boolean;
  alert?: boolean;
  dim?: boolean;
}) {
  const iconColor = end
    ? "#ffffff"
    : alert
      ? colors.semantic.error
      : dim
        ? "#9aa0ab"
        : colors.neutral.textPrimary;

  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        style={[
          styles.control,
          end && styles.controlEnd,
          alert && styles.controlAlert,
        ]}
      >
        <Icon size={24} color={iconColor} />
      </Pressable>
      <Text className="mt-2 font-poppins-medium text-caption text-text-secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  emptyMascot: {
    width: 160,
    height: 160,
  },
  statusDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  videoBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.lingua.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#ffffff",
  },
  stage: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
  },
  nameBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 76,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a6b5c",
    alignItems: "center",
    justifyContent: "center",
  },
  nameBadgeLetter: {
    fontFamily: "Poppins-Bold",
    fontSize: 38,
    color: "#ffffff",
  },
  nameBadgeImg: {
    width: "100%",
    height: "100%",
  },
  nameBadgeLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: "center",
  },
  nameBadgeLabelText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 11,
    color: "#ffffff",
  },
  pulseRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.lingua.purple,
  },
  avatarWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  avatar: {
    width: 150,
    height: 150,
  },
  connectingPill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  connectingText: {
    marginLeft: 8,
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },
  mutedHint: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: colors.semantic.error,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  mutedHintText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#ffffff",
  },
  bubble: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  speakerBtn: {
    marginLeft: 12,
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1eeff",
  },
  retryBtn: {
    marginLeft: 12,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lingua.purple,
  },
  retryText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#ffffff",
  },
  control: {
    height: 58,
    width: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  controlEnd: {
    backgroundColor: colors.semantic.error,
    shadowColor: colors.semantic.error,
    shadowOpacity: 0.35,
  },
  controlAlert: {
    backgroundColor: "#ffe9e9",
  },
  feedbackRow: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});

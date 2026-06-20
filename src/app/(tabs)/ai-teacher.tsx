import {
  CallingState,
  StreamCall,
  StreamVideo,
  useCall,
  useCallStateHooks,
  type CallClosedCaption,
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

/** Stream user ID assigned to the Vision Agent in session+api.ts and agent.py */
const TEACHER_USER_ID = "lingua-teacher";

type TeacherLine = { text: string; translation?: string };

const PRAISE: Record<LanguageCode, TeacherLine> = {
  es: { text: "¡Muy bien! 👏", translation: "That was great!" },
  fr: { text: "Très bien ! 👏", translation: "That was great!" },
  de: { text: "Sehr gut! 👏", translation: "That was great!" },
  ja: { text: "とても良い！👏", translation: "That was great!" },
  ko: { text: "아주 좋아요! 👏", translation: "That was great!" },
  zh: { text: "很好！👏", translation: "That was great!" },
};

const FEEDBACK: { label: string; value: string; color: string }[] = [
  { label: "Speaking", value: "Excellent", color: colors.lingua.green },
  { label: "Pronunciation", value: "Great", color: colors.lingua.green },
  { label: "Grammar", value: "Good", color: colors.lingua.green },
];

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended"
  | "error";

const AGENT_STATUS_META: Record<
  import("@/hooks/useAudioLessonCall").AgentStatus,
  { label: string; color: string }
> = {
  idle: { label: "Waiting for teacher…", color: colors.neutral.textSecondary },
  connecting: { label: "Teacher joining…", color: colors.semantic.streak },
  connected: { label: "Teacher connected", color: colors.semantic.success },
  failed: { label: "Teacher unavailable", color: colors.semantic.error },
};

const STATUS_META: Record<ConnectionStatus, { label: string; color: string }> =
  {
    connecting: { label: "Connecting…", color: colors.semantic.streak },
    connected: { label: "Connected", color: colors.semantic.success },
    reconnecting: { label: "Reconnecting…", color: colors.semantic.streak },
    ended: { label: "Call ended", color: colors.neutral.textSecondary },
    error: { label: "Connection failed", color: colors.semantic.error },
  };

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

function buildTeacherLines(lesson: Lesson, code: LanguageCode): TeacherLine[] {
  const lines: TeacherLine[] = [PRAISE[code]];

  lesson.aiTeacherPrompt?.conversationStarters.forEach((text) =>
    lines.push({ text }),
  );

  lesson.phrases.forEach((p) =>
    lines.push({ text: p.text, translation: p.translation }),
  );

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

  const code = useLanguageStore((s) => s.selectedLanguage);
  const lesson = resolveLesson(lessonId, code);

  const lessonCode = (lesson?.id.split("-")[0] as LanguageCode) ?? code;

  const { client, call, phase, error, endCall, retry, agentStatus } =
    useAudioLessonCall({
      lessonId: lesson?.id,
      languageCode: lessonCode ?? undefined,
      lessonTitle: lesson?.title,
      goals: lesson?.goals,
      vocabulary: lesson?.vocabulary.map((v) => ({
        word: v.word,
        translation: v.translation,
      })),
      phrases: lesson?.phrases.map((p) => ({
        text: p.text,
        translation: p.translation,
      })),
      aiTeacherPrompt: lesson?.aiTeacherPrompt ?? null,
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

  // Restart the session when the user returns to this tab after ending a call.
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
    posthog?.capture("audio_lesson_call_ended", {
      lesson_id: lesson?.id ?? "",
    });
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

  if (phase === "error" || !client || !call) {
    return (
      <AudioLessonView
        lesson={lesson}
        lessonCode={lessonCode ?? "es"}
        status={phase === "error" ? "error" : "connecting"}
        agentStatus={agentStatus}
        errorMessage={phase === "error" ? error : null}
        micEnabled={false}
        isSpeakingWhileMuted={false}
        canToggleMic={false}
        onMicPressIn={() => {}}
        onMicPressOut={() => {}}
        onEndCall={leaveAndDismiss}
        onRetry={retry}
      />
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallBoundView
          lesson={lesson}
          lessonCode={lessonCode ?? "es"}
          agentStatus={agentStatus}
          onEndCall={leaveAndDismiss}
          onRetry={retry}
        />
      </StreamCall>
    </StreamVideo>
  );
}

function CallBoundView({
  lesson,
  lessonCode,
  agentStatus,
  onEndCall,
  onRetry,
}: {
  lesson: Lesson;
  lessonCode: LanguageCode;
  agentStatus: import("@/hooks/useAudioLessonCall").AgentStatus;
  onEndCall: () => void;
  onRetry: () => void;
}) {
  const call = useCall();
  const posthog = usePostHog();
  const {
    useCallCallingState,
    useMicrophoneState,
    useCallClosedCaptions,
    useIsCallCaptioningInProgress,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();
  const closedCaptions = useCallClosedCaptions();
  const captioningInProgress = useIsCallCaptioningInProgress();

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

  // Start closed captions when the call is joined; stop on leave/unmount.
  useEffect(() => {
    if (status !== "connected" || !call) return;
    call
      .startClosedCaptions()
      .catch((e) => console.warn("startClosedCaptions:", e));
    return () => {
      call.stopClosedCaptions().catch(() => {});
    };
  }, [status, call]);

  const enableMic = useCallback(() => {
    call?.microphone.enable().catch((e) => console.error("mic enable", e));
  }, [call]);

  const disableMic = useCallback(() => {
    call?.microphone.disable().catch((e) => console.error("mic disable", e));
  }, [call]);

  return (
    <AudioLessonView
      lesson={lesson}
      lessonCode={lessonCode}
      status={status}
      agentStatus={agentStatus}
      errorMessage={null}
      micEnabled={micStatus === "enabled"}
      isSpeakingWhileMuted={isSpeakingWhileMuted}
      canToggleMic={status === "connected" || status === "reconnecting"}
      onMicPressIn={enableMic}
      onMicPressOut={disableMic}
      onEndCall={onEndCall}
      onRetry={onRetry}
      closedCaptions={closedCaptions}
      captioningInProgress={captioningInProgress}
    />
  );
}

function AudioLessonView({
  lesson,
  lessonCode,
  status,
  agentStatus,
  errorMessage,
  micEnabled,
  isSpeakingWhileMuted,
  canToggleMic,
  onMicPressIn,
  onMicPressOut,
  onEndCall,
  onRetry,
  closedCaptions = [],
  captioningInProgress = false,
}: {
  lesson: Lesson;
  lessonCode: LanguageCode;
  status: ConnectionStatus;
  agentStatus: import("@/hooks/useAudioLessonCall").AgentStatus;
  errorMessage: string | null;
  micEnabled: boolean;
  isSpeakingWhileMuted: boolean;
  canToggleMic: boolean;
  onMicPressIn: () => void;
  onMicPressOut: () => void;
  onEndCall: () => void;
  onRetry: () => void;
  closedCaptions?: CallClosedCaption[];
  captioningInProgress?: boolean;
}) {
  const teacherLines = useMemo(
    () => buildTeacherLines(lesson, lessonCode),
    [lesson, lessonCode],
  );

  const [lineIndex, setLineIndex] = useState(0);
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800 }), -1, true);
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.14 }],
    opacity: 0.35 - pulse.value * 0.25,
  }));

  const statusMeta = STATUS_META[status];
  const agentMeta = AGENT_STATUS_META[agentStatus];
  const isConnecting = status === "connecting";
  const line = teacherLines[lineIndex] ?? teacherLines[0];

  // Show live captions only when subtitles are on and captions are available.
  const showLiveCaptions =
    subtitlesOn && closedCaptions.length > 0 && status !== "error";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-1 pb-2">
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


      {/* Stage */}
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

        {/* Teacher avatar — fills stage and truly centers the mascot */}
        <View className="flex-1 items-center justify-center">
          <Animated.View style={[styles.pulseRing, ringStyle]} />
          <View style={styles.avatarWrap}>
            <Image
              source={images.mascotWelcome}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Connection / agent status pill — anchored above the speech bubble */}
        <View style={styles.pillAnchor}>
          {isConnecting ? (
            <View style={styles.connectingPill}>
              <ActivityIndicator size="small" color={colors.lingua.purple} />
              <Text style={styles.connectingText}>Connecting your audio…</Text>
            </View>
          ) : (
            <View style={[styles.agentPill, { borderColor: agentMeta.color }]}>
              {agentStatus === "connecting" ? (
                <ActivityIndicator
                  size="small"
                  color={agentMeta.color}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <View
                  style={[
                    styles.agentDot,
                    { backgroundColor: agentMeta.color },
                  ]}
                />
              )}
              <Text
                style={[styles.agentPillText, { color: agentMeta.color }]}
              >
                {agentMeta.label}
              </Text>
            </View>
          )}
        </View>

        {/* Speaking-while-muted hint */}
        {isSpeakingWhileMuted ? (
          <View style={styles.mutedHint}>
            <Text style={styles.mutedHintText}>Hold the mic to speak</Text>
          </View>
        ) : null}

        {/* Error banner */}
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
        ) : showLiveCaptions ? (
          /* Live captions overlay — replaces static bubble while captions are active */
          <View style={styles.captionOverlay}>
            {closedCaptions.map((caption) => {
              const isTeacher = caption.speaker_id === TEACHER_USER_ID;
              return (
                <View
                  key={caption.id}
                  style={[
                    styles.captionItem,
                    isTeacher
                      ? styles.captionItemTeacher
                      : styles.captionItemUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.captionSpeaker,
                      {
                        color: isTeacher
                          ? colors.lingua.purple
                          : colors.lingua.green,
                      },
                    ]}
                  >
                    {isTeacher ? "AI Teacher" : "You"}
                  </Text>
                  <Text style={styles.captionText}>{caption.text}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          /* Static teacher line — shown when no live captions */
          <View style={styles.bubble}>
            <View className="flex-1">
              <Text className="font-poppins-semibold text-body-lg text-text-primary">
                {line.text}
              </Text>
              {line.translation ? (
                <Text className="mt-0.5 font-poppins text-body-sm text-text-secondary">
                  {line.translation}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() =>
                setLineIndex((i) => (i + 1) % teacherLines.length)
              }
              hitSlop={8}
              style={styles.speakerBtn}
            >
              <SpeakerIcon size={20} color={colors.lingua.purple} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Controls: subtitles toggle + push-to-speak + end call */}
      <View className="flex-row items-end pt-5 pb-1 px-6">
        <View className="flex-1 items-center">
          <SubtitlesToggleButton
            on={subtitlesOn}
            captioningInProgress={captioningInProgress}
            onPress={() => setSubtitlesOn((v) => !v)}
          />
        </View>
        <View className="flex-1 items-center">
          <PushToSpeakButton
            micEnabled={micEnabled}
            canSpeak={canToggleMic}
            onPressIn={onMicPressIn}
            onPressOut={onMicPressOut}
          />
        </View>
        <View className="flex-1 items-center">
          <EndCallButton onPress={onEndCall} />
        </View>
      </View>

      {/* Feedback */}
      <View className="flex-row px-5 pt-4 pb-3" style={styles.feedbackRow}>
        {FEEDBACK.map((item) => (
          <View
            key={item.label}
            style={styles.feedbackCard}
            className="flex-1"
          >
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

function SubtitlesToggleButton({
  on,
  captioningInProgress,
  onPress,
}: {
  on: boolean;
  captioningInProgress: boolean;
  onPress: () => void;
}) {
  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        style={[styles.subtitlesBtn, on && styles.subtitlesBtnActive]}
        hitSlop={8}
      >
        {captioningInProgress && on ? (
          <View style={styles.captioningDot} />
        ) : null}
        <SubtitlesIcon
          size={22}
          color={on ? colors.lingua.purple : colors.neutral.textSecondary}
        />
      </Pressable>
      <Text className="mt-2 font-poppins-medium text-caption text-text-secondary">
        {on ? "Captions on" : "Captions off"}
      </Text>
    </View>
  );
}

/** Large hold-to-speak button. Enables mic while held, disables on release. */
function PushToSpeakButton({
  micEnabled,
  canSpeak,
  onPressIn,
  onPressOut,
}: {
  micEnabled: boolean;
  canSpeak: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.9, { duration: 100 });
    onPressIn();
  }, [onPressIn, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
    onPressOut();
  }, [onPressOut, scale]);

  return (
    <View className="items-center">
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={canSpeak ? handlePressIn : undefined}
          onPressOut={canSpeak ? handlePressOut : undefined}
          style={[
            styles.pushToSpeakBtn,
            micEnabled && styles.pushToSpeakActive,
            !canSpeak && styles.pushToSpeakDisabled,
          ]}
        >
          <MicIcon
            size={28}
            color={micEnabled ? "#ffffff" : colors.neutral.textPrimary}
          />
        </Pressable>
      </Animated.View>
      <Text className="mt-2 font-poppins-medium text-caption text-text-secondary">
        {micEnabled ? "Speaking…" : "Hold to speak"}
      </Text>
    </View>
  );
}

function EndCallButton({ onPress }: { onPress: () => void }) {
  return (
    <View className="items-center">
      <Pressable onPress={onPress} style={styles.endCallBtn}>
        <PhoneIcon size={24} color="#ffffff" />
      </Pressable>
      <Text className="mt-2 font-poppins-medium text-caption text-text-secondary">
        End Call
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
  pillAnchor: {
    position: "absolute",
    bottom: 108,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.lingua.purple,
  },
  avatarWrap: {
    width: 230,
    height: 230,
    borderRadius: 115,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  avatar: {
    width: 200,
    height: 200,
  },
  connectingPill: {
    flexDirection: "row",
    alignItems: "center",
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
  agentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  agentPillText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
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
  // Static teacher line bubble (shown when no live captions are active)
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
  // Live captions overlay
  captionOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 6,
  },
  captionItem: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 3,
  },
  captionItemTeacher: {
    borderLeftColor: colors.lingua.purple,
  },
  captionItemUser: {
    borderLeftColor: colors.lingua.green,
  },
  captionSpeaker: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  captionText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: colors.neutral.textPrimary,
    lineHeight: 20,
  },
  // Subtitles toggle button
  subtitlesBtn: {
    height: 52,
    width: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.neutral.border + "60",
  },
  subtitlesBtnActive: {
    backgroundColor: "#f1eeff",
    borderColor: colors.lingua.purple + "40",
  },
  captioningDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.lingua.green,
  },
  // Push-to-speak
  pushToSpeakBtn: {
    height: 72,
    width: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.lingua.purple + "40",
  },
  pushToSpeakActive: {
    backgroundColor: colors.lingua.purple,
    borderColor: colors.lingua.purple,
    shadowColor: colors.lingua.purple,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  pushToSpeakDisabled: {
    opacity: 0.45,
  },
  endCallBtn: {
    height: 58,
    width: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.semantic.error,
    shadowColor: colors.semantic.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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

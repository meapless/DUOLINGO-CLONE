import {
  CallingState,
  StreamCall,
  StreamVideo,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-native-sdk";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
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
  MicOffIcon,
  PhoneIcon,
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

/** One accumulated line of the live conversation transcript. */
type TranscriptLine = {
  /** Stable per-utterance key: `${speaker_id}-${start_time}`. */
  key: string;
  isTeacher: boolean;
  text: string;
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

export default function AITeacherScreen() {
  const { lessonId, lessonNumber } = useLocalSearchParams<{ lessonId?: string; lessonNumber?: string }>();
  const router = useRouter();
  const posthog = usePostHog();

  const code = useLanguageStore((s) => s.selectedLanguage);
  const lesson = resolveLesson(lessonId, code);

  const lessonCode = (lesson?.id.split("-")[0] as LanguageCode) ?? code;

  // Stable refs so the unmount cleanup closure always sees the latest values.
  const lessonStartTimeRef = useRef<number>(Date.now());
  const lessonCompletedRef = useRef(false);
  const lessonRef = useRef(lesson);
  const posthogRef = useRef(posthog);
  lessonRef.current = lesson;
  posthogRef.current = posthog;

  // Fire lesson_started once on mount (when lesson resolves).
  const didFireStartRef = useRef(false);
  useEffect(() => {
    if (!lesson || didFireStartRef.current) return;
    didFireStartRef.current = true;
    lessonStartTimeRef.current = Date.now();
    posthog?.capture("lesson_started", {
      lesson_id: lesson.id,
      language: lessonCode ?? "",
      lesson_number: lessonNumber ? parseInt(lessonNumber, 10) : 1,
    });
  }, [lesson, lessonCode, lessonNumber, posthog]);

  // Fire lesson_abandoned on unmount unless the lesson was completed.
  useEffect(() => {
    return () => {
      if (!lessonRef.current || lessonCompletedRef.current) return;
      const elapsed = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
      posthogRef.current?.capture("lesson_abandoned", {
        lesson_id: lessonRef.current.id,
        time_into_lesson_seconds: elapsed,
        last_question_index: 0,
      });
    };
  }, []);

  const { client, call, phase, error, endCall, retry, agentStatus, agentError } =
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

  // Keep a stable ref so the BackHandler closure always calls the latest version.
  const leaveAndDismissRef = useRef(leaveAndDismiss);
  leaveAndDismissRef.current = leaveAndDismiss;

  // Intercept the Android hardware back button while this tab is focused.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        leaveAndDismissRef.current();
        return true; // consume the event — prevent default back behaviour
      });
      return () => sub.remove();
    }, []),
  );

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
        lessonTitle={lesson.title}
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
          lessonTitle={lesson.title}
          agentStatus={agentStatus}
          agentError={agentError}
          onEndCall={leaveAndDismiss}
          onRetry={retry}
        />
      </StreamCall>
    </StreamVideo>
  );
}

function CallBoundView({
  lesson,
  lessonTitle,
  agentStatus,
  agentError,
  onEndCall,
  onRetry,
}: {
  lesson: Lesson;
  lessonTitle: string;
  agentStatus: import("@/hooks/useAudioLessonCall").AgentStatus;
  agentError: string | null;
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
  // Widen the SDK's rolling window so our accumulator never misses an
  // utterance's final text before it expires out of `closedCaptions`.
  useEffect(() => {
    if (status !== "connected" || !call) return;
    call.updateClosedCaptionSettings({
      visibilityDurationMs: 6000,
      maxVisibleCaptions: 6,
    });
    call
      .startClosedCaptions()
      .catch((e) => console.warn("startClosedCaptions:", e));
    return () => {
      call.stopClosedCaptions().catch(() => {});
    };
  }, [status, call]);

  // Accumulate the rolling captions into a persistent transcript so the
  // conversation history stays on screen instead of auto-expiring. Each
  // utterance is keyed by speaker + start time, so streaming partials update
  // the same line in place rather than piling up duplicates.
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  useEffect(() => {
    if (closedCaptions.length === 0) return;
    setTranscript((prev) => {
      const merged = [...prev];
      for (const cap of closedCaptions) {
        const key = `${cap.speaker_id}-${cap.start_time}`;
        const line: TranscriptLine = {
          key,
          isTeacher: cap.speaker_id === TEACHER_USER_ID,
          text: cap.text,
        };
        const i = merged.findIndex((m) => m.key === key);
        if (i >= 0) merged[i] = line;
        else merged.push(line);
      }
      return merged;
    });
  }, [closedCaptions]);

  // Reset the transcript whenever a fresh session starts.
  useEffect(() => {
    if (status === "connecting") setTranscript([]);
  }, [status]);

  const enableMic = useCallback(() => {
    call?.microphone.enable().catch((e) => console.error("mic enable", e));
  }, [call]);

  const disableMic = useCallback(() => {
    call?.microphone.disable().catch((e) => console.error("mic disable", e));
  }, [call]);

  return (
    <AudioLessonView
      lessonTitle={lessonTitle}
      status={status}
      agentStatus={agentStatus}
      agentError={agentError}
      errorMessage={null}
      micEnabled={micStatus === "enabled"}
      isSpeakingWhileMuted={isSpeakingWhileMuted}
      canToggleMic={status === "connected" || status === "reconnecting"}
      onMicPressIn={enableMic}
      onMicPressOut={disableMic}
      onEndCall={onEndCall}
      onRetry={onRetry}
      transcript={transcript}
      captioningInProgress={captioningInProgress}
    />
  );
}

function AudioLessonView({
  lessonTitle,
  status,
  agentStatus,
  agentError,
  errorMessage,
  micEnabled,
  isSpeakingWhileMuted,
  canToggleMic,
  onMicPressIn,
  onMicPressOut,
  onEndCall,
  onRetry,
  transcript = [],
  captioningInProgress = false,
}: {
  lessonTitle?: string;
  status: ConnectionStatus;
  agentStatus: import("@/hooks/useAudioLessonCall").AgentStatus;
  agentError?: string | null;
  errorMessage: string | null;
  micEnabled: boolean;
  isSpeakingWhileMuted: boolean;
  canToggleMic: boolean;
  onMicPressIn: () => void;
  onMicPressOut: () => void;
  onEndCall: () => void;
  onRetry: () => void;
  transcript?: TranscriptLine[];
  captioningInProgress?: boolean;
}) {
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  // Mic mode: open mic (continuous, default) keeps the realtime agent hearing
  // you naturally; push-to-talk only opens the mic while the button is held.
  const [micMode, setMicMode] = useState<"open" | "ptt">("open");

  // Apply the desired mic state whenever the mode changes (or once we can
  // toggle). Open → unmuted; push-to-talk → muted until the button is held.
  // micEnabled is intentionally excluded so a manual mute in open mode sticks.
  useEffect(() => {
    if (!canToggleMic) return;
    if (micMode === "open") onMicPressIn();
    else onMicPressOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micMode, canToggleMic]);

  // Two staggered rings ripple outward; the mascot floats gently above them.
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200 }), -1, false);
    float.value = withRepeat(withTiming(1, { duration: 2600 }), -1, true);
  }, [pulse, float]);

  const ringInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pulse.value * 0.35 }],
    opacity: 0.4 - pulse.value * 0.4,
  }));
  const ringOuterStyle = useAnimatedStyle(() => {
    const p = (pulse.value + 0.5) % 1; // half-phase offset for layered ripple
    return {
      transform: [{ scale: 0.85 + p * 0.45 }],
      opacity: 0.22 - p * 0.22,
    };
  });
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }],
  }));

  const statusMeta = STATUS_META[status];
  const agentMeta = AGENT_STATUS_META[agentStatus];
  const isConnecting = status === "connecting";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-1 pb-2">
        <Pressable onPress={onEndCall} hitSlop={8}>
          <ChevronLeftIcon size={26} color={colors.neutral.textPrimary} />
        </Pressable>

        <View className="ml-2 flex-1">
          <Text className="font-poppins-medium text-caption text-text-secondary">
            AI Teacher
          </Text>
          <Text
            className="font-poppins-semibold text-h4 text-text-primary"
            numberOfLines={1}
          >
            {lessonTitle ?? "Conversation"}
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

        {/* Teacher avatar — hero zone, mascot floats above layered ripple rings */}
        <View className="flex-1 items-center justify-center">
          <View style={styles.haloWrap}>
            <Animated.View style={[styles.pulseRing, ringOuterStyle]} />
            <Animated.View style={[styles.pulseRing, ringInnerStyle]} />
            <Animated.View style={[styles.avatarWrap, floatStyle]}>
              <Image
                source={images.mascotWelcome}
                style={styles.avatar}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Connection / agent status pill — sits just below the mascot */}
          <View style={styles.pillWrap}>
            {isConnecting ? (
              <View style={styles.connectingPill}>
                <ActivityIndicator size="small" color={colors.lingua.purple} />
                <Text style={styles.connectingText}>
                  Connecting your audio…
                </Text>
              </View>
            ) : (
              <View className="items-center">
                <View
                  style={[styles.agentPill, { borderColor: agentMeta.color }]}
                >
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
                {agentStatus === "failed" && agentError ? (
                  <Text
                    className="mt-1.5 font-poppins text-caption text-center px-6"
                    style={{ color: colors.neutral.textSecondary }}
                  >
                    {agentError}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Speaking-while-muted hint */}
        {isSpeakingWhileMuted ? (
          <View style={styles.mutedHint}>
            <Text style={styles.mutedHintText}>Hold the mic to speak</Text>
          </View>
        ) : null}

        {/* Bottom panel: error · live transcript · captions-off hint */}
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
        ) : subtitlesOn ? (
          <TranscriptPanel
            transcript={transcript}
            captioningInProgress={captioningInProgress}
          />
        ) : (
          <View style={styles.captionsOffHint}>
            <SubtitlesIcon size={18} color={colors.neutral.textSecondary} />
            <Text style={styles.captionsOffText}>
              Captions are off · tap to follow along
            </Text>
          </View>
        )}
      </View>

      {/* Mic mode: open mic (default) vs push-to-talk */}
      <View style={styles.modeToggle}>
        {(["open", "ptt"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setMicMode(mode)}
            style={[styles.modeChip, micMode === mode && styles.modeChipActive]}
            hitSlop={6}
          >
            <Text
              style={[
                styles.modeChipText,
                micMode === mode && styles.modeChipTextActive,
              ]}
            >
              {mode === "open" ? "Open mic" : "Hold to talk"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Controls: subtitles toggle + mic + end call */}
      <View className="flex-row items-end pt-2 pb-1 px-6">
        <View className="flex-1 items-center">
          <SubtitlesToggleButton
            on={subtitlesOn}
            captioningInProgress={captioningInProgress}
            onPress={() => setSubtitlesOn((v) => !v)}
          />
        </View>
        <View className="flex-1 items-center">
          <MicButton
            mode={micMode}
            micEnabled={micEnabled}
            canToggle={canToggleMic}
            onEnable={onMicPressIn}
            onDisable={onMicPressOut}
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

/** Persistent, auto-scrolling conversation transcript built from live captions. */
function TranscriptPanel({
  transcript,
  captioningInProgress,
}: {
  transcript: TranscriptLine[];
  captioningInProgress: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);

  if (transcript.length === 0) {
    return (
      <View style={styles.transcriptEmpty}>
        {captioningInProgress ? (
          <View style={styles.transcriptEmptyRow}>
            <View style={styles.listeningDot} />
            <Text style={styles.transcriptEmptyText}>
              Listening… your conversation will appear here
            </Text>
          </View>
        ) : (
          <Text style={styles.transcriptEmptyText}>
            Start speaking — your conversation will appear here
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.transcriptCard}>
      <ScrollView
        ref={scrollRef}
        style={styles.transcriptScroll}
        contentContainerStyle={styles.transcriptContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {transcript.map((line) => (
          <View
            key={line.key}
            style={[
              styles.transcriptRow,
              line.isTeacher
                ? styles.transcriptRowTeacher
                : styles.transcriptRowUser,
            ]}
          >
            <Text
              style={[
                styles.transcriptSpeaker,
                {
                  color: line.isTeacher
                    ? colors.lingua.purple
                    : colors.lingua.green,
                },
              ]}
            >
              {line.isTeacher ? "AI Teacher" : "You"}
            </Text>
            <Text style={styles.transcriptText}>{line.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
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

/**
 * Mic control that adapts to the selected mode:
 *  - "open": tap to mute / unmute a continuously-published track.
 *  - "ptt":  hold to open the mic, release to close it.
 */
function MicButton({
  mode,
  micEnabled,
  canToggle,
  onEnable,
  onDisable,
}: {
  mode: "open" | "ptt";
  micEnabled: boolean;
  canToggle: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isOpen = mode === "open";

  const handleToggleMute = useCallback(() => {
    if (!canToggle) return;
    if (micEnabled) onDisable();
    else onEnable();
  }, [canToggle, micEnabled, onEnable, onDisable]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.9, { duration: 100 });
    onEnable();
  }, [onEnable, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150 });
    onDisable();
  }, [onDisable, scale]);

  const label = isOpen
    ? micEnabled
      ? "Tap to mute"
      : "Muted"
    : micEnabled
      ? "Speaking…"
      : "Hold to speak";

  return (
    <View className="items-center">
      <Animated.View style={animStyle}>
        <Pressable
          onPress={isOpen ? handleToggleMute : undefined}
          onPressIn={!isOpen && canToggle ? handlePressIn : undefined}
          onPressOut={!isOpen && canToggle ? handlePressOut : undefined}
          style={[
            styles.pushToSpeakBtn,
            micEnabled && styles.pushToSpeakActive,
            !canToggle && styles.pushToSpeakDisabled,
          ]}
        >
          {micEnabled ? (
            <MicIcon size={28} color="#ffffff" />
          ) : (
            <MicOffIcon size={28} color={colors.neutral.textPrimary} />
          )}
        </Pressable>
      </Animated.View>
      <Text className="mt-2 font-poppins-medium text-caption text-text-secondary">
        {label}
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
  pillWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  // Fixed-size, centered container so the absolute rings stay concentric
  // with the mascot (absolute children with no insets pin to top-left).
  haloWrap: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 300,
    height: 300,
    borderRadius: 150,
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
  // Error bubble (shown when the call fails)
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
  // Live conversation transcript (persistent, scrollable)
  transcriptCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    maxHeight: 168,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  transcriptScroll: {
    maxHeight: 152,
  },
  transcriptContent: {
    gap: 6,
    paddingVertical: 2,
  },
  transcriptRow: {
    maxWidth: "88%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  transcriptRowTeacher: {
    alignSelf: "flex-start",
    backgroundColor: "#f1eeff",
    borderTopLeftRadius: 4,
  },
  transcriptRowUser: {
    alignSelf: "flex-end",
    backgroundColor: "#e9f8ef",
    borderTopRightRadius: 4,
  },
  transcriptSpeaker: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  transcriptText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: colors.neutral.textPrimary,
    lineHeight: 20,
  },
  transcriptEmpty: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  transcriptEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  transcriptEmptyText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: colors.neutral.textSecondary,
    textAlign: "center",
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: colors.lingua.green,
  },
  captionsOffHint: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  captionsOffText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: colors.neutral.textSecondary,
  },
  // Mic-mode segmented toggle
  modeToggle: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: colors.neutral.surface,
    borderRadius: 999,
    padding: 4,
    marginTop: 8,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  modeChipActive: {
    backgroundColor: colors.lingua.purple,
  },
  modeChipText: {
    fontFamily: "Poppins-Medium",
    fontSize: 12,
    color: colors.neutral.textSecondary,
  },
  modeChipTextActive: {
    color: "#ffffff",
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

/**
 * Owns the Stream audio-call lifecycle for one lesson AND the Vision Agent
 * session that joins as the AI teacher:
 *
 *   fetch token  →  build client  →  create call (server)  →  join (audio-only)
 *   → start agent  →  agent joins call
 *
 * Returns the `client` + `call` to mount under <StreamVideo>/<StreamCall>, a
 * coarse `phase` for the pre-join states, and an `agentStatus` that tracks
 * whether the AI teacher has connected.
 */
import { useAuth, useUser } from "@clerk/expo";
import {
  Call,
  CallingState,
  StreamVideoClient,
  type TokenProvider,
  type User,
} from "@stream-io/video-react-native-sdk";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createLessonCall,
  fetchStreamSession,
  startAgentSession,
  stopAgentSession,
  type AgentPhraseItem,
  type AgentTeacherPrompt,
  type AgentVocabularyItem,
} from "@/lib/stream";

/** Pre-join lifecycle phase. In-call status comes from the SDK hooks. */
export type CallPhase = "connecting" | "ready" | "error" | "ended";

/** Whether the AI teacher (Vision Agent) has joined the call. */
export type AgentStatus = "idle" | "connecting" | "connected" | "failed";

type Args = {
  lessonId: string | undefined;
  languageCode: string | undefined;
  lessonTitle: string | undefined;
  goals?: string[];
  vocabulary?: AgentVocabularyItem[];
  phrases?: AgentPhraseItem[];
  aiTeacherPrompt?: AgentTeacherPrompt | null;
};

export function useAudioLessonCall({
  lessonId,
  languageCode,
  lessonTitle,
  goals,
  vocabulary,
  phrases,
  aiTeacherPrompt,
}: Args) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0); // bump to retry

  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");

  // Keep the latest Clerk helpers/display info in refs so the connect effect
  // doesn't re-run (and rebuild the client) just because their identity changed.
  const ctx = useRef<{
    getToken: typeof getToken;
    name: string | undefined;
    image: string | undefined;
  }>({
    getToken,
    name: user?.fullName ?? undefined,
    image: user?.imageUrl ?? undefined,
  });
  useEffect(() => {
    ctx.current = {
      getToken,
      name: user?.fullName ?? undefined,
      image: user?.imageUrl ?? undefined,
    };
  });

  // Track the active agent session so cleanup can stop it.
  const agentSessionRef = useRef<{ sessionId: string; callId: string } | null>(
    null,
  );

  /** Stop the agent session if one is running. */
  const stopAgent = useCallback(async () => {
    const session = agentSessionRef.current;
    if (!session) return;
    agentSessionRef.current = null;
    try {
      await stopAgentSession(ctx.current.getToken, session);
    } catch (e) {
      console.error("agent stop failed", e);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn || !lessonId) return;

    let cancelled = false;
    let createdClient: StreamVideoClient | undefined;
    let createdCall: Call | undefined;

    (async () => {
      try {
        setPhase("connecting");
        setError(null);
        setAgentStatus("idle");

        const { getToken: getClerkToken, name, image } = ctx.current;
        const display = { name, image };

        // 1. Token + api key (server derives the Stream user id from Clerk).
        const session = await fetchStreamSession(getClerkToken, display);
        if (cancelled) return;

        const streamUser: User = {
          id: session.userId,
          name: session.userName,
          image: session.userImage,
        };

        const tokenProvider: TokenProvider = async () =>
          (
            await fetchStreamSession(ctx.current.getToken, {
              name: ctx.current.name,
              image: ctx.current.image,
            })
          ).token;

        const c = StreamVideoClient.getOrCreateInstance({
          apiKey: session.apiKey,
          user: streamUser,
          token: session.token,
          tokenProvider,
        });
        createdClient = c;
        if (cancelled) return;
        setClient(c);

        // 2. Create (or reuse) the lesson's audio call on the server.
        const info = await createLessonCall(getClerkToken, {
          lessonId,
          languageCode,
          lessonTitle,
        });
        if (cancelled) return;

        // 3. Build the Call instance and join audio-only.
        const activeCall = c.call(info.callType, info.callId, {
          reuseInstance: true,
        });
        createdCall = activeCall;
        activeCall.setDisconnectionTimeout(120);
        setCall(activeCall);

        // Push-to-speak: disable camera and mic BEFORE joining so the SFU
        // never sees an audio track until the user holds the button.
        await activeCall.camera.disable().catch(() => {});
        await activeCall.microphone.disable().catch(() => {});
        await activeCall.join({ create: false });
        if (cancelled) return;

        setPhase("ready");

        // 4. Start the Vision Agent so the AI teacher joins the call.
        setAgentStatus("connecting");
        try {
          const agentResult = await startAgentSession(getClerkToken, {
            lessonId,
            languageCode,
            lessonTitle,
            goals,
            vocabulary,
            phrases,
            aiTeacherPrompt,
          });
          if (!cancelled && agentResult.sessionId) {
            agentSessionRef.current = {
              sessionId: agentResult.sessionId,
              callId: agentResult.callId,
            };
            setAgentStatus("connected");
          } else if (!cancelled) {
            // Agent started but no session id returned — mark failed so user knows.
            setAgentStatus("failed");
          }
        } catch (agentErr) {
          if (!cancelled) {
            console.error("agent start failed", agentErr);
            setAgentStatus("failed");
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not connect.");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      // Stop the agent when the screen unmounts or a retry is triggered.
      void stopAgent();
      if (createdCall && createdCall.state.callingState !== CallingState.LEFT) {
        createdCall.leave().catch((e) => console.error("leave failed", e));
      }
      createdClient
        ?.disconnectUser()
        .catch((e) => console.error("disconnect failed", e));
      setCall(undefined);
      setClient(undefined);
      setAgentStatus("idle");
    };
  }, [isSignedIn, lessonId, languageCode, lessonTitle, nonce, stopAgent,
      // Intentionally excluded: goals/vocabulary/phrases/aiTeacherPrompt — these
      // are stable lesson data that don't change during a session; including them
      // would cause spurious reconnects.
      // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  /** Leave the call locally, stop the agent, and mark the session ended. */
  const endCall = useCallback(async () => {
    await stopAgent();
    if (call && call.state.callingState !== CallingState.LEFT) {
      await call.leave().catch((e) => console.error("leave failed", e));
    }
    setPhase("ended");
    setAgentStatus("idle");
  }, [call, stopAgent]);

  /** Re-run the whole connect flow after an error. */
  const retry = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  return { client, call, phase, error, endCall, retry, agentStatus } as const;
}

/**
 * Owns the Stream audio-call lifecycle for one lesson:
 *
 *   fetch token  →  build client  →  create call (server)  →  join (audio-only)
 *
 * Returns the `client` + `call` to mount under <StreamVideo>/<StreamCall>, plus
 * a coarse `phase` for the pre-join states. Fine-grained in-call states
 * (joined / reconnecting) are read from `useCallStateHooks()` inside the call.
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

import { createLessonCall, fetchStreamSession } from "@/lib/stream";

/** Pre-join lifecycle phase. In-call status comes from the SDK hooks. */
export type CallPhase = "connecting" | "ready" | "error" | "ended";

type Args = {
  lessonId: string | undefined;
  languageCode: string | undefined;
  lessonTitle: string | undefined;
};

export function useAudioLessonCall({ lessonId, languageCode, lessonTitle }: Args) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  const [phase, setPhase] = useState<CallPhase>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0); // bump to retry

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
  // Keep the ref current without touching it during render (refs are not for
  // render-time reads/writes); the connect effect reads `ctx.current` later.
  useEffect(() => {
    ctx.current = {
      getToken,
      name: user?.fullName ?? undefined,
      image: user?.imageUrl ?? undefined,
    };
  });

  useEffect(() => {
    if (!isSignedIn || !lessonId) return;

    let cancelled = false;
    let createdClient: StreamVideoClient | undefined;
    let createdCall: Call | undefined;

    (async () => {
      try {
        setPhase("connecting");
        setError(null);

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

        // tokenProvider re-hits the route so the SDK can refresh on its own.
        const tokenProvider: TokenProvider = async () =>
          (await fetchStreamSession(ctx.current.getToken, {
            name: ctx.current.name,
            image: ctx.current.image,
          })).token;

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

        // 3. Single Call instance for this screen; mount it before joining so
        //    the UI can react to JOINING/JOINED/RECONNECTING states.
        const activeCall = c.call(info.callType, info.callId, {
          reuseInstance: true,
        });
        createdCall = activeCall;
        activeCall.setDisconnectionTimeout(120);
        setCall(activeCall);

        // Audio-only: never publish video; make sure the mic is live.
        await activeCall.camera.disable().catch(() => {});
        await activeCall.join({ create: false });
        await activeCall.microphone.enable().catch(() => {});
        if (cancelled) return;

        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not connect.");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      if (createdCall && createdCall.state.callingState !== CallingState.LEFT) {
        createdCall.leave().catch((e) => console.error("leave failed", e));
      }
      createdClient?.disconnectUser().catch((e) =>
        console.error("disconnect failed", e),
      );
      setCall(undefined);
      setClient(undefined);
    };
  }, [isSignedIn, lessonId, languageCode, lessonTitle, nonce]);

  /** Leave the call locally and mark the session ended (drives the UI). */
  const endCall = useCallback(async () => {
    if (call && call.state.callingState !== CallingState.LEFT) {
      await call.leave().catch((e) => console.error("leave failed", e));
    }
    setPhase("ended");
  }, [call]);

  /** Re-run the whole connect flow after an error. */
  const retry = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  return { client, call, phase, error, endCall, retry } as const;
}

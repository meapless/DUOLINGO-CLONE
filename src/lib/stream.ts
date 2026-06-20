/**
 * Client-side helpers for talking to the Stream API routes.
 *
 * These call our own Expo API routes (`/api/stream/*`) with the Clerk session
 * token attached. No Stream secrets live here — the server returns only the
 * public api key and a short-lived user token.
 */

/** What `/api/stream/token` returns. */
export type StreamSession = {
  apiKey: string;
  token: string;
  userId: string;
  userName?: string;
  userImage?: string;
};

/** What `/api/stream/call` returns. */
export type StreamCallInfo = {
  callType: string;
  callId: string;
};

/** Clerk's `getToken` shape (from `useAuth()`). */
type GetToken = () => Promise<string | null>;

/** POST helper that attaches the Clerk session token and unwraps JSON errors. */
async function authedPost<T>(
  path: string,
  getToken: GetToken,
  body?: Record<string, unknown>,
): Promise<T> {
  const sessionToken = await getToken();
  if (!sessionToken) {
    throw new Error("You must be signed in to start an audio lesson.");
  }

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status}).`);
  }

  return (await res.json()) as T;
}

/** Fetch a Stream session (api key + fresh user token) for the current user. */
export function fetchStreamSession(
  getToken: GetToken,
  display?: { name?: string; image?: string },
): Promise<StreamSession> {
  return authedPost<StreamSession>("/api/stream/token", getToken, {
    name: display?.name,
    image: display?.image,
  });
}

/** Create (or reuse) the audio call for a lesson and return its type + id. */
export function createLessonCall(
  getToken: GetToken,
  args: { lessonId: string; languageCode?: string; lessonTitle?: string },
): Promise<StreamCallInfo> {
  return authedPost<StreamCallInfo>("/api/stream/call", getToken, args);
}

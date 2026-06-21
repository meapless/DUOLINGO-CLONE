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

  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection.");
  }

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

// ─── Agent session ────────────────────────────────────────────────────────────

export type AgentVocabularyItem = { word: string; translation: string };
export type AgentPhraseItem = { text: string; translation: string };
export type AgentTeacherPrompt = {
  persona: string;
  objective: string;
  conversationStarters: string[];
  focusVocabularyIds: string[];
};

export type AgentStartArgs = {
  lessonId: string;
  languageCode?: string;
  lessonTitle?: string;
  goals?: string[];
  vocabulary?: AgentVocabularyItem[];
  phrases?: AgentPhraseItem[];
  aiTeacherPrompt?: AgentTeacherPrompt | null;
};

export type AgentStartResult = {
  sessionId: string | null;
  callId: string;
};

/** Start a Vision Agent session that joins the audio call as the AI teacher. */
export function startAgentSession(
  getToken: GetToken,
  args: AgentStartArgs,
): Promise<AgentStartResult> {
  return authedPost<AgentStartResult>("/api/agent/session", getToken, args);
}

/** Stop an active Vision Agent session. Safe to call even if already stopped. */
export function stopAgentSession(
  getToken: GetToken,
  args: { callId: string; sessionId: string },
): Promise<{ ok: boolean }> {
  return authedDelete<{ ok: boolean }>("/api/agent/session", getToken, args);
}

/** DELETE helper that attaches the Clerk session token. */
async function authedDelete<T>(
  path: string,
  getToken: GetToken,
  body?: Record<string, unknown>,
): Promise<T> {
  const sessionToken = await getToken();
  if (!sessionToken) {
    throw new Error("You must be signed in.");
  }

  let res: Response;
  try {
    res = await fetch(path, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error("Could not reach the server. Please check your connection.");
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status}).`);
  }

  return (await res.json()) as T;
}

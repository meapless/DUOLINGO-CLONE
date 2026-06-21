/**
 * POST  /api/agent/session  — start a Vision Agent session
 * DELETE /api/agent/session  — stop an existing session
 *
 * These are the only routes that talk to the Vision Agent server. The
 * AGENT_SERVER_URL env var is a server secret and never reaches the mobile
 * app. The Clerk session is verified on every request.
 */
import { requireUserId } from "@/lib/server/clerkAuth";
import { HttpError, toErrorResponse } from "@/lib/server/http";
import {
  AUDIO_LESSON_CALL_TYPE,
  buildAudioLessonCallId,
  getStreamServerClient,
} from "@/lib/server/streamServer";

const AGENT_USER_ID = "lingua-teacher";
const AGENT_USER_NAME = "Lingua Teacher";

function getAgentServerUrl(): string {
  const url = process.env.AGENT_SERVER_URL;
  if (!url) throw new HttpError(500, "AGENT_SERVER_URL is not configured on the server.");
  return url.replace(/\/$/, "");
}

// ─── POST — start ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);

    const body = await request
      .json()
      .catch(() => ({}) as Record<string, unknown>);

    const lessonId = typeof body?.lessonId === "string" ? body.lessonId : "";
    if (!lessonId) throw new HttpError(400, "lessonId is required.");

    const languageCode =
      typeof body?.languageCode === "string" ? body.languageCode : undefined;
    const lessonTitle =
      typeof body?.lessonTitle === "string" ? body.lessonTitle : undefined;
    const goals = Array.isArray(body?.goals) ? (body.goals as string[]) : [];
    const vocabulary = Array.isArray(body?.vocabulary) ? body.vocabulary : [];
    const phrases = Array.isArray(body?.phrases) ? body.phrases : [];
    const aiTeacherPrompt = body?.aiTeacherPrompt ?? null;

    const callId = buildAudioLessonCallId(lessonId, userId);
    const client = getStreamServerClient();

    // Ensure the agent user exists in Stream with admin role.
    await client.upsertUsers([
      { id: AGENT_USER_ID, name: AGENT_USER_NAME, role: "admin" },
    ]);

    // Add the agent as a call member with admin role so it can publish audio.
    const call = client.video.call(AUDIO_LESSON_CALL_TYPE, callId);
    await call.updateCallMembers({
      update_members: [{ user_id: AGENT_USER_ID, role: "admin" }],
    });

    // Stamp the call's custom data with the full lesson context so the agent
    // can read it when it joins.
    await call.update({
      custom: {
        lessonId,
        languageCode,
        lessonTitle,
        goals,
        vocabulary,
        phrases,
        aiTeacherPrompt,
        kind: "audio_lesson",
      },
    });

    // Ask the Vision Agent server to start a session and join the call.
    const agentUrl = getAgentServerUrl();
    let agentRes: Response;
    try {
      agentRes = await fetch(`${agentUrl}/calls/${callId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call_type: AUDIO_LESSON_CALL_TYPE,
          call_id: callId,
          language_code: languageCode,
          lesson_title: lessonTitle,
          goals,
          vocabulary,
          phrases,
          ai_teacher_prompt: aiTeacherPrompt,
        }),
      });
    } catch {
      throw new HttpError(503, "The AI teacher is currently offline. You can still use the lesson audio.");
    }

    if (!agentRes.ok) {
      const err = (await agentRes
        .json()
        .catch(() => null)) as { detail?: string } | null;
      throw new HttpError(502, err?.detail ?? "Failed to start agent session.");
    }

    const agentData = (await agentRes.json()) as { session_id?: string };
    return Response.json({ sessionId: agentData.session_id ?? null, callId });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// ─── DELETE — stop ───────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    await requireUserId(request);

    const body = await request
      .json()
      .catch(() => ({}) as Record<string, unknown>);

    const callId = typeof body?.callId === "string" ? body.callId : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!callId || !sessionId)
      throw new HttpError(400, "callId and sessionId are required.");

    const agentUrl = getAgentServerUrl();
    let agentRes: Response;
    try {
      agentRes = await fetch(
        `${agentUrl}/calls/${callId}/sessions/${sessionId}`,
        { method: "DELETE" },
      );
    } catch {
      // Server is down — session is already gone, treat as success.
      return Response.json({ ok: true });
    }

    // 404 means the session is already gone — treat as success.
    if (!agentRes.ok && agentRes.status !== 404) {
      const err = (await agentRes
        .json()
        .catch(() => null)) as { detail?: string } | null;
      throw new HttpError(502, err?.detail ?? "Failed to stop agent session.");
    }

    return Response.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export function GET() {
  return toErrorResponse(new HttpError(405, "Method not allowed."));
}

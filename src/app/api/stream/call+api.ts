/**
 * POST /api/stream/call
 *
 * Creates (or reuses) the Stream audio call for a lesson and adds the signed-in
 * Clerk user as a member. The call id is derived server-side from the lesson +
 * the verified user id, so the client cannot join a call it has no business in.
 * Returns the call type + id the client should join.
 *
 * Body: { lessonId: string; languageCode?: string; lessonTitle?: string }
 */
import { requireUserId } from "@/lib/server/clerkAuth";
import { HttpError, toErrorResponse } from "@/lib/server/http";
import {
  AUDIO_LESSON_CALL_TYPE,
  buildAudioLessonCallId,
  getStreamServerClient,
} from "@/lib/server/streamServer";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);

    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const lessonId = typeof body?.lessonId === "string" ? body.lessonId : "";
    if (!lessonId) {
      throw new HttpError(400, "A lessonId is required to start an audio lesson.");
    }
    const languageCode =
      typeof body?.languageCode === "string" ? body.languageCode : undefined;
    const lessonTitle =
      typeof body?.lessonTitle === "string" ? body.lessonTitle : undefined;

    const callId = buildAudioLessonCallId(lessonId, userId);
    const client = getStreamServerClient();

    const call = client.video.call(AUDIO_LESSON_CALL_TYPE, callId);
    await call.getOrCreate({
      data: {
        created_by_id: userId,
        members: [{ user_id: userId, role: "user" }],
        custom: { lessonId, languageCode, lessonTitle, kind: "audio_lesson" },
      },
    });

    return Response.json({ callType: AUDIO_LESSON_CALL_TYPE, callId });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export function GET() {
  return toErrorResponse(new HttpError(405, "Method not allowed."));
}

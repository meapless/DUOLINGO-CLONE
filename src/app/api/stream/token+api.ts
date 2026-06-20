/**
 * POST /api/stream/token
 *
 * Mints a short-lived Stream user token for the signed-in Clerk user. The
 * Stream user id is derived server-side from the verified Clerk session — the
 * client never chooses it. The Stream API secret stays on the server; only the
 * public api key and a 4-hour user token are returned.
 *
 * Body (optional, display-only): { name?: string; image?: string }
 */
import { requireUserId } from "@/lib/server/clerkAuth";
import { HttpError, toErrorResponse } from "@/lib/server/http";
import { getStreamApiKey, getStreamServerClient } from "@/lib/server/streamServer";

// 4 hours. The SDK's tokenProvider re-hits this route before expiry.
const TOKEN_TTL_SECONDS = 60 * 60 * 4;

export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);

    const body = await request.json().catch(() => ({}) as Record<string, unknown>);
    const name = typeof body?.name === "string" ? body.name : undefined;
    const image = typeof body?.image === "string" ? body.image : undefined;

    const client = getStreamServerClient();

    // Ensure the Stream user exists with up-to-date display info. Upsert is
    // idempotent and keyed on the server-trusted id.
    await client.upsertUsers([{ id: userId, name, image }]);

    const token = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: TOKEN_TTL_SECONDS,
    });

    return Response.json({
      apiKey: getStreamApiKey(),
      token,
      userId,
      userName: name,
      userImage: image,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// Reject other verbs explicitly so a stray GET doesn't 404 silently.
export function GET() {
  return toErrorResponse(new HttpError(405, "Method not allowed."));
}

/**
 * Server-only Clerk auth for Expo API routes.
 *
 * The mobile app sends its Clerk session token in the `Authorization` header.
 * We verify it here with the Clerk **secret key** and read the user id from the
 * verified token's `sub` claim. This is the trust boundary: the client never
 * tells us which user it is — we derive that from a signature it cannot forge.
 */
import { verifyToken } from "@clerk/backend";

import { HttpError } from "./http";

/**
 * Verify the incoming request's Clerk session token and return the trusted
 * user id. Throws `HttpError` (401/500) on missing/invalid token or config.
 */
export async function requireUserId(request: Request): Promise<string> {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    throw new HttpError(401, "You must be signed in to start an audio lesson.");
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new HttpError(
      500,
      "CLERK_SECRET_KEY is not configured on the server.",
    );
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload.sub) {
      throw new HttpError(401, "Invalid session.");
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }
}

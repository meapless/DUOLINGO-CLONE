/**
 * Tiny helpers for Expo API routes (server-only).
 *
 * `HttpError` lets request handlers throw with an HTTP status; the route's
 * try/catch turns it into a JSON response via `toErrorResponse`. Keeps the
 * happy path readable instead of returning early everywhere.
 */

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

/** Convert any thrown value into a JSON error Response with a sensible status. */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[api] Unhandled error:", error);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}

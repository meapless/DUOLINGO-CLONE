/**
 * Pulls a user-friendly message out of a Clerk error returned by the
 * Future auth API (`{ error }`). Prefers `longMessage` (localized, user-safe)
 * and falls back to `message`, then a generic string.
 */
export function getClerkErrorMessage(
  error: { longMessage?: string | null; message?: string | null } | null,
  fallback = "Something went wrong. Please try again.",
): string {
  return error?.longMessage || error?.message || fallback;
}

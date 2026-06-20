/**
 * Server-only Stream helpers for Expo API routes.
 *
 * Holds the Stream API secret and is the ONLY place that may use it. Never
 * import this file from a screen, component, or hook — the secret must never
 * reach the bundle that ships to the device.
 */
import { StreamClient } from "@stream-io/node-sdk";

import { HttpError } from "./http";

/** Stream call type used for audio lessons. "default" supports 1:1 audio/video. */
export const AUDIO_LESSON_CALL_TYPE = "default";

let cached: StreamClient | undefined;

/** Lazily build (and cache) the server-side Stream client. */
export function getStreamServerClient(): StreamClient {
  if (cached) return cached;

  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new HttpError(
      500,
      "Stream credentials are not configured on the server.",
    );
  }

  cached = new StreamClient(apiKey, apiSecret);
  return cached;
}

/** The public API key the client SDK needs to connect. Not a secret. */
export function getStreamApiKey(): string {
  const apiKey = process.env.STREAM_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "STREAM_API_KEY is not configured on the server.");
  }
  return apiKey;
}

/**
 * Build a deterministic, Stream-safe call id for a (lesson, user) pair so the
 * same learner always re-joins the same audio room for a given lesson.
 * Stream call ids allow only [0-9a-zA-Z_-] and max 64 chars.
 */
export function buildAudioLessonCallId(
  lessonId: string,
  userId: string,
): string {
  return `audio-${lessonId}-${userId}`
    .replace(/[^0-9a-zA-Z_-]/g, "-")
    .slice(0, 64);
}

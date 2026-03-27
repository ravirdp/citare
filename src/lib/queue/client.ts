import type { Redis } from "@upstash/redis";

// ── Upstash Redis client (lazy-loaded, optional) ──
// Returns null if Redis env vars are missing or client fails to initialize.
// The app runs fully without Redis — config defaults are hardcoded.

let _redis: Redis | null = null;
let _attempted = false;

export function getRedis(): Redis | null {
  if (_attempted) return _redis;
  _attempted = true;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    // Dynamic require so the module isn't evaluated if env vars are missing
    const { Redis: RedisClient } = require("@upstash/redis") as typeof import("@upstash/redis");
    _redis = new RedisClient({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn("[Redis] Failed to initialize client:", err);
  }

  return _redis;
}

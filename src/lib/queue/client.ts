import { Redis } from "@upstash/redis";
import { Client as QStashClient } from "@upstash/qstash";

// ── Upstash Redis client ──

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Upstash QStash client ──

export const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!,
});

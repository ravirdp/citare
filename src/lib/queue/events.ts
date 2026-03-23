import { redis } from "./client";

// ── Event type constants ──

export const EventTypes = {
  // Tier Zero
  DATA_SOURCE_SYNCED: "data_source.synced",
  DATA_SOURCE_CHANGED: "data_source.changed",
  DATA_SOURCE_ERROR: "data_source.error",

  // Knowledge Graph
  KG_UPDATED: "kg.updated",
  KG_CONFLICT_DETECTED: "kg.conflict_detected",

  // Presence
  PRESENCE_GENERATED: "presence.generated",
  PRESENCE_DEPLOYED: "presence.deployed",

  // Monitoring
  MONITORING_QUERIES_QUEUED: "monitoring.queries_queued",
  MONITORING_RESULT_RECEIVED: "monitoring.result_received",
  MONITORING_BATCH_COMPLETE: "monitoring.batch_complete",
  MONITORING_ANOMALY_DETECTED: "monitoring.anomaly_detected",

  // Scoring
  SCORING_COMPUTED: "scoring.computed",

  // System
  SYSTEM_HEALTH_CHANGED: "system.health_changed",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

interface EventPayload {
  type: EventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Emit an event to a Redis stream.
 */
export async function emitEvent(
  type: EventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const payload: EventPayload = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    // Use Redis XADD — stream name is the event type
    await redis.xadd(
      `events:${type}`,
      "*", // auto-generate ID
      { payload: JSON.stringify(payload) }
    );

    // Also add to a global stream for debugging
    await redis.xadd("events:all", "*", {
      type,
      payload: JSON.stringify(payload),
    });

    console.log(`[Event] ${type}`, data);
  } catch (err) {
    // Events are best-effort — don't crash the caller
    console.error(`[Event] Failed to emit ${type}:`, err);
  }
}

/**
 * Get recent events from a stream.
 */
export async function getRecentEvents(
  type: EventType | "all",
  count = 20
): Promise<EventPayload[]> {
  try {
    const streamKey = type === "all" ? "events:all" : `events:${type}`;
    const entries = await redis.xrevrange(streamKey, "+", "-", count);

    return (entries as unknown as Array<Record<string, string>>)
      .map((entry) => {
        const payloadStr = entry.payload;
        if (payloadStr) {
          return JSON.parse(payloadStr) as EventPayload;
        }
        return entry as unknown as EventPayload;
      });
  } catch {
    return [];
  }
}

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

/**
 * Emit an event — log-only, no Redis.
 * All data is already persisted in Supabase by the callers.
 */
export async function emitEvent(
  type: EventType,
  data: Record<string, unknown>
): Promise<void> {
  console.log(`[Event] ${type}`, data);
}

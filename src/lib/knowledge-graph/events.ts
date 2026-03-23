/**
 * Lightweight event emitter for knowledge graph changes.
 * Initially a direct function call; migrates to Redis streams in Phase 3.
 */

type KGEventHandler = (clientId: string, version: number) => Promise<void>;

const handlers: KGEventHandler[] = [];

/**
 * Register a handler for knowledge graph updates.
 */
export function onKnowledgeGraphUpdated(handler: KGEventHandler) {
  handlers.push(handler);
}

/**
 * Emit a knowledge graph updated event.
 */
export async function emitKnowledgeGraphUpdated(
  clientId: string,
  version: number
) {
  for (const handler of handlers) {
    try {
      await handler(clientId, version);
    } catch (err) {
      console.error("KG event handler error:", err);
    }
  }
}

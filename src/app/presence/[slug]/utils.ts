import { db } from "@/lib/db/client";
import { clients, presenceDeployments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Look up deployed presence content by client slug and format.
 */
export async function getDeployedContent(slug: string, format: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.slug, slug))
    .limit(1);

  if (!client) return null;

  const [deployment] = await db
    .select()
    .from(presenceDeployments)
    .where(
      and(
        eq(presenceDeployments.clientId, client.id),
        eq(presenceDeployments.format, format),
        eq(presenceDeployments.status, "deployed")
      )
    )
    .limit(1);

  if (!deployment?.content) return null;

  return { client, deployment };
}

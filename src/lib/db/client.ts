import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

// ── Drizzle ORM client (for direct DB operations) ──
const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString, {
  max: 1, // Serverless: keep connection pool small
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

// ── Supabase client (for Auth, Storage, RLS-enforced queries) ──
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Supabase admin client (bypasses RLS, for server-side operations) ──
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

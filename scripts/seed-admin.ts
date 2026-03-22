/**
 * Seed the super admin user in the users table.
 * Run after creating a user in Supabase Auth dashboard.
 *
 * Usage: npx tsx scripts/seed-admin.ts <auth-uid> <email>
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/lib/db/schema";

async function main() {
  const [authUid, email] = process.argv.slice(2);

  if (!authUid || !email) {
    console.error("Usage: npx tsx scripts/seed-admin.ts <auth-uid> <email>");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
  const db = drizzle(sql);

  await db.insert(users).values({
    email,
    name: "Super Admin",
    role: "super_admin",
    authProviderId: authUid,
  });

  console.log(`Super admin created: ${email} (auth UID: ${authUid})`);
  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

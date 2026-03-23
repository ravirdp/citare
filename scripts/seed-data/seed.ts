import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = "https://kpgntxlgvlmetqusejey.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZ250eGxndmxtZXRxdXNlamV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE4ODIwOSwiZXhwIjoyMDg5NzY0MjA5fQ.wkY9Tu2-ztOFe6Afbak553b98OKdtCEl9k9WgmdjEHo";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYNC_FREQUENCY_DEFAULTS: Record<string, number> = {
  google_ads: 6,
  gbp: 12,
  search_console: 24,
  analytics: 24,
};

interface ClientMapping {
  file: string;
  clientId: string;
  label: string;
}

const clients: ClientMapping[] = [
  {
    file: "test-data-business-1-clinique-bangalore.json",
    clientId: "b6382892-11fb-4272-b952-c993430b5652",
    label: "clinique-internationale-bangalore",
  },
  {
    file: "test-data-business-2-leverage-edu.json",
    clientId: "030ce44a-122a-488f-a6f4-9bb11f3ca9a0",
    label: "leverage-edu",
  },
  {
    file: "test-data-business-3-kr-jaipur.json",
    clientId: "515c3e1e-94db-48b6-822b-69ca353b7def",
    label: "kr-packers-jaipur",
  },
];

async function main() {
  console.log("=== Citare Data Sources Seed Script ===\n");

  let totalInserted = 0;
  let totalErrors = 0;

  for (const client of clients) {
    const filePath = path.join(__dirname, client.file);
    console.log(`--- ${client.label} (${client.clientId}) ---`);

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const dataSources = data.data_sources;

    if (!dataSources) {
      console.log("  No data_sources found, skipping.\n");
      continue;
    }

    for (const [key, sourceObj] of Object.entries<Record<string, unknown>>(
      dataSources
    )) {
      const sourceType =
        (sourceObj.source_type as string) ?? key;
      const status =
        (sourceObj.status as string) ?? "active";
      const syncFrequencyHours =
        (sourceObj.sync_frequency_hours as number) ??
        SYNC_FREQUENCY_DEFAULTS[key] ??
        6;
      const rawData = sourceObj.raw_data ?? (() => {
        const { source_type, status, sync_frequency_hours, ...rest } =
          sourceObj as Record<string, unknown>;
        return rest;
      })();

      const row = {
        client_id: client.clientId,
        source_type: sourceType,
        status,
        sync_frequency_hours: syncFrequencyHours,
        raw_data: rawData,
        credentials: {},
        error_log: [],
        metadata: {},
      };

      console.log(`  Inserting ${sourceType}...`);

      const { error } = await supabase.from("data_sources").insert(row);

      if (error) {
        console.log(`    ERROR: ${error.message}`);
        totalErrors++;
      } else {
        console.log(`    OK`);
        totalInserted++;
      }
    }

    console.log();
  }

  console.log(`=== Done: ${totalInserted} inserted, ${totalErrors} errors ===`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

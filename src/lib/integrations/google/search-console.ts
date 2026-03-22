import { google } from "googleapis";
import type { DataSourceIntegration } from "@/lib/integrations/_template";
import { createRawData } from "@/lib/integrations/_template";
import { getAuthenticatedClient, getValidTokens } from "./oauth";
import type { GoogleOAuthTokens, RawData } from "@/types/integrations";

export class SearchConsoleIntegration implements DataSourceIntegration {
  sourceType = "search_console";

  getRequiredScopes(): string[] {
    return ["https://www.googleapis.com/auth/webmasters.readonly"];
  }

  async validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean> {
    try {
      const tokens = await getValidTokens(credentials);
      const auth = getAuthenticatedClient(tokens);
      const searchconsole = google.searchconsole({ version: "v1", auth });
      await searchconsole.sites.list();
      return true;
    } catch {
      return false;
    }
  }

  async fetchData(
    credentials: GoogleOAuthTokens,
    metadata: Record<string, unknown>
  ): Promise<RawData> {
    const errors: Array<{ field: string; message: string }> = [];
    const tokens = await getValidTokens(credentials);
    const auth = getAuthenticatedClient(tokens);
    const searchconsole = google.searchconsole({ version: "v1", auth });

    const data: Record<string, unknown> = {};

    // Get the site URL from metadata or list sites
    let siteUrl = metadata.siteUrl as string | undefined;

    if (!siteUrl) {
      try {
        const sitesRes = await searchconsole.sites.list();
        const sites = sitesRes.data.siteEntry || [];
        data.availableSites = sites.map((s) => ({
          siteUrl: s.siteUrl,
          permissionLevel: s.permissionLevel,
        }));

        if (sites.length > 0) {
          siteUrl = sites[0].siteUrl!;
        } else {
          return createRawData(data, [
            { field: "sites", message: "No Search Console sites found" },
          ]);
        }
      } catch (err) {
        errors.push({ field: "sites", message: String(err) });
        return createRawData(data, errors);
      }
    }

    data.siteUrl = siteUrl;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const dateRange = {
      from: startDate.toISOString().split("T")[0],
      to: endDate.toISOString().split("T")[0],
    };
    data.dateRange = dateRange;

    // Top queries
    try {
      const queriesRes = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: dateRange.from,
          endDate: dateRange.to,
          dimensions: ["query"],
          rowLimit: 500,
        },
      });
      data.queries = (queriesRes.data.rows || []).map((row) => ({
        query: row.keys![0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (err) {
      errors.push({ field: "queries", message: String(err) });
    }

    // Top pages
    try {
      const pagesRes = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: dateRange.from,
          endDate: dateRange.to,
          dimensions: ["page"],
          rowLimit: 100,
        },
      });
      data.pages = (pagesRes.data.rows || []).map((row) => ({
        page: row.keys![0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
    } catch (err) {
      errors.push({ field: "pages", message: String(err) });
    }

    // Device breakdown
    try {
      const devicesRes = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: dateRange.from,
          endDate: dateRange.to,
          dimensions: ["device"],
        },
      });
      data.devices = (devicesRes.data.rows || []).map((row) => ({
        device: row.keys![0],
        clicks: row.clicks,
        impressions: row.impressions,
      }));
    } catch (err) {
      errors.push({ field: "devices", message: String(err) });
    }

    // Country breakdown
    try {
      const countriesRes = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: dateRange.from,
          endDate: dateRange.to,
          dimensions: ["country"],
          rowLimit: 50,
        },
      });
      data.countries = (countriesRes.data.rows || []).map((row) => ({
        country: row.keys![0],
        clicks: row.clicks,
        impressions: row.impressions,
      }));
    } catch (err) {
      errors.push({ field: "countries", message: String(err) });
    }

    return createRawData(data, errors);
  }
}

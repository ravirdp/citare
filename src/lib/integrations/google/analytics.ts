import { google } from "googleapis";
import type { DataSourceIntegration } from "@/lib/integrations/_template";
import { createRawData } from "@/lib/integrations/_template";
import { getAuthenticatedClient, getValidTokens } from "./oauth";
import type { GoogleOAuthTokens, RawData } from "@/types/integrations";

export class AnalyticsIntegration implements DataSourceIntegration {
  sourceType = "analytics";

  getRequiredScopes(): string[] {
    return ["https://www.googleapis.com/auth/analytics.readonly"];
  }

  async validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean> {
    try {
      const tokens = await getValidTokens(credentials);
      const auth = getAuthenticatedClient(tokens);
      const admin = google.analyticsadmin({ version: "v1beta", auth });
      await admin.properties.list();
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

    const data: Record<string, unknown> = {};

    // Find property ID
    let propertyId = metadata.propertyId as string | undefined;

    if (!propertyId) {
      try {
        const admin = google.analyticsadmin({ version: "v1beta", auth });
        const propsRes = await admin.properties.list({
          filter: "parent:accounts/-",
        });
        const properties = propsRes.data.properties || [];
        data.availableProperties = properties.map((p) => ({
          name: p.name,
          displayName: p.displayName,
          propertyType: p.propertyType,
        }));

        if (properties.length > 0) {
          // Extract property ID from "properties/123456"
          propertyId = properties[0].name!;
        } else {
          return createRawData(data, [
            { field: "properties", message: "No GA4 properties found" },
          ]);
        }
      } catch (err) {
        errors.push({ field: "properties", message: String(err) });
        return createRawData(data, errors);
      }
    }

    data.propertyId = propertyId;

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateRange = {
      from: startDate.toISOString().split("T")[0],
      to: endDate.toISOString().split("T")[0],
    };
    data.dateRange = dateRange;

    // Top pages by sessions
    try {
      const pagesRes = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
          limit: "50",
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        },
      });
      data.topPages = (pagesRes.data.rows || []).map((row) => ({
        pagePath: row.dimensionValues![0].value,
        sessions: Number(row.metricValues![0].value),
        pageviews: Number(row.metricValues![1].value),
      }));
    } catch (err) {
      errors.push({ field: "topPages", message: String(err) });
    }

    // Traffic sources
    try {
      const sourcesRes = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: "sessionSource" },
            { name: "sessionMedium" },
          ],
          metrics: [{ name: "sessions" }],
          limit: "50",
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        },
      });
      data.trafficSources = (sourcesRes.data.rows || []).map((row) => ({
        source: row.dimensionValues![0].value,
        medium: row.dimensionValues![1].value,
        sessions: Number(row.metricValues![0].value),
      }));
    } catch (err) {
      errors.push({ field: "trafficSources", message: String(err) });
    }

    // Geographic breakdown
    try {
      const geoRes = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [{ name: "city" }, { name: "country" }],
          metrics: [{ name: "sessions" }],
          limit: "50",
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        },
      });
      data.geoBreakdown = (geoRes.data.rows || []).map((row) => ({
        city: row.dimensionValues![0].value,
        country: row.dimensionValues![1].value,
        sessions: Number(row.metricValues![0].value),
      }));
    } catch (err) {
      errors.push({ field: "geoBreakdown", message: String(err) });
    }

    // Branded search terms (organic search queries)
    try {
      const searchRes = await analyticsData.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [{ name: "sessionGoogleAdsQuery" }],
          metrics: [{ name: "sessions" }],
          limit: "100",
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        },
      });
      data.brandedSearchTerms = (searchRes.data.rows || []).map((row) => ({
        term: row.dimensionValues![0].value,
        sessions: Number(row.metricValues![0].value),
      }));
    } catch (err) {
      errors.push({ field: "brandedSearchTerms", message: String(err) });
    }

    return createRawData(data, errors);
  }
}

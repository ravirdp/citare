import { GoogleAdsApi } from "google-ads-api";
import type { DataSourceIntegration } from "@/lib/integrations/_template";
import { createRawData } from "@/lib/integrations/_template";
import type { GoogleOAuthTokens, RawData, GoogleAdsRawData } from "@/types/integrations";

export class GoogleAdsIntegration implements DataSourceIntegration {
  sourceType = "google_ads";

  getRequiredScopes(): string[] {
    return ["https://www.googleapis.com/auth/adwords"];
  }

  async validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean> {
    try {
      const client = this.getClient();
      const customers = await client.listAccessibleCustomers(credentials.refresh_token);
      return customers.resource_names.length > 0;
    } catch {
      return false;
    }
  }

  async fetchData(
    credentials: GoogleOAuthTokens,
    metadata: Record<string, unknown>
  ): Promise<RawData> {
    const errors: Array<{ field: string; message: string }> = [];
    const client = this.getClient();
    const customerId = (metadata.customerId as string) || "";

    if (!customerId) {
      // List accessible customers to find the right one
      const customers = await client.listAccessibleCustomers(credentials.refresh_token);
      return createRawData(
        {
          accessibleCustomers: customers.resource_names,
          needsCustomerSelection: true,
        },
        [{ field: "customerId", message: "Customer ID needed. Available customers listed." }]
      );
    }

    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: credentials.refresh_token,
      login_customer_id: (metadata.loginCustomerId as string) || undefined,
    });

    const data: Partial<GoogleAdsRawData> = {};

    // Campaigns
    try {
      const campaigns = await customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign_budget.amount_micros,
          campaign.bidding_strategy_type
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
        LIMIT 100
      `);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.campaigns = campaigns.map((row: any) => ({
        id: String(row.campaign?.id ?? ""),
        name: row.campaign?.name ?? "",
        status: String(row.campaign?.status ?? ""),
        type: String(row.campaign?.advertising_channel_type ?? ""),
        budget: {
          amountMicros: String(row.campaign_budget?.amount_micros ?? "0"),
          deliveryMethod: "STANDARD",
        },
        biddingStrategy: String(row.campaign?.bidding_strategy_type ?? ""),
      }));
    } catch (err) {
      errors.push({ field: "campaigns", message: String(err) });
    }

    // Keywords with performance
    try {
      const keywords = await customer.query(`
        SELECT
          ad_group_criterion.criterion_id,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group.id,
          ad_group_criterion.status,
          ad_group_criterion.quality_info.quality_score,
          ad_group_criterion.effective_cpc_bid_micros
        FROM ad_group_criterion
        WHERE ad_group_criterion.type = 'KEYWORD'
          AND ad_group_criterion.status != 'REMOVED'
        ORDER BY ad_group_criterion.keyword.text
        LIMIT 500
      `);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.keywords = keywords.map((row: any) => ({
        id: String(row.ad_group_criterion?.criterion_id ?? ""),
        text: row.ad_group_criterion?.keyword?.text ?? "",
        matchType: String(row.ad_group_criterion?.keyword?.match_type ?? ""),
        adGroupId: String(row.ad_group?.id ?? ""),
        status: String(row.ad_group_criterion?.status ?? ""),
        qualityScore: row.ad_group_criterion?.quality_info?.quality_score ?? null,
        cpcBidMicros: String(row.ad_group_criterion?.effective_cpc_bid_micros ?? "0"),
      }));
    } catch (err) {
      errors.push({ field: "keywords", message: String(err) });
    }

    // Performance metrics (last 30 days)
    try {
      const perf = await customer.query(`
        SELECT
          metrics.cost_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.average_cpc
        FROM customer
        WHERE segments.date DURING LAST_30_DAYS
      `);
      const totals = perf[0];
      data.performance = {
        dateRange: { from: "LAST_30_DAYS", to: "today" },
        totalSpendMicros: String(totals?.metrics?.cost_micros ?? "0"),
        totalImpressions: Number(totals?.metrics?.impressions ?? 0),
        totalClicks: Number(totals?.metrics?.clicks ?? 0),
        totalConversions: Number(totals?.metrics?.conversions ?? 0),
        averageCpc: String(totals?.metrics?.average_cpc ?? "0"),
      };
    } catch (err) {
      errors.push({ field: "performance", message: String(err) });
    }

    // Geographic targeting
    try {
      const geoTargets = await customer.query(`
        SELECT
          campaign.id,
          campaign_criterion.location.geo_target_constant
        FROM campaign_criterion
        WHERE campaign_criterion.type = 'LOCATION'
        LIMIT 100
      `);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.geoTargets = geoTargets.map((row: any) => ({
        campaignId: String(row.campaign?.id ?? ""),
        locationId: row.campaign_criterion?.location?.geo_target_constant ?? "",
        locationName: "",
      }));
    } catch (err) {
      errors.push({ field: "geoTargets", message: String(err) });
    }

    return createRawData(data as Record<string, unknown>, errors);
  }

  private getClient(): GoogleAdsApi {
    return new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
  }
}

import type { EncryptedData } from "@/lib/utils/encryption";

// ── Google OAuth Credentials (stored encrypted in data_sources.credentials) ──

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export type EncryptedCredentials = EncryptedData;

// ── Integration interface ──

export interface RawData {
  data: Record<string, unknown>;
  fetchedAt: string;
  partial: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface DataSourceIntegration {
  sourceType: string;
  fetchData(
    credentials: GoogleOAuthTokens,
    metadata: Record<string, unknown>
  ): Promise<RawData>;
  validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean>;
  getRequiredScopes(): string[];
}

// ── Google Ads raw data structure ──

export interface GoogleAdsRawData {
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    budget: { amountMicros: string; deliveryMethod: string };
    biddingStrategy: string;
  }>;
  adGroups: Array<{
    id: string;
    name: string;
    campaignId: string;
    status: string;
    cpcBidMicros: string;
  }>;
  keywords: Array<{
    id: string;
    text: string;
    matchType: string;
    adGroupId: string;
    status: string;
    qualityScore: number | null;
    cpcBidMicros: string;
  }>;
  performance: {
    dateRange: { from: string; to: string };
    totalSpendMicros: string;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCpc: string;
  };
  geoTargets: Array<{
    campaignId: string;
    locationId: string;
    locationName: string;
  }>;
  landingPages: Array<{
    url: string;
    campaignId: string;
  }>;
}

// ── Google Business Profile raw data structure ──

export interface GbpRawData {
  name: string;
  title: string;
  address: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  latlng: { latitude: number; longitude: number } | null;
  phoneNumbers: string[];
  websiteUri: string;
  regularHours: Record<string, unknown>;
  specialHours: unknown[];
  categories: {
    primaryCategory: { displayName: string; categoryId: string };
    additionalCategories: Array<{ displayName: string; categoryId: string }>;
  };
  services: Array<{ displayName: string; description: string }>;
  attributes: Array<{ name: string; values: unknown[] }>;
  reviews: Array<{
    reviewer: { displayName: string };
    starRating: string;
    comment: string;
    createTime: string;
    updateTime: string;
    reviewReply: { comment: string; updateTime: string } | null;
  }>;
  photos: Array<{ name: string; mediaFormat: string; googleUrl: string }>;
  insights: Record<string, unknown>;
}

// ── Search Console raw data structure ──

export interface SearchConsoleRawData {
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  dateRange: { from: string; to: string };
}

// ── Analytics GA4 raw data structure ──

export interface AnalyticsRawData {
  topPages: Array<{
    pagePath: string;
    sessions: number;
    pageviews: number;
  }>;
  trafficSources: Array<{
    source: string;
    medium: string;
    sessions: number;
  }>;
  geoBreakdown: Array<{
    city: string;
    country: string;
    sessions: number;
  }>;
  brandedSearchTerms: Array<{
    term: string;
    sessions: number;
  }>;
  dateRange: { from: string; to: string };
}

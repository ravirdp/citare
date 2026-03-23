/**
 * Knowledge Graph type definitions.
 *
 * These interfaces define the strongly-typed JSONB structures stored in
 * the knowledge_graphs table. They mirror the schema comments in
 * ARCHITECTURE.md Section 3.2.
 */

// ── Multi-language support ──

export interface MultiLangObject {
  en?: string;
  hi?: string;
  hinglish?: string;
  [language: string]: string | undefined;
}

// ── Business Profile ──

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  pin?: string;
  coordinates?: { lat: number; lng: number };
}

export interface LandmarkData {
  clientDescribed: string;
  autoDetected: string[];
  googleNearby: string[];
}

export interface BusinessHours {
  regular: Record<string, { open: string; close: string } | null>;
  special: Array<{ date: string; open?: string; close?: string; closed?: boolean }>;
}

export interface BusinessProfile {
  name: string;
  description: string;
  categories: string[];
  contact: ContactInfo;
  address: Address;
  landmarks: LandmarkData;
  hours: BusinessHours;
  attributes: string[];
  languages: string[];
  voiceProfile: string;
}

// ── Services ──

export interface CpcData {
  averageCpcInr: number;
  totalSpendInr: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface KGService {
  id: string;
  name: string;
  description: string;
  category: string;
  decisionRadius: "planned" | "considered" | "impulse";
  prominenceScore: number;
  keywords: string[];
  cpcData: CpcData;
  competitorServices: string[];
  multiLang: MultiLangObject;
}

// ── Products ──

export interface ProductPrice {
  amount: number;
  currency: string;
  salePrice?: number;
}

export interface KGProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  focusType: "top10" | "aspirational" | "defensive" | "seasonal";
  price: ProductPrice;
  specifications: Record<string, string>;
  images: string[];
  brand?: string;
  gtin?: string;
  sku?: string;
  reviewSentiment: Record<string, unknown>;
  aggregateRating?: { ratingValue: number; reviewCount: number };
  useCases: string[];
  targetAudience: string;
  keywords: string[];
  cpcData: CpcData;
  competitorProducts: string[];
  multiLang: MultiLangObject;
}

// ── Competitors ──

export interface KGCompetitor {
  name: string;
  source: string;
  services: string[];
  products: string[];
  strengths: string[];
  weaknesses: string[];
}

// ── Confidence & Conflicts ──

export interface ConfidenceScores {
  [field: string]: number; // 0.0 – 1.0
}

export interface Conflict {
  field: string;
  sources: string[];
  values: string[];
  resolution?: string;
}

// ── Decision Radius ──

export interface DecisionRadiusMap {
  [serviceOrProductId: string]: "planned" | "considered" | "impulse";
}

// ── Presence State ──

export interface PresenceState {
  formatsDeployed: string[];
  deploymentMethod?: string;
  lastGenerated?: string;
  healthStatus?: "healthy" | "degraded" | "error";
}

// ── Search State ──

export interface SearchState {
  visibilityScores: Record<string, number>;
  platformAppearances: Record<string, number>;
  accuracyFlags: string[];
}

// ── Complete Knowledge Graph ──

export interface KnowledgeGraphData {
  businessProfile: BusinessProfile;
  services: KGService[];
  products: KGProduct[];
  competitors: KGCompetitor[];
  presenceState: PresenceState;
  searchState: SearchState;
  decisionRadiusMap: DecisionRadiusMap;
  confidenceScores: ConfidenceScores;
  conflicts: Conflict[];
}

// ── Raw Client Data (input to KG synthesis) ──

export interface RawClientData {
  clientId: string;
  clientName: string;
  businessType: string;
  landmarkDescription: string | null;
  languages: string[];
  sources: {
    googleAds?: Record<string, unknown>;
    gbp?: Record<string, unknown>;
    searchConsole?: Record<string, unknown>;
    analytics?: Record<string, unknown>;
  };
}

import type { DataSourceStatus, DataSourceType } from "./database";

// ── Ingest API ──

export interface TriggerIngestRequest {
  clientId: string;
}

export interface TriggerIngestResponse {
  success: boolean;
  message: string;
  sources: DataSourceStatusInfo[];
}

export interface DataSourceStatusInfo {
  id: string;
  sourceType: DataSourceType;
  status: DataSourceStatus;
  lastSyncAt: string | null;
  error: string | null;
}

export interface IngestStatusResponse {
  clientId: string;
  sources: DataSourceStatusInfo[];
  overallStatus: "pending" | "syncing" | "active" | "partial_error" | "error";
}

// ── Auth API ──

export interface GoogleOAuthInitResponse {
  authUrl: string;
}

export interface GoogleOAuthCallbackResponse {
  success: boolean;
  sourcesCreated: number;
  clientId: string;
}

// ── Error response ──

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Integration Template
 *
 * Copy this file to create a new data source integration.
 * Implement all methods of the DataSourceIntegration interface.
 */

import type { GoogleOAuthTokens, RawData } from "@/types/integrations";

export interface DataSourceIntegration {
  /** The source_type string stored in data_sources table */
  sourceType: string;

  /** Fetch all data from this source. Returns raw data as JSONB-compatible object. */
  fetchData(
    credentials: GoogleOAuthTokens,
    metadata: Record<string, unknown>
  ): Promise<RawData>;

  /** Validate that credentials are still valid (not expired, not revoked). */
  validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean>;

  /** Return the OAuth scopes this integration needs. */
  getRequiredScopes(): string[];
}

/**
 * Helper to create a standardized RawData response.
 */
export function createRawData(
  data: Record<string, unknown>,
  errors: Array<{ field: string; message: string }> = []
): RawData {
  return {
    data,
    fetchedAt: new Date().toISOString(),
    partial: errors.length > 0,
    errors,
  };
}

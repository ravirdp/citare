import { google } from "googleapis";
import {
  encryptJson,
  decryptJson,
} from "@/lib/utils/encryption";
import type { GoogleOAuthTokens, EncryptedCredentials } from "@/types/integrations";

const SCOPES = [
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate the Google OAuth consent URL.
 * The `state` parameter carries the clientId for the callback.
 */
export function getAuthUrl(clientId: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: clientId,
  });
}

/**
 * Exchange the authorization code for tokens.
 */
export async function exchangeCode(
  code: string
): Promise<GoogleOAuthTokens> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    token_type: tokens.token_type!,
    scope: tokens.scope!,
  };
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(
  tokens: GoogleOAuthTokens
): Promise<GoogleOAuthTokens> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    access_token: credentials.access_token!,
    refresh_token: tokens.refresh_token, // refresh_token doesn't change
    expiry_date: credentials.expiry_date!,
    token_type: credentials.token_type!,
    scope: tokens.scope,
  };
}

/**
 * Get a valid (non-expired) set of tokens. Refreshes if needed.
 */
export async function getValidTokens(
  tokens: GoogleOAuthTokens
): Promise<GoogleOAuthTokens> {
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  if (tokens.expiry_date > now + bufferMs) {
    return tokens;
  }

  return refreshAccessToken(tokens);
}

/**
 * Create an authenticated OAuth2 client from tokens.
 */
export function getAuthenticatedClient(tokens: GoogleOAuthTokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
  });
  return oauth2Client;
}

/**
 * Encrypt OAuth tokens for storage in data_sources.credentials.
 */
export function encryptTokens(tokens: GoogleOAuthTokens): EncryptedCredentials {
  return encryptJson(tokens as unknown as Record<string, unknown>);
}

/**
 * Decrypt OAuth tokens from data_sources.credentials.
 */
export function decryptTokens(encrypted: EncryptedCredentials): GoogleOAuthTokens {
  return decryptJson<GoogleOAuthTokens>(encrypted);
}

export { SCOPES };

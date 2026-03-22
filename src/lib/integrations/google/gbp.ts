import { google } from "googleapis";
import type { DataSourceIntegration } from "@/lib/integrations/_template";
import { createRawData } from "@/lib/integrations/_template";
import { getAuthenticatedClient, getValidTokens } from "./oauth";
import type { GoogleOAuthTokens, RawData } from "@/types/integrations";

export class GbpIntegration implements DataSourceIntegration {
  sourceType = "gbp";

  getRequiredScopes(): string[] {
    return ["https://www.googleapis.com/auth/business.manage"];
  }

  async validateCredentials(credentials: GoogleOAuthTokens): Promise<boolean> {
    try {
      const tokens = await getValidTokens(credentials);
      const auth = getAuthenticatedClient(tokens);
      const mybusiness = google.mybusinessaccountmanagement({ version: "v1", auth });
      await mybusiness.accounts.list();
      return true;
    } catch {
      return false;
    }
  }

  async fetchData(
    credentials: GoogleOAuthTokens,
    _metadata: Record<string, unknown>
  ): Promise<RawData> {
    const errors: Array<{ field: string; message: string }> = [];
    const tokens = await getValidTokens(credentials);
    const auth = getAuthenticatedClient(tokens);

    const data: Record<string, unknown> = {};

    // List accounts
    try {
      const accountMgmt = google.mybusinessaccountmanagement({ version: "v1", auth });
      const accountsRes = await accountMgmt.accounts.list();
      const accounts = accountsRes.data.accounts || [];
      data.accounts = accounts.map((a) => ({ name: a.name, accountName: a.accountName }));

      if (accounts.length === 0) {
        return createRawData(data, [{ field: "accounts", message: "No GBP accounts found" }]);
      }

      const accountName = accounts[0].name!;

      // List locations
      const businessInfo = google.mybusinessbusinessinformation({ version: "v1", auth });
      const locationsRes = await businessInfo.accounts.locations.list({
        parent: accountName,
        readMask: "name,title,storefrontAddress,latlng,phoneNumbers,websiteUri,regularHours,specialHours,categories,serviceItems,metadata",
      });

      const locations = locationsRes.data.locations || [];
      data.locations = locations;

      if (locations.length > 0) {
        const location = locations[0];
        data.businessName = location.title;
        data.address = location.storefrontAddress;
        data.latlng = location.latlng;
        data.phoneNumbers = location.phoneNumbers;
        data.websiteUri = location.websiteUri;
        data.regularHours = location.regularHours;
        data.specialHours = location.specialHours;
        data.categories = location.categories;
      }
    } catch (err) {
      errors.push({ field: "businessInfo", message: String(err) });
    }

    // Reviews (via separate API call)
    try {
      const mybusiness = google.mybusinessaccountmanagement({ version: "v1", auth });
      const accountsRes = await mybusiness.accounts.list();
      const accounts = accountsRes.data.accounts || [];
      if (accounts.length > 0) {
        // Note: Reviews API requires the account/location path
        // This is a simplified version; full implementation needs location name
        data.reviewsNote = "Reviews fetching requires location-specific API calls — will be populated after location is identified";
      }
    } catch (err) {
      errors.push({ field: "reviews", message: String(err) });
    }

    return createRawData(data, errors);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAuth } from "@/lib/auth/user";

const SERVICE_SCOPES: Record<string, string[]> = {
  ads: ["https://www.googleapis.com/auth/adwords.readonly"],
  gbp: ["https://www.googleapis.com/auth/business.manage"],
  "search-console": ["https://www.googleapis.com/auth/webmasters.readonly"],
  analytics: ["https://www.googleapis.com/auth/analytics.readonly"],
};

/**
 * POST /api/integrations/google/[serviceId]/auth-url
 * Returns a Google OAuth consent URL scoped to a specific service.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const user = await requireAuth();

    const { serviceId } = await params;

    const scopes = SERVICE_SCOPES[serviceId];
    if (!scopes) {
      return NextResponse.json(
        { error: `Unknown service: ${serviceId}. Valid: ${Object.keys(SERVICE_SCOPES).join(", ")}` },
        { status: 400 }
      );
    }

    const clientId = user.clientId;
    if (!clientId) {
      return NextResponse.json(
        { error: "No client record associated with this user" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: `${clientId}:${serviceId}`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

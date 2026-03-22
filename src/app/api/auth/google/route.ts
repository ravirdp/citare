import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUrl } from "@/lib/integrations/google/oauth";

/**
 * GET /api/auth/google?clientId=xxx
 * Initiates Google OAuth flow for data ingestion (not login).
 * Redirects to Google consent screen with all required scopes.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json(
      { error: "clientId query parameter is required" },
      { status: 400 }
    );
  }

  const authUrl = getAuthUrl(clientId);
  return NextResponse.redirect(authUrl);
}

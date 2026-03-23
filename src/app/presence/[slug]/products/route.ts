import { NextRequest, NextResponse } from "next/server";
import { getDeployedContent } from "../utils";

/**
 * GET /presence/:slug/products
 * Serve product/service feed as JSON (public, no auth).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const result = await getDeployedContent(slug, "product_feed");

  if (!result) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return new NextResponse(result.deployment.content, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

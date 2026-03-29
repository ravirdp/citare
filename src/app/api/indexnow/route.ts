import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitUrlsToIndexNow } from "@/lib/indexnow";

/**
 * POST /api/indexnow
 * Submit URLs to IndexNow for instant indexing by Bing, Yandex, Seznam, Naver.
 * Body: { urls: string[] }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const urls: string[] = body.urls;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls must be a non-empty array" },
        { status: 400 }
      );
    }

    if (urls.length > 10000) {
      return NextResponse.json(
        { error: "Maximum 10,000 URLs per request" },
        { status: 400 }
      );
    }

    const result = await submitUrlsToIndexNow(urls);
    return NextResponse.json(result);
  } catch (err) {
    console.error("IndexNow submission error:", err);
    return NextResponse.json(
      {
        error: "IndexNow submission failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

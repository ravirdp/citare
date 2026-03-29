/**
 * GET /indexnow-key.txt
 * IndexNow verification file — returns the key so search engines can verify ownership.
 */
export function GET() {
  const key = process.env.INDEXNOW_KEY;

  if (!key) {
    return new Response("IndexNow key not configured", { status: 404 });
  }

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

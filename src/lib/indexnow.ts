/**
 * IndexNow API integration for instant Bing/Yandex/Seznam/Naver indexing.
 * Submits URLs to https://api.indexnow.org/indexnow when content changes.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const HOST = "www.citare.ai";

function getKey(): string | null {
  return process.env.INDEXNOW_KEY ?? null;
}

export async function submitUrlsToIndexNow(urls: string[]): Promise<{
  success: boolean;
  submitted: number;
  error?: string;
}> {
  const key = getKey();
  if (!key) {
    return { success: false, submitted: 0, error: "INDEXNOW_KEY not configured" };
  }

  if (urls.length === 0) {
    return { success: true, submitted: 0 };
  }

  // Ensure all URLs are absolute
  const absoluteUrls = urls.map((url) =>
    url.startsWith("http") ? url : `https://${HOST}${url.startsWith("/") ? "" : "/"}${url}`
  );

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `https://${HOST}/indexnow-key.txt`,
        urlList: absoluteUrls,
      }),
    });

    // IndexNow returns 200 or 202 on success
    if (response.ok || response.status === 202) {
      return { success: true, submitted: absoluteUrls.length };
    }

    return {
      success: false,
      submitted: 0,
      error: `IndexNow returned ${response.status}: ${response.statusText}`,
    };
  } catch (err) {
    return {
      success: false,
      submitted: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

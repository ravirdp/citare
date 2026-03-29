import { notFound } from "next/navigation";
import { getDeployedContent } from "../utils";

/**
 * /presence/:slug/about
 * Render the structured markdown page as HTML (public, no auth).
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getDeployedContent(slug, "markdown_page");

  if (!result) {
    notFound();
  }

  // Also fetch JSON-LD to embed in page
  const jsonLdResult = await getDeployedContent(slug, "json_ld");

  const markdown = result.deployment.content!;

  return (
    <>
      {jsonLdResult && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdResult.deployment.content!,
          }}
        />
      )}
      <article className="prose prose-gray max-w-none">
        <MarkdownRenderer content={markdown} />
      </article>
      <footer style={{ marginTop: 48, paddingTop: 16, borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <a
          href="https://www.citare.ai"
          target="_blank"
          rel="noopener"
          style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}
        >
          Powered by Citare &mdash; AI Search Intelligence
        </a>
      </footer>
    </>
  );
}

/**
 * Simple markdown-to-HTML renderer.
 * Handles: headings, bold, italic, links, lists, tables, horizontal rules.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const html: string[] = [];
  let inTable = false;
  let inList = false;

  for (const line of lines) {
    // Table rows
    if (line.startsWith("|")) {
      if (!inTable) {
        html.push("<table class='w-full border-collapse text-sm'>");
        inTable = true;
      }
      if (line.includes("---")) continue; // separator row
      const cells = line
        .split("|")
        .filter(Boolean)
        .map((c) => c.trim());
      const tag = html.filter((h) => h.includes("<tr>")).length === 0 ? "th" : "td";
      html.push(
        `<tr>${cells.map((c) => `<${tag} class='border px-2 py-1'>${inlineFormat(c)}</${tag}>`).join("")}</tr>`
      );
      continue;
    } else if (inTable) {
      html.push("</table>");
      inTable = false;
    }

    // List items
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul class='list-disc pl-5'>");
        inList = true;
      }
      html.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    } else if (inList && line.trim() === "") {
      html.push("</ul>");
      inList = false;
    }

    // Headings
    if (line.startsWith("### ")) {
      html.push(`<h3 class='text-lg font-semibold mt-6 mb-2'>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      html.push(`<h2 class='text-xl font-bold mt-8 mb-3'>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      html.push(`<h1 class='text-2xl font-bold mb-4'>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith("---")) {
      html.push("<hr class='my-6 border-gray-200' />");
    } else if (line.trim() === "") {
      html.push("<br />");
    } else {
      html.push(`<p class='mb-3'>${inlineFormat(line)}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  if (inTable) html.push("</table>");

  return (
    <div dangerouslySetInnerHTML={{ __html: html.join("\n") }} />
  );
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
}

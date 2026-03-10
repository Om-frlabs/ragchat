// 📁 ragchat/lib/extractors.js
import { load } from "cheerio";

// ─── PDF ──────────────────────────────────────────────────────────────────────
export async function extractPDF(buffer) {
  // Dynamic import to avoid issues with Next.js edge runtime
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

// ─── Plain text / Markdown ────────────────────────────────────────────────────
export async function extractText(buffer) {
  return buffer.toString("utf-8");
}

// ─── URL scraper ──────────────────────────────────────────────────────────────
export async function scrapeURL(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RAGChatBot/1.0; +https://github.com/Om-frlabs/ragchat)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);

  const html = await res.text();
  const $ = load(html);

  // Remove noise
  $("script, style, nav, header, footer, iframe, noscript, svg, [aria-hidden='true']").remove();
  $("[class*='cookie'], [class*='banner'], [class*='popup'], [id*='modal']").remove();

  // Extract title
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("title").text().trim() ||
    url;

  // Try main content areas first, fall back to body
  const selectors = ["main", "article", "[role='main']", ".content", "#content", "body"];
  let text = "";

  for (const sel of selectors) {
    const el = $(sel);
    if (el.length) {
      text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 500) break;
    }
  }

  if (!text) text = $("body").text().replace(/\s+/g, " ").trim();

  return { title, text };
}

// ─── Auto-detect and extract ──────────────────────────────────────────────────
export async function extractFromFile(buffer, mimetype, filename) {
  if (mimetype === "application/pdf" || filename.endsWith(".pdf")) {
    return extractPDF(buffer);
  }
  return extractText(buffer);
}
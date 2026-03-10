// 📁 ragchat/lib/chunker.js
/**
 * Split text into overlapping chunks.
 * ~500 tokens ≈ 1800 chars. Overlap helps preserve context at boundaries.
 */
export function chunkText(text, chunkSize = 1800, overlap = 200) {
  const chunks = [];
  const clean = text.replace(/\s+/g, " ").trim();
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}
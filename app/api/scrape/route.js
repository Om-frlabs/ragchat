// 📁 ragchat/app/api/scrape/route.js
import { supabase } from "@/lib/supabase";
import { embedTexts } from "@/lib/embeddings";
import { chunkText } from "@/lib/chunker";
import { scrapeURL } from "@/lib/extractors";

const EMBED_FIELD = {
  openai:  "embedding_openai",
  gemini:  "embedding_gemini",
  mistral: "embedding_mistral",
  cohere:  "embedding_cohere",
};

export async function POST(req) {
  const encoder = new TextEncoder();
  const { url, provider, apiKey } = await req.json();

  if (!url?.trim())   return new Response(JSON.stringify({ error: "URL required" }),      { status: 400 });
  if (!apiKey?.trim()) return new Response(JSON.stringify({ error: "API key required" }), { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      try {
        send({ step: "scrape", message: `Fetching ${url}…` });
        const { title, text } = await scrapeURL(url);

        if (!text || text.length < 100) {
          send({ step: "error", message: "Could not extract meaningful content from URL" });
          controller.close(); return;
        }

        send({ step: "chunk", message: `Scraped "${title}" — splitting into chunks…` });
        const chunks = chunkText(text);
        send({ step: "chunk", message: `${chunks.length} chunks created` });

        const allEmbeddings = [];
        for (let i = 0; i < chunks.length; i += 20) {
          const batch      = chunks.slice(i, i + 20);
          const embeddings = await embedTexts(provider, batch, apiKey);
          allEmbeddings.push(...embeddings);
          send({ step: "embed",
            message: `Embedded ${Math.min(i + 20, chunks.length)}/${chunks.length}`,
            progress: Math.round((Math.min(i + 20, chunks.length) / chunks.length) * 100),
          });
        }

        send({ step: "store", message: "Saving to database…" });
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({ name: title, source_type: "url", source_url: url, chunk_count: chunks.length, provider })
          .select().single();
        if (docErr) throw docErr;

        const field = EMBED_FIELD[provider] || "embedding_openai";
        const rows  = chunks.map((content, i) => ({
          document_id: doc.id, content, chunk_index: i,
          [field]: "[" + allEmbeddings[i].join(",") + "]",
        }));
        for (let i = 0; i < rows.length; i += 50) {
          const { error: insErr } = await supabase.from("chunks").insert(rows.slice(i, i + 50));
          if (insErr) throw insErr;
        }

        send({ step: "done", message: `✓ "${title}" — ${chunks.length} chunks indexed`,
          document: { id: doc.id, name: title, chunk_count: chunks.length, provider, source_url: url } });
      } catch (e) {
        send({ step: "error", message: e.message });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
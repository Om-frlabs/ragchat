// 📁 ragchat/app/api/upload/route.js
import { supabase } from "@/lib/supabase";
import { embedTexts } from "@/lib/embeddings";
import { chunkText } from "@/lib/chunker";
import { extractFromFile } from "@/lib/extractors";

const EMBED_FIELD = {
  openai:  "embedding_openai",
  gemini:  "embedding_gemini",
  mistral: "embedding_mistral",
  cohere:  "embedding_cohere",
};

export async function POST(req) {
  const encoder = new TextEncoder();
  const formData = await req.formData();
  const files    = formData.getAll("files");
  const provider = formData.get("provider") || "openai";
  const apiKey   = formData.get("apiKey") || "";

  if (!files.length)  return new Response(JSON.stringify({ error: "No files provided" }), { status: 400 });
  if (!apiKey.trim()) return new Response(JSON.stringify({ error: "API key required" }),   { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));

      for (let fi = 0; fi < files.length; fi++) {
        const file     = files[fi];
        const filename = file.name;
        try {
          send({ file: filename, step: "extract", message: `[${fi + 1}/${files.length}] Extracting "${filename}"…` });
          const buffer = Buffer.from(await file.arrayBuffer());
          const text   = await extractFromFile(buffer, file.type, filename);

          if (!text || text.trim().length < 100) {
            send({ file: filename, step: "error", message: `"${filename}": could not extract meaningful text` });
            continue;
          }

          send({ file: filename, step: "chunk", message: `Splitting into chunks…` });
          const chunks = chunkText(text);
          send({ file: filename, step: "chunk", message: `${chunks.length} chunks created` });

          const allEmbeddings = [];
          const batchSize = 20;
          for (let i = 0; i < chunks.length; i += batchSize) {
            const batch      = chunks.slice(i, i + batchSize);
            const embeddings = await embedTexts(provider, batch, apiKey);
            allEmbeddings.push(...embeddings);
            send({
              file: filename, step: "embed",
              message: `Embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length}`,
              progress: Math.round((Math.min(i + batchSize, chunks.length) / chunks.length) * 100),
            });
          }

          send({ file: filename, step: "store", message: `Saving to database…` });
          const { data: doc, error: docErr } = await supabase
            .from("documents")
            .insert({ name: filename, source_type: "file", chunk_count: chunks.length, provider })
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

          send({ file: filename, step: "done", message: `✓ "${filename}" — ${chunks.length} chunks indexed`,
            document: { id: doc.id, name: filename, chunk_count: chunks.length, provider } });
        } catch (e) {
          send({ file: filename, step: "error", message: `"${filename}": ${e.message}` });
        }
      }

      send({ step: "all_done", message: `All ${files.length} file(s) processed` });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
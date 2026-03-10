// 📁 ragchat/app/api/chat/route.js
import { supabase } from "@/lib/supabase";
import { embedQuery, streamChat } from "@/lib/embeddings";

const SYSTEM_PROMPT = (context) => `You are a precise documentation assistant. Answer questions using ONLY the provided context.

Rules:
- Base your answer strictly on the context below
- If the context doesn't fully answer the question, say so clearly
- Use markdown: headers, bullets, code blocks when helpful
- Cite [Source N] when referencing specific parts
- Be concise but complete

Context:
${context}`;

// RPC function names per provider (all_docs vs filtered)
const RPC = {
  openai:  { all: "match_chunks_openai",  byDoc: "match_chunks_openai_by_doc"  },
  gemini:  { all: "match_chunks_gemini",  byDoc: "match_chunks_gemini_by_doc"  },
  mistral: { all: "match_chunks_mistral", byDoc: "match_chunks_mistral_by_doc" },
  cohere:  { all: "match_chunks_cohere",  byDoc: "match_chunks_cohere_by_doc"  },
};

export async function POST(req) {
  const encoder = new TextEncoder();
  const { question, provider, apiKey, document_ids, history = [] } = await req.json();

  if (!question?.trim()) return new Response(JSON.stringify({ error: "Question required" }), { status: 400 });
  if (!apiKey?.trim())   return new Response(JSON.stringify({ error: "API key required" }),   { status: 400 });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => controller.enqueue(encoder.encode("data: " + JSON.stringify(data) + "\n\n"));
      try {
        // 1. Embed question (Cohere uses search_query input_type)
        const qEmbedding = await embedQuery(provider, question, apiKey);

        // 2. Vector similarity search
        const rpc     = RPC[provider] || RPC.openai;
        const rpcName = document_ids?.length ? rpc.byDoc : rpc.all;
        const rpcArgs = {
          query_embedding: "[" + qEmbedding.join(",") + "]",
          match_threshold: 0.4,
          match_count: 6,
          ...(document_ids?.length ? { doc_ids: document_ids } : {}),
        };

        const { data: matches, error: matchErr } = await supabase.rpc(rpcName, rpcArgs);
        if (matchErr) throw matchErr;

        const sources = (matches || []).map((c) => ({
          content: c.content.slice(0, 250) + (c.content.length > 250 ? "…" : ""),
          similarity: Math.round(c.similarity * 100),
          document_name: c.document_name,
        }));
        send({ type: "sources", sources });

        // 3. Build context
        const context = matches?.length
          ? matches.map((c, i) => `[Source ${i + 1}]\n${c.content}`).join("\n\n---\n\n")
          : "No relevant content found in the uploaded documents.";

        // 4. Stream LLM response
        const messages = [
          { role: "system", content: SYSTEM_PROMPT(context) },
          ...history.slice(-6),
          { role: "user", content: question },
        ];

        let tokenCount = 0;
        for await (const token of streamChat(provider, messages, apiKey)) {
          send({ type: "token", token });
          tokenCount++;
        }
        if (tokenCount === 0) {
          send({ type: "token", token: "(No response from model. Check your API key and try again.)" });
        }
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: e.message });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
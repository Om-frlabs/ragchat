// 📁 ragchat/lib/embeddings.js
import OpenAI from "openai";

// ─── OpenAI ───────────────────────────────────────────────────────────────────

export async function embedOpenAI(texts, apiKey) {
  const openai = new OpenAI({ apiKey });
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding); // 1536-dim
}

export async function* chatOpenAI(messages, apiKey) {
  const openai = new OpenAI({ apiKey });
  const stream = await openai.chat.completions.create({
    model: "gpt-4o", messages, stream: true,
    max_tokens: 1200, temperature: 0.2,
  });
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) yield token;
  }
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

export async function embedGemini(texts, apiKey) {
  const results = [];
  for (let i = 0; i < texts.length; i += 5) {
    const batch = texts.slice(i, i + 5);
    const embeddings = await Promise.all(batch.map((text) => _embedOneGemini(text, apiKey)));
    results.push(...embeddings);
  }
  return results;
}

async function _embedOneGemini(text, apiKey) {
  // Try v1 first, then v1beta
  const urls = [
    `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });
    const data = await res.json();
    if (!data.error && data.embedding?.values) return data.embedding.values;
  }
  throw new Error(
    "Gemini embedding failed. Your key may not have the Generative Language API enabled. " +
    "Go to console.cloud.google.com → APIs & Services → Enable 'Generative Language API', " +
    "or use a key from aistudio.google.com with a project that has it enabled."
  );
}

export async function* chatGemini(messages, apiKey) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const history = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: history,
        generationConfig: { maxOutputTokens: 1200, temperature: 0.2 },
      }),
    }
  );
  yield* _readGeminiStream(res);
}

async function* _readGeminiStream(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const json = JSON.parse(raw);
        const token = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (token) yield token;
      } catch (_) {}
    }
  }
}

// ─── Mistral ──────────────────────────────────────────────────────────────────

export async function embedMistral(texts, apiKey) {
  const res = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "mistral-embed", input: texts }),
  });
  const data = await res.json();
  if (data.error) throw new Error("Mistral embed error: " + (data.error.message || JSON.stringify(data.error)));
  return data.data.map((d) => d.embedding); // 1024-dim
}

export async function* chatMistral(messages, apiKey) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "mistral-large-latest", messages, stream: true,
      max_tokens: 1200, temperature: 0.2,
    }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") return;
      try {
        const token = JSON.parse(raw).choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch (_) {}
    }
  }
}

// ─── Cohere ───────────────────────────────────────────────────────────────────

export async function embedCohere(texts, apiKey, inputType = "search_document") {
  const res = await fetch("https://api.cohere.com/v2/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "embed-english-v3.0",
      texts,
      input_type: inputType,
      embedding_types: ["float"],
    }),
  });
  const data = await res.json();
  if (data.message) throw new Error("Cohere embed error: " + data.message);
  return data.embeddings.float; // 1024-dim each
}

export async function* chatCohere(messages, apiKey) {
  const system = messages.find((m) => m.role === "system")?.content || "";

  // Cohere v2: filter empty content, ensure alternating roles
  const rawHistory = messages
    .filter((m) => m.role !== "system" && m.content?.trim())
    .map((m) => ({ role: m.role, content: m.content }));

  // Remove consecutive same-role messages (keep last one)
  const history = rawHistory.reduce((acc, msg) => {
    if (acc.length > 0 && acc[acc.length - 1].role === msg.role) {
      acc[acc.length - 1] = msg; // replace with latest
    } else {
      acc.push(msg);
    }
    return acc;
  }, []);

  const res = await fetch("https://api.cohere.com/v2/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "command-r-plus-08-2024",
      messages: system ? [{ role: "system", content: system }, ...history] : history,
      stream: true,
      max_tokens: 1200,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Cohere chat error: " + err.slice(0, 200));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      // Cohere v2 SSE sends "data: {...}" lines
      const trimmed = line.trim();
      if (!trimmed) continue;
      let raw = trimmed;
      if (raw.startsWith("data: ")) raw = raw.slice(6);
      if (raw === "[DONE]") return;
      try {
        const json = JSON.parse(raw);
        // v2 streaming event types
        if (json.type === "content-delta") {
          const token = json.delta?.message?.content?.text;
          if (token) yield token;
        } else if (json.type === "text-generation") {
          // fallback for v1-style events
          if (json.text) yield json.text;
        }
      } catch (_) {}
    }
  }
}

// ─── Unified wrappers ─────────────────────────────────────────────────────────

export async function embedTexts(provider, texts, apiKey) {
  if (provider === "openai")  return embedOpenAI(texts, apiKey);
  if (provider === "gemini")  return embedGemini(texts, apiKey);
  if (provider === "mistral") return embedMistral(texts, apiKey);
  if (provider === "cohere")  return embedCohere(texts, apiKey, "search_document");
  throw new Error("Unknown provider: " + provider);
}

export async function embedQuery(provider, text, apiKey) {
  // Cohere needs a different input_type for queries vs documents
  if (provider === "cohere") return (await embedCohere([text], apiKey, "search_query"))[0];
  return (await embedTexts(provider, [text], apiKey))[0];
}

export async function* streamChat(provider, messages, apiKey) {
  if (provider === "openai")  { yield* chatOpenAI(messages, apiKey);  return; }
  if (provider === "gemini")  { yield* chatGemini(messages, apiKey);  return; }
  if (provider === "mistral") { yield* chatMistral(messages, apiKey); return; }
  if (provider === "cohere")  { yield* chatCohere(messages, apiKey);  return; }
  throw new Error("Unknown provider: " + provider);
}
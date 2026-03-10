<div align="center">

# ◈ RAGChat

**RAG-powered documentation chatbot — upload any PDF, text file, or website URL and chat with it using your choice of AI provider.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square)](LICENSE)
[![Live](https://img.shields.io/badge/live-ragchat--xi.vercel.app-3b82f6?style=flat-square&logo=vercel)](https://ragchat-xi.vercel.app)

**[🚀 Live Demo → ragchat-xi.vercel.app](https://ragchat-xi.vercel.app)**

</div>

---

## What is this?

RAGChat lets you turn any document into a conversational interface. Upload PDFs, text files, or scrape a website — it chunks the content, generates vector embeddings, stores them in Supabase pgvector, and answers your questions with streaming AI responses grounded in your actual documents.

Every answer cites its sources with similarity scores so you know exactly where the information came from.

---

## Features

- **4 AI Providers** — OpenAI, Gemini, Mistral, Cohere — switch any time
- **Multi-format ingestion** — PDF, TXT, Markdown, multiple files at once
- **URL scraping** — paste any public URL, content is scraped and embedded
- **Streaming answers** — token-by-token response with source citations
- **Resizable sidebar** — drag to adjust panel width
- **Document filtering** — select specific docs to search, or search all
- **Live progress** — chunking and embedding progress streamed in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Vector DB | Supabase pgvector |
| Embeddings | OpenAI `text-embedding-3-small` · Gemini `text-embedding-004` · Mistral `mistral-embed` · Cohere `embed-english-v3.0` |
| Chat | GPT-4o · Gemini 2.0 Flash · Mistral Large · Command R+ |
| PDF parsing | `pdf-parse` |
| Web scraping | `cheerio` |

---

## How it works

```
Upload PDF / TXT / MD / URL
          ↓
  Extract & clean text
          ↓
  Chunk (~500 tokens, 50 overlap)
          ↓
  Embed with chosen provider
          ↓
  Store vectors in Supabase pgvector
          ↓
  User asks a question
          ↓
  Embed question → cosine similarity search
          ↓
  Top 6 chunks → context window
          ↓
  Streamed answer + source citations
```

---

## Project Structure

```
ragchat/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   └── api/
│       ├── documents/route.js
│       ├── documents/[id]/route.js
│       ├── upload/route.js
│       ├── scrape/route.js
│       └── chat/route.js
├── lib/
│   ├── supabase.js
│   ├── embeddings.js
│   ├── chunker.js
│   └── extractors.js
├── supabase_setup.sql
└── .env.example
```

---

## Local Setup

```bash
git clone https://github.com/Om-frlabs/ragchat.git
cd ragchat
npm install
cp .env.example .env.local
# Add your Supabase keys to .env.local
npm run dev
# → http://localhost:3000
```

---

## API Keys

Keys are entered in the UI at runtime and never stored server-side:

| Provider | Get Key | Free Tier |
|---|---|---|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | ❌ |
| Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | ✅ |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | ✅ |
| Cohere | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) | ✅ |

---

## Embedding Dimensions

| Provider | Model | Dims | Column |
|---|---|---|---|
| OpenAI | text-embedding-3-small | 1536 | `embedding_openai` |
| Gemini | text-embedding-004 | 768 | `embedding_gemini` |
| Mistral | mistral-embed | 1024 | `embedding_mistral` |
| Cohere | embed-english-v3.0 | 1024 | `embedding_cohere` |

> Use the **same provider** for uploading and chatting.

---

## Built by

**Om Mishra** — Founder, [Fr Labs](https://github.com/Om-frlabs) · Mumbai, India 🇮🇳

---

<div align="center">
<sub>Next.js · Supabase · pgvector · OpenAI · Gemini · Mistral · Cohere</sub>
</div>

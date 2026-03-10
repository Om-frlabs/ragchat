<div align="center">

# ◈ RAGChat

**RAG-powered documentation chatbot — upload any PDF, text file, or website URL and chat with it using your choice of AI provider.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/license-MIT-a78bfa?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

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
| Fonts | Fraunces · IBM Plex Mono |

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
│   ├── layout.js                     # Root layout + Google Fonts
│   ├── page.js                       # Full chat UI (client component)
│   ├── globals.css                   # Global styles + markdown classes
│   └── api/
│       ├── documents/route.js        # GET  — list all documents
│       ├── documents/[id]/route.js   # DELETE — remove document + chunks
│       ├── upload/route.js           # POST — multi-file upload (SSE)
│       ├── scrape/route.js           # POST — URL scraper (SSE)
│       ├── chat/route.js             # POST — RAG chat (SSE streaming)
│       └── debug/route.js            # GET  — connection debug info
├── lib/
│   ├── supabase.js                   # Supabase client
│   ├── embeddings.js                 # All provider embed + chat logic
│   ├── chunker.js                    # Text chunking
│   └── extractors.js                 # PDF + text + URL extraction
├── supabase_setup.sql                # Run once in Supabase SQL Editor
├── jsconfig.json                     # Path alias (@/)
├── next.config.js
├── .env.example
└── package.json
```

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/Om-frlabs/ragchat.git
cd ragchat
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste the contents of `supabase_setup.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret key (click Reveal) → `SUPABASE_SERVICE_KEY`

> ⚠️ Use the `service_role` key — it starts with `eyJ...`, not `sb_publishable_...`

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

Enter your AI provider API key in the sidebar and start uploading documents.

---

## API Keys

Keys are entered in the UI at runtime and never stored server-side. Get them here:

| Provider | Get Key | Free Tier |
|---|---|---|
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | ❌ |
| Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | ✅ |
| Mistral | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | ✅ Trial credits |
| Cohere | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) | ✅ Generous free tier |

> **Gemini note:** Your Google Cloud project must have the **Generative Language API** enabled.  
> Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Enable it.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Om-frlabs/ragchat)

Or manually:

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `Om-frlabs/ragchat`
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL  =  https://your-project.supabase.co
   SUPABASE_SERVICE_KEY      =  eyJ...
   ```
4. Click **Deploy** — live in ~60 seconds

Every push to `main` triggers an automatic redeploy.

---

## Embedding Dimensions

Each provider uses a different vector size stored in a separate column:

| Provider | Model | Dims | Column |
|---|---|---|---|
| OpenAI | text-embedding-3-small | 1536 | `embedding_openai` |
| Gemini | text-embedding-004 | 768 | `embedding_gemini` |
| Mistral | mistral-embed | 1024 | `embedding_mistral` |
| Cohere | embed-english-v3.0 | 1024 | `embedding_cohere` |

> Use the **same provider** for uploading and chatting. Mixed-provider search is not supported.

---

## Built by

**Om Mishra** — Founder, [Fr Labs](https://github.com/Om-frlabs) · Kanpur, India 🇮🇳

---

<div align="center">
<sub>Next.js · Supabase · pgvector · OpenAI · Gemini · Mistral · Cohere</sub>
</div>
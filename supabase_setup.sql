-- ============================================================
-- RAGChat — Supabase Setup (4 Providers)
-- Run this in Supabase SQL Editor → New Query → Run
-- If you already ran the previous version, run the
-- MIGRATION section at the bottom instead of the full script.
-- ============================================================

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  source_type text default 'file',
  source_url  text,
  chunk_count integer default 0,
  provider    text not null,
  created_at  timestamptz default now()
);

-- 3. Chunks table — one embedding column per provider
create table if not exists chunks (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid references documents(id) on delete cascade,
  content          text not null,
  chunk_index      integer default 0,
  embedding_openai  vector(1536),   -- OpenAI text-embedding-3-small
  embedding_gemini  vector(768),    -- Gemini text-embedding-004
  embedding_mistral vector(1024),   -- Mistral mistral-embed
  embedding_cohere  vector(1024),   -- Cohere embed-english-v3.0
  created_at       timestamptz default now()
);

-- 4. Indexes
create index if not exists idx_chunks_openai  on chunks using ivfflat (embedding_openai  vector_cosine_ops) with (lists = 100);
create index if not exists idx_chunks_gemini  on chunks using ivfflat (embedding_gemini  vector_cosine_ops) with (lists = 100);
create index if not exists idx_chunks_mistral on chunks using ivfflat (embedding_mistral vector_cosine_ops) with (lists = 100);
create index if not exists idx_chunks_cohere  on chunks using ivfflat (embedding_cohere  vector_cosine_ops) with (lists = 100);

-- ─── OpenAI match functions ───────────────────────────────────────────────────
create or replace function match_chunks_openai(query_embedding vector(1536), match_threshold float, match_count int)
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_openai <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.embedding_openai is not null
    and 1 - (c.embedding_openai <=> query_embedding) > match_threshold
  order by c.embedding_openai <=> query_embedding limit match_count;
$$;

create or replace function match_chunks_openai_by_doc(query_embedding vector(1536), match_threshold float, match_count int, doc_ids uuid[])
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_openai <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.document_id = any(doc_ids) and c.embedding_openai is not null
    and 1 - (c.embedding_openai <=> query_embedding) > match_threshold
  order by c.embedding_openai <=> query_embedding limit match_count;
$$;

-- ─── Gemini match functions ───────────────────────────────────────────────────
create or replace function match_chunks_gemini(query_embedding vector(768), match_threshold float, match_count int)
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_gemini <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.embedding_gemini is not null
    and 1 - (c.embedding_gemini <=> query_embedding) > match_threshold
  order by c.embedding_gemini <=> query_embedding limit match_count;
$$;

create or replace function match_chunks_gemini_by_doc(query_embedding vector(768), match_threshold float, match_count int, doc_ids uuid[])
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_gemini <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.document_id = any(doc_ids) and c.embedding_gemini is not null
    and 1 - (c.embedding_gemini <=> query_embedding) > match_threshold
  order by c.embedding_gemini <=> query_embedding limit match_count;
$$;

-- ─── Mistral match functions ──────────────────────────────────────────────────
create or replace function match_chunks_mistral(query_embedding vector(1024), match_threshold float, match_count int)
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_mistral <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.embedding_mistral is not null
    and 1 - (c.embedding_mistral <=> query_embedding) > match_threshold
  order by c.embedding_mistral <=> query_embedding limit match_count;
$$;

create or replace function match_chunks_mistral_by_doc(query_embedding vector(1024), match_threshold float, match_count int, doc_ids uuid[])
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_mistral <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.document_id = any(doc_ids) and c.embedding_mistral is not null
    and 1 - (c.embedding_mistral <=> query_embedding) > match_threshold
  order by c.embedding_mistral <=> query_embedding limit match_count;
$$;

-- ─── Cohere match functions ───────────────────────────────────────────────────
create or replace function match_chunks_cohere(query_embedding vector(1024), match_threshold float, match_count int)
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_cohere <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.embedding_cohere is not null
    and 1 - (c.embedding_cohere <=> query_embedding) > match_threshold
  order by c.embedding_cohere <=> query_embedding limit match_count;
$$;

create or replace function match_chunks_cohere_by_doc(query_embedding vector(1024), match_threshold float, match_count int, doc_ids uuid[])
returns table (id uuid, document_id uuid, document_name text, content text, similarity float)
language sql stable as $$
  select c.id, c.document_id, d.name, c.content,
         1 - (c.embedding_cohere <=> query_embedding) as similarity
  from chunks c join documents d on d.id = c.document_id
  where c.document_id = any(doc_ids) and c.embedding_cohere is not null
    and 1 - (c.embedding_cohere <=> query_embedding) > match_threshold
  order by c.embedding_cohere <=> query_embedding limit match_count;
$$;

-- ============================================================
-- MIGRATION (run this ONLY if you already have the old tables)
-- ============================================================
-- alter table chunks add column if not exists embedding_mistral vector(1024);
-- alter table chunks add column if not exists embedding_cohere  vector(1024);
-- ============================================================
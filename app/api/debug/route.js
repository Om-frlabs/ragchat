// 📁 ragchat/app/api/debug/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  const info = {
    env: {
      SUPABASE_URL_set: !!url,
      SUPABASE_URL_value: url || "MISSING",
      SERVICE_KEY_set: !!key,
      SERVICE_KEY_prefix: key ? key.slice(0, 20) + "..." : "MISSING",
    },
  };

  if (!url || !key) {
    return NextResponse.json({ ...info, error: "Missing env vars" });
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Test 1: list documents
    const { data: docs, error: docsErr } = await supabase
      .from("documents")
      .select("id, name, provider, created_at")
      .order("created_at", { ascending: false });

    // Test 2: count chunks
    const { count, error: chunksErr } = await supabase
      .from("chunks")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      ...info,
      documents: docs || [],
      documents_error: docsErr?.message || null,
      chunk_count: count,
      chunks_error: chunksErr?.message || null,
    });
  } catch (e) {
    return NextResponse.json({ ...info, fatal: e.message });
  }
}
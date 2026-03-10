// 📁 ragchat/app/api/documents/[id]/route.js
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const { id } = params;
  // Chunks cascade-delete via FK
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
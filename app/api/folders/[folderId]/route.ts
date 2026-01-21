import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ParamsPromise = Promise<{ folderId: string }>;

export async function DELETE(_req: Request, { params }: { params: ParamsPromise }) {
  const { folderId } = await params;

  if (!folderId) {
    return NextResponse.json({ error: "missing folderId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("folders").delete().eq("id", folderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: ParamsPromise }) {
  const { folderId } = await params;

  if (!folderId) {
    return NextResponse.json({ error: "missing folderId" }, { status: 400 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const title = (body?.title ?? "").toString().trim();

  if (!title) {
    return NextResponse.json({ error: "missing title" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // (optionnel mais conseillé) sécurise: only update user's folder
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("folders")
    .update({ title })
    .eq("id", folderId)
    .eq("user_id", userId)
    .select("id,title")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "folder not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, folder: data });
}
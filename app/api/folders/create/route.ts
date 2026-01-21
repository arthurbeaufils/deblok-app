import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return new NextResponse("Not authenticated", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" && body.title.trim().length
    ? body.title.trim()
    : "Nouveau chat";

  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: userData.user.id, title })
    .select("id,title")
    .single();

  if (error) return new NextResponse(error.message, { status: 400 });

  return NextResponse.json({ id: data.id, title: data.title });
}
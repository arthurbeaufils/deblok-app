import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AppIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) redirect("/login");

  const { data: folders } = await supabase
    .from("folders")
    .select("id,created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const first = folders?.[0];

  if (first?.id) {
    redirect(`/app/${first.id}`);
  }

  const { data: created, error } = await supabase
    .from("folders")
    .insert({ user_id: userData.user.id, title: "Nouveau chat" })
    .select("id")
    .single();

  if (error || !created?.id) redirect("/app");

  redirect(`/app/${created.id}`);
}
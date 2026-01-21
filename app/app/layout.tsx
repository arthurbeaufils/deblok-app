import { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Sidebar from "./components/Sidebar";

export const runtime = "nodejs";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let folders: { id: string; title: string | null }[] = [];

  if (user) {
    const { data } = await supabase
      .from("folders")
      .select("id,title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    folders = data ?? [];
  }

  return (
    <div className="min-h-screen bg-black text-white lg:flex">
      <Sidebar brand="DEBLOK" email={user?.email ?? null} folders={folders} />
      <div className="flex-1">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>
    </div>
  );
}
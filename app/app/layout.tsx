import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Sidebar from "./components/Sidebar";
import MobileShell from "./components/MobileShell";

export const runtime = "nodejs";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-white/70">Tu n’es pas connecté.</div>
      </div>
    );
  }

  const user = userData.user;

  const { data: folders } = await supabase
    .from("folders")
    .select("id,title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <MobileShell
      sidebar={
        <Sidebar
          brand="DEBLOK"
          email={user.email ?? null}
          folders={folders ?? []}
        />
      }
    >
      {children}
    </MobileShell>
  );
}
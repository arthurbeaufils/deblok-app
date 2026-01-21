
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import ChatClient from "./ChatClient";

export const runtime = "nodejs";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-3xl text-white/70">
          Tu n’es pas connecté.
        </div>
      </main>
    );
  }

  const { data: folder } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!folder) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <div className="mx-auto max-w-3xl text-white/70">
          Dossier introuvable.
        </div>
      </main>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen">
      <ChatClient folderId={folder.id} />
    </div>
  );
}
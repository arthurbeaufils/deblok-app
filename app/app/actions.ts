"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RenamePayload =
  | FormData
  | {
      id: string;
      title: string;
    };

type DeletePayload =
  | FormData
  | {
      id: string;
    };

type CreatePayload =
  | FormData
  | {
      title?: string;
    };

function readString(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function createFolder(payload?: CreatePayload) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  let title = "Nouveau dossier";
  if (payload instanceof FormData) {
    const t = readString(payload, "title").trim();
    if (t) title = t;
  } else if (payload?.title?.trim()) {
    title = payload.title.trim();
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: user.id, title })
    .select("id,title")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  return { ok: true, folder: data };
}

export async function renameFolder(payload: RenamePayload) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  let id = "";
  let title = "";

  if (payload instanceof FormData) {
    id = readString(payload, "id").trim();
    title = readString(payload, "title").trim();
  } else {
    id = String(payload?.id || "").trim();
    title = String(payload?.title || "").trim();
  }

  if (!id || !title) return { ok: false, error: "missing_fields" };

  const { data, error } = await supabase
    .from("folders")
    .update({ title })
    .eq("id", id)
    .eq("user_id", user.id) // sécurité : tu updates que tes dossiers
    .select("id,title")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath(`/app/${id}`);
  return { ok: true, folder: data };
}

export async function deleteFolder(payload: DeletePayload) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  let id = "";
  if (payload instanceof FormData) id = readString(payload, "id").trim();
  else id = String(payload?.id || "").trim();

  if (!id) return { ok: false, error: "missing_id" };

  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  return { ok: true };
}
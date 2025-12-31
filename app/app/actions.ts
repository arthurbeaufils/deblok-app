"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function createFolder() {
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("folders")
    .insert([{ user_id: userData.user.id, title: "Nouveau dossier" }])
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app");
  redirect(`/app/${data.id}`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

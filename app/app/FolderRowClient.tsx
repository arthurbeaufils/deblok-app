"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFolder, renameFolder } from "./actions";

type Props = {
  id: string;
  title: string | null;
};

export default function FolderRowClient({ id, title }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const displayTitle = title?.trim() ? title : "Sans nom";

  function onRename() {
    const next = window.prompt("Nouveau nom du dossier :", displayTitle);
    if (!next) return;

    const cleaned = next.trim();
    if (!cleaned) return;

   startTransition(async () => {
  await renameFolder({ id, title: cleaned });
  router.refresh(); // ✅ force la sidebar / page à se recalculer
    });
  }

  function onDelete() {
    const ok = window.confirm("Supprimer ce dossier ? (action irréversible)");
    if (!ok) return;

    startTransition(async () => {
      await deleteFolder(id);
      router.refresh(); // ✅
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/app/${id}`}
          className="truncate text-lg font-semibold hover:underline"
          title={displayTitle}
        >
          {displayTitle}
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRename}
            disabled={isPending}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
          >
            Renommer
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
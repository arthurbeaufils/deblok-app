"use client";

import { useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

import {
  createFolder,
  deleteFolder,
  renameFolder,
} from "@/app/actions/folders";

type Folder = {
  id: string;
  title: string | null;
};

type SidebarProps = {
  brand: string;
  email: string | null;
  folders: Folder[];
};

export default function Sidebar({ brand, email, folders }: SidebarProps) {
  const router = useRouter();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  /* ================================
     Actions
  ================================ */

  const handleCreateFolder = () => {
    startTransition(async () => {
      await createFolder();
      router.refresh();
    });
  };

  const handleDeleteFolder = (id: string) => {
    startTransition(async () => {
      await deleteFolder({ folderId: id });
      router.refresh();
    });
  };

  const handleRenameFolder = (id: string) => {
    const cleaned = renameValue.trim();
    if (!cleaned) return;

    startTransition(async () => {
      await renameFolder({ folderId: id, title: cleaned });
      setRenamingId(null);
      setRenameValue("");
      router.refresh();
    });
  };

  /* ================================
     Render
  ================================ */

  return (
    <aside className="w-72 border-r border-white/10 bg-black p-4 flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">{brand}</h1>
        {email && <p className="text-xs text-white/50">{email}</p>}
      </div>

      {/* New chat */}
      <button
        onClick={handleCreateFolder}
        className="mb-4 flex items-center gap-2 rounded-lg bg-white text-black px-3 py-2 text-sm font-medium hover:bg-white/90"
      >
        <Plus size={16} />
        Nouveau chat
      </button>

      {/* Folders */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
          >
            {/* Title / Rename */}
            {renamingId === folder.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameFolder(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameFolder(folder.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="w-full bg-black text-sm outline-none"
              />
            ) : (
              <span className="truncate text-sm">
                {folder.title ?? "Nouveau dossier"}
              </span>
            )}

            {/* Actions */}
            <div className="ml-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => {
                  setRenamingId(folder.id);
                  setRenameValue(folder.title ?? "");
                }}
                className="text-white/50 hover:text-white"
              >
                <Pencil size={14} />
              </button>

              <button
                onClick={() => handleDeleteFolder(folder.id)}
                className="text-white/50 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
"use client";

import React, { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";

type Folder = {
  id: string;
  title: string | null;
};

type SidebarProps = {
  brand?: string;
  email?: string | null;
  folders: Folder[];
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Sidebar({ brand = "DEBLOK", email, folders }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const activeFolderId = useMemo(() => {
    // attend des routes du style /app/<uuid>
    const m = pathname?.match(/^\/app\/([^/]+)$/);
    return m?.[1] ?? null;
  }, [pathname]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");

  async function createFolder() {
    const res = await fetch("/api/folders/create", {
      method: "POST",
      cache: "no-store",
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`create failed: ${res.status} ${t}`);
    }

    const data = (await res.json()) as { id?: string };
    if (!data?.id) throw new Error("create failed: missing id");
    return data.id;
  }

  async function renameFolder(folderId: string, title: string) {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`rename failed: ${res.status} ${t}`);
    }
  }

  async function deleteFolder(folderId: string) {
    const res = await fetch(`/api/folders/${folderId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`delete failed: ${res.status} ${t}`);
    }
  }

  const handleNewChat = () => {
    startTransition(async () => {
      try {
        const id = await createFolder();
        router.push(`/app/${id}`);
        router.refresh(); // ✅ force recalcul server components (layout/sidebar data)
      } catch (e) {
        console.error(e);
        alert("Impossible de créer un nouveau chat.");
      }
    });
  };

  const startRename = (f: Folder) => {
    setEditingId(f.id);
    setDraftTitle((f.title ?? "").trim() || "Sans nom");
  };

  const confirmRename = (folderId: string) => {
    const cleaned = draftTitle.trim() || "Sans nom";

    startTransition(async () => {
      try {
        await renameFolder(folderId, cleaned);
        setEditingId(null);
        router.refresh(); // ✅ met à jour la liste des dossiers
      } catch (e) {
        console.error(e);
        alert("Rename impossible.");
      }
    });
  };

  const handleDelete = (folderId: string) => {
    if (!confirm("Supprimer ce dossier ?")) return;

    startTransition(async () => {
      try {
        // si tu es dedans, on revient à /app après suppression
        const wasActive = activeFolderId === folderId;

        await deleteFolder(folderId);

        if (wasActive) router.push("/app");
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("Suppression impossible.");
      }
    });
  };

  return (
    <aside className="w-[320px] shrink-0 border-r border-white/10 bg-black text-white h-screen flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="text-lg font-semibold tracking-wide">{brand}</div>
        {email ? <div className="text-xs text-white/60 mt-1">{email}</div> : null}

        <button
          type="button"
          onClick={handleNewChat}
          disabled={isPending}
          className={clsx(
            "mt-4 w-full rounded-xl px-4 py-2 flex items-center justify-center gap-2",
            "bg-white text-black hover:bg-white/90 transition",
            isPending && "opacity-60 cursor-not-allowed"
          )}
        >
          <Plus size={18} />
          Nouveau chat
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-xs text-white/50 mb-3">DOSSIERS</div>

        <div className="space-y-2">
          {folders.map((f) => {
            const isActive = activeFolderId === f.id;
            const title = (f.title ?? "").trim() || "Sans nom";

            return (
              <div
                key={f.id}
                className={clsx(
                  "rounded-xl border border-white/10",
                  isActive ? "bg-white/5" : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* Title / Edit */}
                  <div className="flex-1 min-w-0">
                    {editingId === f.id ? (
                      <input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename(f.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => confirmRename(f.id)}
                        className="w-full bg-black border border-white/20 rounded-lg px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/app/${f.id}`)}
                        className={clsx(
                          "w-full text-left truncate text-sm",
                          isActive ? "text-white" : "text-white/85 hover:text-white"
                        )}
                      >
                        {title}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => startRename(f)}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
                    title="Renommer"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {folders.length === 0 ? (
            <div className="text-sm text-white/50 py-6">
              Aucun dossier. Clique sur “Nouveau chat”.
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => router.push("/logout")}
          className="w-full rounded-xl border border-white/15 px-4 py-2 flex items-center justify-center gap-2 text-white/80 hover:text-white hover:bg-white/5 transition"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
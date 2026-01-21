"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";

type Folder = { id: string; title: string | null };

type Props = {
  /** Si ton layout te passe déjà les dossiers, mets-les ici */
  initialFolders?: Folder[];
  /** Optionnel : email affiché */
  email?: string | null;
};

export default function Sidebar({ initialFolders = [], email }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [loading, setLoading] = useState<boolean>(initialFolders.length === 0);

  // ✅ sélection stable (pas de state qui clignote)
  const selectedFolderId = useMemo(() => {
    // on vise /app/<folderId>
    // exemples: /app/412c... , /app/412c...?x=y
    const parts = (pathname || "").split("?")[0].split("/").filter(Boolean);
    const appIdx = parts.indexOf("app");
    if (appIdx === -1) return null;
    const id = parts[appIdx + 1];
    return id ?? null;
  }, [pathname]);

  // 🔄 Charge la liste si pas fournie
  useEffect(() => {
    let ignore = false;

    async function load() {
      if (initialFolders.length > 0) return;
      setLoading(true);
      try {
        const res = await fetch("/api/folders", { cache: "no-store" });
        if (!res.ok) throw new Error("folders fetch failed");
        const data = await res.json();
        if (!ignore && Array.isArray(data?.folders)) {
          setFolders(data.folders);
        }
      } catch {
        // si tu n’as pas /api/folders, ce catch évite de casser l’UI
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [initialFolders.length]);

  async function createFolder() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/folders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Nouveau dossier" }),
        });

        if (!res.ok) throw new Error("create failed");

        const data = await res.json();
        const folder: Folder | undefined = data?.folder;

        if (folder?.id) {
          setFolders((prev) => [folder, ...prev]);
          router.push(`/app/${folder.id}`);
          router.refresh();
        }
      } catch (e) {
        console.error(e);
        alert("Impossible de créer un dossier.");
      }
    });
  }

  async function renameFolder(folderId: string, currentTitle: string | null) {
    const next = prompt("Nouveau nom du dossier :", currentTitle?.trim() || "");
    if (next === null) return;

    const title = next.trim();
    if (!title) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (!res.ok) throw new Error("rename failed");

        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, title } : f))
        );

        // ✅ force les server components à recharger le titre en haut
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("Impossible de renommer.");
      }
    });
  }

  async function deleteFolder(folderId: string) {
    const ok = confirm("Supprimer ce dossier ? (action irréversible)");
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/folders/${folderId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("delete failed");

        setFolders((prev) => prev.filter((f) => f.id !== folderId));

        // si tu supprimes celui ouvert, on renvoie vers /app
        if (selectedFolderId === folderId) {
          router.push("/app");
        }
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("Impossible de supprimer.");
      }
    });
  }

  return (
    <aside className="w-[320px] shrink-0 h-screen bg-black/60 border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-2xl font-semibold text-white tracking-wide">
          DEBLOK
        </div>
        <div className="mt-1 text-sm text-white/60 truncate">
          {email || ""}
        </div>

        {/* Bouton nouveau chat (compact) */}
        <button
          onClick={createFolder}
          disabled={isPending}
          className="mt-4 w-full h-10 rounded-2xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          Nouveau chat
        </button>
      </div>

      {/* Liste dossiers */}
      <div className="px-5">
        <div className="text-xs tracking-widest text-white/50 font-semibold mb-3">
          DOSSIERS
        </div>
      </div>

      <div className="px-5 pb-4 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {loading && folders.length === 0 ? (
          <div className="text-sm text-white/50">Chargement…</div>
        ) : folders.length === 0 ? (
          <div className="text-sm text-white/50">
            Aucun dossier. Crée ton premier “Nouveau chat”.
          </div>
        ) : (
          <div className="space-y-2">
            {folders.map((f) => {
              const isActive = selectedFolderId === f.id;

              return (
                <div
                  key={f.id}
                  className={[
                    "rounded-2xl border transition",
                    isActive
                      ? "border-white/60 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/7",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Link
                      href={`/app/${f.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="text-sm text-white font-medium truncate">
                        {f.title?.trim() || "Sans nom"}
                      </div>
                    </Link>

                    {/* Icônes petites */}
                    <button
                      onClick={() => renameFolder(f.id, f.title)}
                      disabled={isPending}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition disabled:opacity-60"
                      title="Renommer"
                      aria-label="Renommer"
                    >
                      <Pencil className="w-4 h-4 text-white/80" />
                    </button>

                    <button
                      onClick={() => deleteFolder(f.id)}
                      disabled={isPending}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/20 hover:bg-white/10 transition disabled:opacity-60"
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-white/80" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-6 pt-3 border-t border-white/10">
        <button
          onClick={() => {
            // adapte si tu as une route logout
            startTransition(async () => {
              try {
                await fetch("/api/auth/signout", { method: "POST" });
              } catch {}
              router.push("/login");
              router.refresh();
            });
          }}
          className="w-full h-10 rounded-2xl border border-white/15 text-white/80 hover:bg-white/5 transition text-sm"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
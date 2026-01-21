"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Folder = { id: string; title: string | null };

export default function ClientSidebar({
  brand,
  email,
  folders,
  createFolderForm,
  signOutForm,
}: {
  brand: string;
  email: string | null;
  folders: Folder[];
  createFolderForm: React.ReactNode;
  signOutForm: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ferme le drawer quand on change de route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeId = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "app" && parts[1]) return parts[1];
    return null;
  }, [pathname]);

  const FolderList = (
    <div className="mt-2 space-y-1 overflow-y-auto pr-1" style={{ maxHeight: "58vh" }}>
      {folders?.length ? (
        folders.map((f) => {
          const isActive = activeId === String(f.id);
          return (
            <Link
              key={f.id}
              href={`/app/${f.id}`}
              className={[
                "block rounded-xl px-3 py-2 text-sm border",
                isActive ? "border-white/25 bg-white/10" : "border-white/10 hover:bg-white/5",
              ].join(" ")}
              title={f.title ?? ""}
            >
              <div className="truncate">{f.title || "Sans nom"}</div>
            </Link>
          );
        })
      ) : (
        <div className="mt-3 text-sm text-white/50">Aucun dossier pour l’instant.</div>
      )}
    </div>
  );

  const SidebarContent = (
    <div className="h-full w-[300px] bg-black text-white border-r border-white/10 p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">{brand}</div>
          {email && <div className="mt-0.5 text-xs text-white/50">{email}</div>}
        </div>

        {/* bouton fermer (mobile uniquement) */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
        >
          Fermer
        </button>
      </div>

      {/* Nouveau chat => revient sur /app */}
      <div className="mt-4">
        <Link
          href="/app"
          className="block w-full rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-black"
        >
          + Nouveau chat
        </Link>
      </div>

      <div className="mt-5 text-[11px] tracking-widest text-white/40">DOSSIERS</div>
      {FolderList}

      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        {createFolderForm}
        {signOutForm}
      </div>
    </div>
  );

  return (
    <>
      {/* TOP BAR MOBILE (bouton menu) */}
      <div className="lg:hidden sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-white/10 px-3 py-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
        >
          ☰ Menu
        </button>
      </div>

      {/* SIDEBAR DESKTOP (fixe) */}
      <aside className="hidden lg:block h-screen sticky top-0">{SidebarContent}</aside>

      {/* DRAWER MOBILE */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-0 left-0 z-50 h-screen">{SidebarContent}</div>
        </>
      )}
    </>
  );
}
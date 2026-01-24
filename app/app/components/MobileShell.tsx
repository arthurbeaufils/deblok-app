"use client";

import { ReactNode, useEffect, useState } from "react";

export default function MobileShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Ferme le menu quand on passe en desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop */}
      <div className="hidden lg:flex min-h-screen">
        <aside className="w-[320px] shrink-0 border-r border-white/10">
          {sidebar}
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile */}
      <div className="lg:hidden min-h-screen">
        {/* Top bar */}
        <div className="h-12 flex items-center gap-3 px-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <div className="font-semibold tracking-wide">DEBLOK</div>
        </div>

        {/* Content full page */}
        <main className="min-h-[calc(100vh-48px)]">{children}</main>

        {/* Drawer overlay */}
        {open && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[86%] max-w-[340px] bg-black border-r border-white/10">
              <div className="h-12 flex items-center justify-between px-3 border-b border-white/10">
                <div className="font-semibold">Menu</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
                >
                  ✕
                </button>
              </div>
              <div
                onClick={(e) => {
                  // si l’utilisateur clique sur un dossier (lien), on ferme
                  const target = e.target as HTMLElement;
                  const a = target.closest("a");
                  if (a) setOpen(false);
                }}
              >
                {sidebar}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
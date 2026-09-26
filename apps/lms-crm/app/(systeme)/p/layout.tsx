import type { ReactNode } from 'react';

/** Pages espace client (devis public) — hors CRM, avec repère institutionnel minimal. */
export default function PublicClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/20">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/formssi-icon.png"
              alt=""
              className="size-7 shrink-0 object-contain"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Espace client — proposition commerciale</p>
              <p className="text-[10px] text-muted-foreground truncate">
                Lien personnel sécurisé — ne pas partager
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

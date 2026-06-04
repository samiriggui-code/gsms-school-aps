import type { ReactNode } from 'react';

/** Pages « espace client » : hors layout CRM (pas de sidebar). */
export default function PublicClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/20">
      <header className="border-b border-border/60 bg-background/95 py-2.5 text-center text-[11px] text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
        Consultation sécurisée — ne partagez pas l’URL reçue par e-mail.
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}

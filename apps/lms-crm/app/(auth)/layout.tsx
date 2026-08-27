import { ReactNode } from 'react';

/** Pas de force-dynamic : pages auth = UI client + i18n, zéro data serveur. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen w-full">{children}</div>;
}

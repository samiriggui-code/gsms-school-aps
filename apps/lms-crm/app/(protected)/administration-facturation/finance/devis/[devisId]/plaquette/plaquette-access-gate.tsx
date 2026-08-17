import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export function PlaquetteAccessGate({
  reason,
}: {
  reason: 'missing' | 'invalid' | 'expired';
}) {
  const copy =
    reason === 'missing'
      ? {
          title: 'Lien incomplet',
          body: 'Cette page nécessite le lien personnel reçu par e-mail (paramètre de sécurité). Demandez un nouveau lien à votre conseiller.',
        }
      : reason === 'expired'
        ? {
            title: 'Lien expiré',
            body: 'Ce lien de consultation n’est plus valable. Contactez votre organisme pour recevoir un nouveau lien.',
          }
        : {
            title: 'Lien non valide',
            body: 'Le jeton de sécurité est incorrect ou a été modifié. Utilisez le lien exact reçu par e-mail.',
          };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto size-10 text-amber-600" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        <p className="mt-6 text-xs text-muted-foreground">
          Aucun compte sur le CRM n’est requis : seul le lien signé permet d’accéder à la proposition.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Retour au site
        </Link>
      </div>
    </div>
  );
}

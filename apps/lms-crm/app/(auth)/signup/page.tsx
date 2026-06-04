import Link from 'next/link';

export default function Page() {
  return (
    <div className="w-full space-y-5 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Inscription desactivee</h1>
      <p className="text-sm text-muted-foreground">
        La creation de compte est desactivee sur cet environnement.
      </p>
      <div className="pt-2">
        <Link href="/signin" className="text-sm font-semibold text-foreground hover:text-primary">
          Retour a la connexion
        </Link>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-5 text-center">
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
    </div>
  );
}

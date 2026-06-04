import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-6 text-center">
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/19.svg')}
          className="dark:hidden max-h-[160px]"
          alt="image"
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/19-dark.svg')}
          className="hidden dark:block max-h-[160px]"
          alt="image"
        />
      </div>

      <span className="badge badge-primary badge-outline mb-3">Erreur 404</span>

      <h3 className="text-2xl font-semibold text-mono mb-2">
        Page introuvable
      </h3>

      <div className="text-base text-secondary-foreground mb-10 max-w-md">
        La page demandée n'existe pas. Vérifiez l'URL ou&nbsp;
        <Link
          href="/"
          className="text-primary font-medium hover:text-primary-active"
        >
          retournez à l'accueil
        </Link>
        .
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import { E_FORMATION_BASE } from '@/lib/portal/e-formation-paths';

type Props = {
  href?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

/** CTA flottant — démarre l’e-formation depuis Mon dossier. */
export function StartFormationFab({
  href = E_FORMATION_BASE,
  label = 'Démarrer ma formation',
  disabled = false,
  className,
}: Props) {
  if (disabled) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:justify-end lg:pr-8',
        className,
      )}
    >
      <Button
        asChild
        size="lg"
        className="pointer-events-auto h-12 gap-2 rounded-full px-6 shadow-lg shadow-primary/25"
      >
        <Link href={href}>
          <PlayCircle className="size-5" />
          {label}
        </Link>
      </Button>
    </div>
  );
}

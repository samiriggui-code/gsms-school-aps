'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Width = 'full' | 'wide' | 'narrow';

const widthClass: Record<Width, string> = {
  full: 'max-w-[1400px]',
  wide: 'max-w-6xl',
  narrow: 'max-w-4xl',
};

export function PortalPageShell({
  children,
  width = 'wide',
  className,
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full min-w-0 px-4 pb-10 pt-1 lg:px-6',
        widthClass[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { BrandedLayout } from './layouts/branded';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <BrandedLayout>{children}</BrandedLayout>
    </div>
  );
}

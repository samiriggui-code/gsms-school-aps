'use client';

import Link from 'next/link';
import { ChevronFirst } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@repo/ui/button';

/** Calqué sur `demo1/components/sidebar-header.tsx`. */
export function PortalSidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption('layouts.demo1.sidebarCollapse', !settings.layouts.demo1.sidebarCollapse);
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link href="/mon-dossier" className="inline-block shrink-0 py-1.75">
        <div className="dark:hidden">
          <img
            src={toAbsoluteUrl('/brand/formssi-logo-light.png')}
            className="default-logo h-[42px] max-w-[min(100%,260px)] object-contain object-left"
            alt="FORM'SSI"
          />
          <img
            src={toAbsoluteUrl('/brand/formssi-icon.png')}
            className="small-logo h-[32px] max-w-none object-contain object-left"
            alt="FORM'SSI"
          />
        </div>
        <div className="hidden dark:block">
          <img
            src={toAbsoluteUrl('/brand/formssi-logo-full.png')}
            className="default-logo h-[46px] max-w-[min(100%,260px)] object-contain object-left"
            alt="FORM'SSI"
          />
          <img
            src={toAbsoluteUrl('/brand/formssi-icon.png')}
            className="small-logo h-[32px] max-w-none object-contain object-left"
            alt="FORM'SSI"
          />
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse ? 'ltr:rotate-180' : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}

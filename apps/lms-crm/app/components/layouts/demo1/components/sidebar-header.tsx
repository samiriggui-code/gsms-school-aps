'use client';

import Link from 'next/link';
import { ChevronFirst } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@repo/ui/button';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-2.5 lg:px-3 shrink-0">
      <Link href="/">
        {/* Clair : logo clair. Sombre : logo complet. Sidebar réduite : pictogramme. */}
        <div className="dark:hidden">
          <img
            src={toAbsoluteUrl('/brand/formssi-logo-light.png')}
            className="default-logo h-9 max-w-[min(100%,11.5rem)] object-contain object-left"
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
            className="default-logo h-9 max-w-[min(100%,11.5rem)] object-contain object-left"
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
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}

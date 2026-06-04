'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const LOGO_LIGHT = '/brand/formssi-logo-light.png';
const LOGO_DARK = '/brand/formssi-logo-dark.png';

/** Mode clair : logo cyan. Mode sombre : logo complet avec baseline blanche. */
const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Link href="/" className="flex h-9 max-w-full items-center" aria-label="FORM'SSI">
        <span className="inline-block h-8 w-28 max-w-full rounded-md bg-muted/40 animate-pulse sm:h-10 sm:w-32" />
      </Link>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const src = isDark ? LOGO_DARK : LOGO_LIGHT;

  return (
    <Link href="/" className="flex max-w-full min-w-0 items-center" aria-label="FORM'SSI">
      <Image
        src={src}
        alt="FORM'SSI — École de formation en sécurité & sécurité incendie"
        width={280}
        height={64}
        priority
        className="h-8 w-auto max-w-[min(100vw-10rem,17rem)] object-contain object-left sm:h-10 sm:max-w-[280px]"
      />
    </Link>
  );
};

export default Logo;

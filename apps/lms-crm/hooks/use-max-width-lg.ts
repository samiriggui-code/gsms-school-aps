'use client';

import { useEffect, useState } from 'react';

/** `true` quand la largeur est sous le breakpoint Tailwind `lg` (1024px). */
export function useMaxWidthLg() {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);
  return matches;
}

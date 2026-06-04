'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';

const MIN_VISIBLE_MS = 350;

type NavigationLoadingContextValue = {
  startNavigation: () => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(
  null,
);

function isInternalAppHref(href: string, origin: string): boolean {
  if (!href || href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return false;
    return url.pathname.startsWith('/');
  } catch {
    return href.startsWith('/');
  }
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;

  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showStartedAtRef = useRef(0);
  const routeKeyRef = useRef(routeKey);
  const isFirstRouteRef = useRef(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startNavigation = useCallback(() => {
    clearHideTimer();
    showStartedAtRef.current = Date.now();
    setVisible(true);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    const elapsed = Date.now() - showStartedAtRef.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, delay);
  }, [clearHideTimer]);

  /** Clic sur un lien interne → overlay avant que la route change. */
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || !isInternalAppHref(href, window.location.origin)) return;

      let targetPath = href;
      try {
        targetPath = new URL(href, window.location.origin).pathname + new URL(href, window.location.origin).search;
      } catch {
        // href relatif simple
      }

      const current = routeKeyRef.current;
      if (targetPath === current || targetPath === pathname) return;

      startNavigation();
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [pathname, startNavigation]);

  /** Toute navigation (lien, router.push, précédent/suivant) → overlay puis masquage. */
  useEffect(() => {
    if (isFirstRouteRef.current) {
      isFirstRouteRef.current = false;
      routeKeyRef.current = routeKey;
      return;
    }
    if (routeKeyRef.current === routeKey) return;

    routeKeyRef.current = routeKey;
    if (!visible) {
      showStartedAtRef.current = Date.now();
      setVisible(true);
    }
    scheduleHide();
  }, [routeKey, visible, scheduleHide]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  return (
    <NavigationLoadingContext.Provider value={{ startNavigation }}>
      {children}
      {visible ? <RouteTransitionLoader /> : null}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) {
    return { startNavigation: () => {} };
  }
  return ctx;
}

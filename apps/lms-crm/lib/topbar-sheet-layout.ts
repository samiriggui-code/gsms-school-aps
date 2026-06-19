import { cn } from '@/lib/utils';

export const TOPBAR_SHEET_CONTENT_CLASS = cn(
  'flex max-w-none flex-col gap-0 overflow-hidden p-0',
  // Mobile : plein écran (drawer natif)
  'max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:rounded-none max-sm:border-0',
  // Tablette + desktop : panneau flottant à droite
  'sm:inset-x-auto sm:inset-y-3 sm:end-3 sm:start-auto',
  'sm:h-auto sm:max-h-[calc(100dvh-1.5rem)]',
  'sm:w-[min(100vw-1.5rem,26rem)] sm:rounded-xl sm:border sm:border-border sm:shadow-xl',
  'md:end-4 md:inset-y-4 md:w-[min(100vw-2rem,30rem)]',
  'lg:w-[min(100vw-2rem,28rem)]',
  '[&_[data-slot=sheet-close]]:top-[max(0.75rem,env(safe-area-inset-top))]',
  '[&_[data-slot=sheet-close]]:end-[max(0.75rem,env(safe-area-inset-right))]',
  'sm:[&_[data-slot=sheet-close]]:top-4 sm:[&_[data-slot=sheet-close]]:end-4',
);

export const TOPBAR_SHEET_HEADER_CLASS = cn(
  'shrink-0 border-b border-border text-start',
  'px-3 pe-11 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]',
  'sm:px-4 sm:pe-12 sm:pt-3',
);

export const TOPBAR_SHEET_BODY_CLASS = cn('min-h-0 flex-1 overflow-hidden p-0');

export const TOPBAR_SHEET_SCROLL_CLASS = cn('h-full min-h-0 flex-1');

export const TOPBAR_SHEET_THREAD_CLASS = cn(
  'flex min-h-0 flex-1 flex-col overflow-hidden',
);

export const TOPBAR_SHEET_FOOTER_CLASS = cn(
  'shrink-0 border-t border-border bg-background',
  'flex !flex-col gap-3',
  'px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
  'sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom))]',
);

export const TOPBAR_SHEET_TABS_LIST_CLASS = cn(
  'h-auto w-full shrink-0 justify-start gap-0 overflow-x-auto',
  'px-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
);

export const TOPBAR_SHEET_TABS_TRIGGER_CLASS = cn(
  'shrink-0 px-2 text-xs sm:px-3 sm:text-sm',
);

/** Padding horizontal listes / cartes dans les sheets topbar */
export const TOPBAR_SHEET_ROW_PADDING = cn('px-3 py-3 sm:px-4 sm:py-4');

/** Boutons d'action empilés sur mobile, ligne sur tablette+ */
export const TOPBAR_SHEET_ACTION_ROW_CLASS = cn(
  'grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2',
);

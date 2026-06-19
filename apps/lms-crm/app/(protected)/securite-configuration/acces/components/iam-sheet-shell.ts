import { cn } from '@/lib/utils';
import { VIE_SCOLAIRE_SHEET_AUTO } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';

/** Coque sheet IAM — alignée sur `UserDetailsSheet`. */
export const IAM_SHEET_CONTENT = cn(
  VIE_SCOLAIRE_SHEET_AUTO,
  'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
);

export const IAM_SHEET_HEADER =
  'border-b border-border bg-background px-4 py-3.5 sm:px-5 shrink-0';

export const IAM_SHEET_TITLE =
  'text-sm font-bold uppercase tracking-wider text-muted-foreground/80';

export const IAM_SHEET_HERO =
  'flex flex-col gap-3 border-b border-border bg-background px-4 py-4 sm:px-5 sm:py-5 shrink-0';

export const IAM_SHEET_BODY =
  'p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background';

export const IAM_SHEET_FOOTER =
  'flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-border bg-background p-4 sm:p-5';

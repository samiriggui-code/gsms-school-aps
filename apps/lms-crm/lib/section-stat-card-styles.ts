/** Classes Tailwind complètes (pas de `bg-${var}` dynamique, ignoré par le JIT). */
export function sectionStatCardToneClasses(color: string): { wrap: string; icon: string } {
  switch (color) {
    case 'success':
      return {
        wrap: 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-950/40 dark:border-emerald-500/25',
        icon: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'destructive':
      return {
        wrap: 'bg-destructive/15 border-destructive/30',
        icon: 'text-destructive',
      };
    case 'info':
      return {
        wrap: 'bg-sky-500/15 border-sky-500/30 dark:bg-sky-950/40 dark:border-sky-500/25',
        icon: 'text-sky-600 dark:text-sky-400',
      };
    case 'warning':
      return {
        wrap: 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-950/35 dark:border-amber-500/25',
        icon: 'text-amber-700 dark:text-amber-400',
      };
    case 'primary':
    default:
      return {
        wrap: 'bg-primary/15 border-primary/25 dark:bg-primary/20 dark:border-primary/30',
        icon: 'text-primary',
      };
  }
}

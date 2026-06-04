/** Coques Sheet partagées — mobile : pleine largeur, marges réduites, hauteur `dvh`. */

/** Fiches larges (candidat, formation, planning, examen…) : hauteur bornée + scroll au body interne. */
export const VIE_SCOLAIRE_SHEET_LARGE =
  'gap-0 w-full min-w-0 lg:w-[1160px] sm:max-w-none inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:inset-x-auto lg:end-5 border rounded-lg p-0 bg-background shadow-2xl flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

/** Formulaires catalogue / fiche programme client : hauteur auto, plafond viewport. */
export const VIE_SCOLAIRE_SHEET_AUTO =
  'gap-0 w-full lg:w-[1160px] sm:max-w-none inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:inset-x-auto lg:end-5 border start-auto h-auto max-h-[calc(100dvh-2rem)] min-h-0 flex flex-col overflow-hidden rounded-lg p-0 bg-background [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

/** Session vitrine / éditeur : `start-auto`, pas de h fixe (contenu pilote la hauteur sous plafond). */
export const VIE_SCOLAIRE_SHEET_SESSION =
  'gap-0 w-full lg:w-[1160px] sm:max-w-none inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:inset-x-auto lg:end-5 border start-auto rounded-lg p-0 bg-background flex max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

/** Même coque que LARGE, largeur desktop 1000px (fiches structure / documents). */
export const VIE_SCOLAIRE_SHEET_LARGE_1000 =
  'gap-0 w-full min-w-0 lg:w-[1000px] sm:max-w-none inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:inset-x-auto lg:end-5 border rounded-lg p-0 bg-background shadow-2xl flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

/** Fiche moyenne (~600px), coins arrondis. */
export const VIE_SCOLAIRE_SHEET_MEDIUM =
  'gap-0 w-full min-w-0 lg:w-[600px] max-w-[min(100%,600px)] sm:max-w-none inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:inset-x-auto lg:end-5 border rounded-2xl p-0 bg-background shadow-xl flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0 flex-col overflow-hidden [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

/** Panneau compact (formulaire court). */
export const VIE_SCOLAIRE_SHEET_COMPACT =
  'gap-0 w-full max-w-md border start-auto inset-y-4 inset-x-3 sm:inset-y-5 sm:inset-x-5 lg:end-5 h-auto max-h-[calc(100dvh-2rem)] min-h-0 flex flex-col overflow-hidden rounded-lg p-0 bg-background [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5';

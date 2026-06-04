/** Avatars livrés dans `public/compagnie-avatars/` (sélection sans upload). */
export const COMPAGNIE_AVATAR_PRESETS = [
  { id: 'violet', src: '/compagnie-avatars/preset-violet.svg', label: 'Neutre violet' },
  { id: 'amber', src: '/compagnie-avatars/preset-amber.svg', label: 'Neutre ambre' },
  { id: 'sky', src: '/compagnie-avatars/preset-sky.svg', label: 'Neutre bleu' },
] as const;

export const DEFAULT_DIRECTOR_AVATAR = COMPAGNIE_AVATAR_PRESETS[0].src;
export const DEFAULT_ADMIN_AVATAR = COMPAGNIE_AVATAR_PRESETS[1].src;

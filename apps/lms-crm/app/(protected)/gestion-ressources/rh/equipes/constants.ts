import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Building2, 
  Store, 
  Globe,
} from 'lucide-react';

/** Types d'équipe — contexte école / CFA (remplace legacy sécurité privée). */
export const TEAM_TYPES = [
  { id: 'PEDAGOGICAL', label: 'Pôle pédagogique', icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'TRAINER_POOL', label: 'Équipe formateurs', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'HR_ADMIN', label: 'RH & administration', icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'QUALITY', label: 'Qualité & conformité', icon: ShieldCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'ADMIN', label: 'Support administratif', icon: Briefcase, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10' },
];

export const TEAM_SECTORS = [
  { id: 'HEADQUARTERS', label: 'Siège / direction', icon: Building2 },
  { id: 'CAMPUS', label: 'Campus / site de formation', icon: Store },
  { id: 'EXTERNAL', label: 'Partenaire / externe', icon: Globe },
];

/** Rétrocompat affichage legacy (données seed anciennes). */
export const LEGACY_TEAM_TYPE_LABELS: Record<string, string> = {
  SECURITE: 'Sécurité (legacy)',
  INCENDIE: 'Incendie (legacy)',
  VOLANTE: 'Équipe volante (legacy)',
  CYNOPHILE: 'Maître-chien (legacy)',
  ADMIN: 'Administratif',
};

export const LEGACY_TEAM_SECTOR_LABELS: Record<string, string> = {
  SIEGE: 'Siège',
  SUCCURSALE: 'Succursale',
  CLIENT: 'Site client',
};

/** Photos réelles disponibles dans `public/` (picker équipe). */
export const TEAM_ILLUSTRATION_OPTIONS = [
  '/screens/hero/securite-privee.jpg',
  '/screens/hero/securite-sst.jpg',
  '/screens/hero/incendie-ssi.jpg',
  '/screens/hero/sst-formation.jpg',
  '/screens/hero/extincteur.jpg',
  '/screens/hero/incendie-pole.jpg',
  '/images/compte-formation.jpg',
  '/images/agent-securite-incendie-bandeau.jpg',
  '/images/ipso_securite_pole_securite_incendie.jpg',
  '/screens/formation-coordinateur-ssi.jpg',
  '/uploads/gestion-ressources/venue-room/c1a00002-0000-4000-8000-000000000002/general/1781396546768-q5k3j5ei.jpg',
  '/uploads/gestion-ressources/venue-room/c1a00004-0000-4000-8000-000000000004/general/1781396598007-rfnf860s.jpg',
] as const;

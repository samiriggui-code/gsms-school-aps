import { 
  Shield, 
  Flame, 
  Truck, 
  Briefcase, 
  Dog, 
  Building2, 
  Store, 
  Users 
} from 'lucide-react';

export const TEAM_TYPES = [
  { id: 'ADMIN', label: 'Administratif', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'INCENDIE', label: 'Incendie (SSIAP)', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'VOLANTE', label: 'Équipe Volante', icon: Truck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'SECURITE', label: 'Sécurité (Gardiennage)', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'CYNOPHILE', label: 'Maître-chien', icon: Dog, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
];

export const TEAM_SECTORS = [
  { id: 'SIEGE', label: 'Siège Social', icon: Building2 },
  { id: 'SUCCURSALE', label: 'Succursale', icon: Store },
  { id: 'CLIENT', label: 'Site Client', icon: Users },
];

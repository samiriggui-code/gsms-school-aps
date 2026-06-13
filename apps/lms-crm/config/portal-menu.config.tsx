import { Bell, BookOpen, ClipboardCheck, FolderOpen, GraduationCap } from 'lucide-react';
import type { MenuConfig } from './types';
import { NOTIFICATIONS_VIEW_PERMISSION } from '@/lib/notifications-scope';

/** Menu latéral espace candidat — même format que `MINIMAL_MENU_SIDEBAR`. */
export const PORTAL_MENU_SIDEBAR: MenuConfig = [
  { heading: 'Espace candidat' },
  {
    title: 'Mon dossier',
    icon: FolderOpen,
    path: '/mon-dossier',
  },
  {
    title: 'Ma formation',
    icon: GraduationCap,
    path: '/formation',
  },
  {
    title: 'E-formation',
    icon: BookOpen,
    path: '/e-formation',
  },
  {
    title: 'Mes quiz',
    icon: ClipboardCheck,
    path: '/e-formation/quiz',
  },
  { heading: 'Notifications & alertes' },
  {
    title: 'Centre de notifications',
    icon: Bell,
    path: '/mon-dossier/notifications',
    roleSlugs: ['candidat', 'eleve'],
    permissionSlug: NOTIFICATIONS_VIEW_PERMISSION,
  },
];

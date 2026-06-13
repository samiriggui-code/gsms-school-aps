import { BookOpen, Bell, CalendarDays, GraduationCap, LayoutDashboard, Megaphone, Users } from 'lucide-react';
import type { MenuConfig } from './types';
import { NOTIFICATIONS_VIEW_PERMISSION } from '@/lib/notifications-scope';

/** Menu latéral espace formateur. */
export const INSTRUCTOR_MENU_SIDEBAR: MenuConfig = [
  { heading: 'Espace formateur' },
  {
    title: 'Tableau de bord',
    icon: LayoutDashboard,
    path: '/formateur',
  },
  {
    title: 'Mes formations',
    icon: GraduationCap,
    path: '/formateur/formations',
  },
  {
    title: 'Mes sessions',
    icon: CalendarDays,
    path: '/formateur/sessions',
  },
  {
    title: 'Mes parcours',
    icon: BookOpen,
    path: '/formateur/parcours',
  },
  {
    title: 'Mes stagiaires',
    icon: Users,
    path: '/formateur/stagiaires',
  },
  {
    title: 'Annonces',
    icon: Megaphone,
    path: '/formateur/annonces',
  },
  { heading: 'Notifications & alertes' },
  {
    title: 'Centre de notifications',
    icon: Bell,
    path: '/formateur/notifications',
    roleSlugs: ['formateur'],
    permissionSlug: NOTIFICATIONS_VIEW_PERMISSION,
  },
];

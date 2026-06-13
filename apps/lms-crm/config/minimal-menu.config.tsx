import {
  Globe,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  UserCheck,
  Users,
} from 'lucide-react';
import { type MenuConfig } from './types';

/**
 * Menu opérationnel — une app, trois zones :
 * - Site public (/) alimenté par le CMS sections
 * - CRM métier (leads, candidatures, sessions, users)
 * - Doc = fichiers MDX dans content/docs (hors menu tant que rendu basique)
 */
export const MINIMAL_MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Tableau de bord',
    icon: LayoutGrid,
    path: '/accueil',
  },
  {
    title: 'Site & sections',
    icon: Globe,
    path: '/communication-contenu/cms/pages-landing',
  },
  {
    title: 'Leads & devis',
    icon: MessageSquare,
    path: '/communication-contenu/marketing/formulaires-leads',
  },
  {
    title: 'Préinscriptions',
    icon: UserCheck,
    path: '/gestion-academique/vie-scolaire/etudiants',
  },
  {
    title: 'Sessions',
    icon: GraduationCap,
    path: '/gestion-academique/vie-scolaire/sessions',
  },
  {
    title: 'Utilisateurs',
    icon: Users,
    path: '/securite-configuration/acces/users',
  },
  {
    title: 'Voir le site',
    icon: Globe,
    path: '/',
  },
];

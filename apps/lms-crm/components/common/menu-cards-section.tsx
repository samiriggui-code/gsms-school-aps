'use client';

import {
  BarChart3,
  Users,
  Calendar,
  Building2,
  MessageSquare,
  BookOpen,
  Settings,
  HelpCircle,
  Ambulance,
  GraduationCap,
  Lock
} from 'lucide-react';
import { MenuCard } from './menu-card';
import { usePermissions } from '@/lib/app-context';

export const MenuCardsSection = () => {
  const permissions = usePermissions();
  const {
    canAccessPilotage,
    canAccessRessources,
    canAccessOperations,
    canAccessSites,
    canAccessInterventions,
    canAccessQualite,
    canAccessCommunication,
    canAccessDocuments,
    canAccessAdminFacturation,
    canAccessParametres,
    canAccessSecurite,
    canAccessSupport,
  } = permissions;

  // Debug: Log permissions to console
  console.log('🔍 MenuCardsSection - Permissions:', permissions);

  const allMenuItems = [
    {
      moduleKey: 'A-pilotage-supervision',
      title: 'A - Pilotage & Supervision',
      description: 'Tableaux de bord, indicateurs clés et supervision opérationnelle.',
      icon: BarChart3,
      path: '/A-pilotage-supervision',
      badge: 'Pilotage',
      backgroundImage: 'bg-3',
      subSections: ['performance', 'pilotage', 'risques'],
      hasAccess: canAccessPilotage
    },
    {
      moduleKey: 'B-gestion-ressources',
      title: 'B - Gestion Ressources',
      description: 'Ressources humaines, équipements, finances et partenaires.',
      icon: Users,
      path: '/B-gestion-ressources',
      badge: 'Ressources',
      backgroundImage: 'bg-3',
      subSections: ['compagnie', 'equipements', 'finance', 'rh', 'partenaires'],
      hasAccess: canAccessRessources
    },
    {
      moduleKey: 'C-operations-quotidiennes',
      title: 'C - Opérations Quotidiennes',
      description: 'Main courante, planning et rondes de sécurité.',
      icon: Calendar,
      path: '/C-operations-quotidiennes',
      badge: 'Opérations',
      backgroundImage: 'bg-3',
      subSections: ['main-courante', 'planning', 'rondes'],
      hasAccess: canAccessOperations
    },
    {
      moduleKey: 'D-gestion-sites-clients',
      title: 'D - Gestion Sites Clients',
      description: 'Gestion des clients, infrastructure et technologies.',
      icon: Building2,
      path: '/D-gestion-sites-clients',
      badge: 'Sites',
      backgroundImage: 'bg-3',
      subSections: ['clients', 'incendie', 'infrastructure', 'technologie'],
      hasAccess: canAccessSites
    },
    {
      moduleKey: 'E-gestion-interventions',
      title: 'E - Gestion Interventions',
      description: 'Astreinte, contrôles de sites et gestion de crise.',
      icon: Ambulance,
      path: '/E-gestion-interventions',
      badge: 'Interventions',
      backgroundImage: 'bg-3',
      subSections: ['astreinte', 'controle-sites', 'crise', 'interventions-incidents', 'pc-securite'],
      hasAccess: canAccessInterventions
    },
    {
      moduleKey: 'F-qualite-conformite',
      title: 'F - Qualité & Conformité',
      description: 'Audits, formation, protection des données et RSE.',
      icon: GraduationCap,
      path: '/F-qualite-conformite',
      badge: 'Qualité',
      backgroundImage: 'bg-3',
      subSections: ['audit-securite', 'formation', 'protection-donnees', 'developpement-durable'],
      hasAccess: canAccessQualite
    },
    {
      moduleKey: 'G-communication-collaboration',
      title: 'G - Communication & Collaboration',
      description: 'Messagerie interne et outils de collaboration.',
      icon: MessageSquare,
      path: '/G-communication-collaboration',
      badge: 'Communication',
      backgroundImage: 'bg-3',
      subSections: ['messagerie', 'communication'],
      hasAccess: canAccessCommunication
    },
    {
      moduleKey: 'H-gestion-documentaire',
      title: 'H - Gestion Documentaire',
      description: 'Documents, archives et centre de ressources.',
      icon: BookOpen,
      path: '/H-gestion-documentaire',
      badge: 'Documents',
      backgroundImage: 'bg-3',
      subSections: ['gestion-documents', 'centre-ressources'],
      hasAccess: canAccessDocuments
    },
    {
      moduleKey: 'I-administration-facturation',
      title: 'I - Administration & Facturation',
      description: 'Gestion des utilisateurs, rôles et facturation.',
      icon: Users,
      path: '/I-administration-facturation',
      badge: 'Administration',
      backgroundImage: 'bg-3',
      subSections: ['Gestion Utilisateurs', 'Rôles & Permissions', 'Sécurité & Logs', 'Abonnements & Facturation', 'Gestion Compte', 'Configuration'],
      hasAccess: canAccessAdminFacturation
    },
    {
      moduleKey: 'J-parametres-configuration',
      title: 'J - Paramètres & Configuration',
      description: 'Configuration système et personnalisation interface.',
      icon: Settings,
      path: '/J-parametres-configuration',
      badge: 'Paramètres',
      backgroundImage: 'bg-3',
      subSections: ['configuration-generale', 'personnalisation-interface', 'integrations-techniques'],
      hasAccess: canAccessParametres
    },
    {
      moduleKey: 'K-securite-conformite',
      title: 'K - Sécurité & Conformité',
      description: 'Authentification, surveillance et sauvegarde.',
      icon: Lock,
      path: '/K-securite-conformite',
      badge: 'Sécurité',
      backgroundImage: 'bg-3',
      subSections: ['authentification-acces', 'politiques-surveillance', 'sauvegarde-recuperation'],
      hasAccess: canAccessSecurite
    },
    {
      moduleKey: 'L-support-assistance',
      title: 'L - Support & Assistance',
      description: 'Gestion tickets, documentation et assistance technique.',
      icon: HelpCircle,
      path: '/L-support-assistance',
      badge: 'Support',
      backgroundImage: 'bg-3',
      subSections: ['gestion-tickets', 'documentation-aide', 'assistance-technique'],
      hasAccess: canAccessSupport
    }
  ];

  // Filtrer les modules selon les permissions
  const menuItems = allMenuItems.filter(item => item.hasAccess);
  

  return (
    <div className="grid gap-5 lg:gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-foreground">
            Accès rapide aux modules
          </h2>
          <p className="text-muted-foreground">
            Sélectionnez un module pour accéder aux fonctionnalités correspondantes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <MenuCard
                key={item.moduleKey}
                moduleKey={item.moduleKey}
                title={item.title}
                description={item.description}
                icon={item.icon}
                path={item.path}
                badge={item.badge}
                backgroundImage={item.backgroundImage}
                subSections={item.subSections}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">
                <Lock className="size-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucun module accessible</h3>
                <p className="text-sm">
                  Contactez votre administrateur pour obtenir les permissions nécessaires.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
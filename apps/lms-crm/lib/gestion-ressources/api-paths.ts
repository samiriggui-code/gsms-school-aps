/** Chemins API section Gestion administrative — alignés menu CRM. */
import { COMPANY_PROFILE_READONLY_API } from '@/lib/company-profile';

export const GESTION_RESSOURCES_API = {
  landing: '/api/sections/gestion-ressources/landing',
  stats: '/api/sections/gestion-ressources/stats',
  compagnie: {
    /** Lecture seule — édition via tenant/profile + Paramètres système */
    profil: COMPANY_PROFILE_READONLY_API,
    dossier: '/api/sections/gestion-ressources/compagnie/dossier-administratif',
  },
  rh: {
    collaborateurs: '/api/sections/gestion-ressources/rh/collaborateurs',
    collaborateursStats: '/api/sections/gestion-ressources/rh/collaborateurs/stats',
    absences: '/api/sections/gestion-ressources/rh/absences',
    equipes: '/api/sections/gestion-ressources/rh/equipes',
    orgUnits: '/api/sections/gestion-ressources/rh/org-units',
    positions: '/api/sections/gestion-ressources/rh/positions',
    conformite: '/api/sections/gestion-ressources/rh/conformite',
    conformiteStats: '/api/sections/gestion-ressources/rh/conformite/stats',
    documents: '/api/sections/gestion-ressources/rh/documents',
    certifications: '/api/sections/gestion-ressources/rh/certifications',
    complianceAlerts: '/api/sections/gestion-ressources/rh/compliance/alerts',
  },
  equipements: {
    inventaire: '/api/sections/gestion-ressources/equipements/inventaire',
    inventaireStats: '/api/sections/gestion-ressources/equipements/inventaire/stats',
    affectations: '/api/sections/gestion-ressources/equipements/affectations',
    assign: '/api/sections/gestion-ressources/equipements/affectations/assign',
    stats: '/api/sections/gestion-ressources/equipements/stats',
  },
} as const;

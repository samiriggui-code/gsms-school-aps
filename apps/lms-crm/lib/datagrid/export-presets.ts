import type { ListExportConfig } from '@/lib/datagrid/list-export';
import { lmsAccessShortLabel, type LmsAccessTier } from '@/lib/portal/lms-access-shared';
import type { RhCollaborateurListSegment } from '@/lib/rh-collaborateur-list-segment';
import type { RhSessionTeamPhase, RhTeamListScope } from '@/lib/rh-team-list-scope';

function cell(value: unknown): string | number | null | undefined {
  if (value == null) return value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function nestedCell(...values: unknown[]): string | number | null | undefined {
  for (const value of values) {
    const resolved = cell(value);
    if (resolved != null && resolved !== '') return resolved;
  }
  return cell(null);
}

function userLabel(item: Record<string, unknown>) {
  const name = item.name ?? item.fullName;
  if (typeof name === 'string' && name.trim()) return name.trim();
  const first = typeof item.firstName === 'string' ? item.firstName : '';
  const last = typeof item.lastName === 'string' ? item.lastName : '';
  return `${first} ${last}`.trim() || '—';
}

export function maintenanceExportConfig(searchQuery?: string): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/equipements/inventaire',
    filename: 'maintenance-atelier',
    title: 'Maintenance atelier',
    subtitle: 'Gestion des équipements',
    summary: 'Équipements en maintenance — export complet de la liste filtrée.',
    headers: ['Équipement', 'N° série', 'État', 'Type', 'Site', 'Dernière mise à jour'],
    searchParams: {
      status: 'MAINTENANCE',
      ...(searchQuery?.trim() ? { query: searchQuery.trim() } : {}),
    },
    mapRow: (item) => [
      cell(item.label ?? item.name),
      cell(item.serialNumber),
      cell(item.status),
      cell(item.type),
      cell(
        item.assignedSite && typeof item.assignedSite === 'object'
          ? (item.assignedSite as { name?: string }).name
          : item.siteName,
      ),
      cell(item.updatedAt),
    ],
  };
}

export function affectationsExportConfig(searchQuery?: string): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/equipements/affectations',
    filename: 'affectations-equipements',
    title: 'Affectations équipements',
    subtitle: 'Gestion des ressources',
    headers: ['Équipement', 'Session / formation', 'Début', 'Fin', 'Statut', 'Site'],
    searchParams: searchQuery?.trim() ? { query: searchQuery.trim() } : undefined,
    mapRow: (item) => [
      cell(item.equipmentLabel ?? item.label),
      cell(item.sessionTitle ?? item.formationTitle),
      cell(item.startDate),
      cell(item.endDate),
      cell(item.status),
      cell(item.siteName ?? item.roomName),
    ],
  };
}

export function equipesExportConfig(
  teamScope: RhTeamListScope = 'permanent',
  sessionPhase: RhSessionTeamPhase = 'running',
): ListExportConfig {
  const isSession = teamScope === 'session';
  return {
    apiPath: '/api/sections/gestion-ressources/rh/equipes',
    filename: isSession ? `equipes-session-${sessionPhase}` : 'equipes-permanentes',
    title: isSession ? 'Équipes session (formations)' : 'Équipes permanentes (école)',
    subtitle: 'Ressources humaines',
    searchParams: isSession ? { teamScope, sessionPhase } : { teamScope },
    headers: isSession
      ? ['Équipe', 'Formation', 'Cycle', 'Formateur', 'Membres', 'État']
      : ['Équipe', 'Pôle', 'Unité org.', 'Responsable', 'Membres', 'Siège / site'],
    mapRow: (item: Record<string, unknown>) => {
      const formationSession = nestedRecord(item.formationSession);
      const formation = nestedRecord(formationSession?.formation);
      const leader = nestedRecord(item.leader);
      const orgUnit = nestedRecord(item.orgUnit) ?? nestedRecord(item.OrgUnit);
      const count = nestedRecord(item._count);

      return isSession
        ? [
            cell(item.name ?? item.title),
            nestedCell(formation?.name, item.description),
            cell(item.lifecycleStatus),
            nestedCell(leader?.name, item.leaderName),
            nestedCell(count?.members, item.memberCount),
            cell(item.lifecycleStatus),
          ]
        : [
            cell(item.name ?? item.title),
            cell(item.type),
            nestedCell(orgUnit?.name),
            nestedCell(leader?.name, item.leaderName),
            nestedCell(count?.members, item.memberCount),
            cell(item.sector),
          ];
    },
  };
}

export function sallesExportConfig(searchQuery?: string): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/equipements/salles',
    filename: 'salles-formation',
    title: 'Salles de formation',
    subtitle: 'Gestion des équipements',
    headers: ['Salle', 'Capacité', 'Site', 'Statut', 'Prochaine session'],
    searchParams: searchQuery?.trim() ? { query: searchQuery.trim() } : undefined,
    mapRow: (item) => [
      cell(item.name ?? item.label),
      cell(item.capacity),
      cell(item.siteName ?? item.location),
      cell(item.status),
      cell(item.nextSessionAt ?? item.nextSession),
    ],
  };
}

export function collaborateursExportConfig(profileSegment: RhCollaborateurListSegment): ListExportConfig {
  const titleBySegment: Record<RhCollaborateurListSegment, string> = {
    collaborateur: 'Collaborateurs',
    direction: "Direction de l'école",
    interne: 'Collaborateurs internes',
  };
  return {
    apiPath: '/api/sections/gestion-ressources/rh/collaborateurs',
    filename: `collaborateurs-${profileSegment}`,
    title: titleBySegment[profileSegment],
    subtitle: 'Ressources humaines',
    headers: ['Nom', 'E-mail', 'Téléphone', 'Statut', 'Catégorie', 'Dernière connexion'],
    searchParams: { profileType: profileSegment },
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(item.phone),
      cell(item.status),
      cell(item.userCategory),
      cell(item.lastSignInAt ?? item.lastLogin),
    ],
  };
}

export function formateursExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/rh/collaborateurs',
    filename: 'formateurs',
    title: 'Formateurs',
    subtitle: 'Ressources humaines',
    headers: ['Nom', 'E-mail', 'Téléphone', 'Statut', 'Qualification'],
    searchParams: { profileType: 'formateur' },
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(item.phone),
      cell(item.status),
      cell(item.qualificationMetier ?? item.qualification),
    ],
  };
}

export function absencesExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/rh/absences',
    filename: 'absences',
    title: 'Absences',
    subtitle: 'Ressources humaines',
    headers: ['Collaborateur', 'Type', 'Début', 'Fin', 'Statut'],
    mapRow: (item) => [
      cell(item.userName ?? item.collaboratorName) || userLabel(item),
      cell(item.type),
      cell(item.startDate),
      cell(item.endDate),
      cell(item.status),
    ],
  };
}

export function inventaireExportConfig(searchQuery?: string): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/equipements/inventaire',
    filename: 'inventaire-equipements',
    title: 'Inventaire équipements',
    subtitle: 'Gestion des équipements',
    headers: ['Référence', 'Libellé', 'Catégorie', 'Statut', 'Site'],
    searchParams: searchQuery?.trim() ? { query: searchQuery.trim() } : undefined,
    mapRow: (item) => [
      cell(item.reference ?? item.sku),
      cell(item.label ?? item.name),
      cell(item.category),
      cell(item.status),
      cell(item.siteName ?? item.location),
    ],
  };
}

export function usersExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/securite-configuration/acces/users',
    filename: 'utilisateurs-acces',
    title: 'Utilisateurs & accès',
    subtitle: 'Sécurité & configuration',
    headers: ['Nom', 'E-mail', 'Rôle', 'Statut', 'Dernière connexion', 'Créé le'],
    mapRow: (item) => [
      userLabel(item),
      cell(item.email),
      cell(
        item.role && typeof item.role === 'object'
          ? (item.role as { name?: string }).name
          : item.roleName,
      ),
      cell(item.status),
      cell(item.lastSignInAt),
      cell(item.createdAt),
    ],
  };
}

export function candidatsHubExportConfig(searchQuery?: string): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-ressources/rh/CandidatHub',
    filename: 'candidatures-etudiants',
    title: 'Candidatures étudiants',
    subtitle: 'Vie scolaire',
    headers: ['Apprenant', 'Email perso', 'Login pro', 'E-formation', 'Statut dossier', 'Formation', 'Dernière activité'],
    searchParams: searchQuery?.trim() ? { query: searchQuery.trim() } : undefined,
    mapRow: (item) => [
      userLabel(item),
      cell(item.personalEmail ?? item.email),
      cell(item.proEmail),
      cell(item.lmsAccessTier ? lmsAccessShortLabel(item.lmsAccessTier as LmsAccessTier) : '—'),
      cell(item.dossierLabel ?? item.candidatureStatus ?? item.status),
      cell(item.formationTitle ?? item.program ?? item.formationName),
      cell(item.updatedAt ?? item.lastActivityAt),
    ],
  };
}

export function leadsExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/communication-contenu/marketing/landing-leads',
    filename: 'formulaires-leads',
    title: 'Formulaires & leads',
    subtitle: 'Communication & marketing',
    headers: ['Contact', 'E-mail', 'Téléphone', 'Source', 'Statut', 'Créé le'],
    searchParams: { kind: 'all' },
    mapRow: (item) => [
      [item.firstName, item.lastName].filter(Boolean).join(' ').trim() || userLabel(item),
      cell(item.email),
      cell(item.phone),
      cell(item.source),
      cell(item.status),
      cell(item.createdAt),
    ],
  };
}

export function formationsExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-academique/vie-scolaire/formations/library',
    filename: 'formations',
    title: 'Catalogue formations',
    subtitle: 'Gestion académique',
    headers: ['Formation', 'Code', 'Statut', 'Sessions', 'Participants'],
    mapRow: (item) => [
      cell(item.title ?? item.name ?? item.label),
      cell(item.code ?? item.slug),
      cell(item.catalogStatus ?? item.status),
      cell(item.sessionsCount),
      cell(item.participantsCount),
    ],
  };
}

export function financeDevisExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/administration-facturation/finance/devis',
    filename: 'devis-finance',
    title: 'Devis',
    subtitle: 'Administration & facturation',
    headers: ['Référence', 'Client', 'Montant', 'Statut', 'Validité', 'Créé le'],
    mapRow: (item) => [
      cell(item.reference ?? item.number),
      cell(item.clientName ?? item.customerName),
      cell(item.totalAmount ?? item.amount),
      cell(item.status),
      cell(item.validUntil ?? item.expiresAt),
      cell(item.createdAt),
    ],
  };
}

export function sessionsExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/gestion-academique/vie-scolaire/sessions',
    filename: 'sessions-formation',
    title: 'Sessions de formation',
    subtitle: 'Gestion académique',
    headers: ['Session', 'Formation', 'Début', 'Fin', 'Lieu', 'Statut'],
    mapRow: (item) => [
      cell(item.title ?? item.name),
      cell(item.formationTitle),
      cell(item.startDate),
      cell(item.endDate),
      cell(item.location ?? item.roomName),
      cell(item.status),
    ],
  };
}

export function financeFacturesExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/administration-facturation/finance/factures',
    filename: 'factures-finance',
    title: 'Factures',
    subtitle: 'Administration & facturation',
    headers: ['Référence', 'Client', 'Montant', 'Statut', 'Échéance', 'Créé le'],
    mapRow: (item) => [
      cell(item.reference ?? item.number),
      cell(item.clientName ?? item.customerName),
      cell(item.totalAmount ?? item.amount),
      cell(item.status),
      cell(item.dueDate ?? item.expiresAt),
      cell(item.createdAt),
    ],
  };
}

export function accessLogsExportConfig(): ListExportConfig {
  return {
    apiPath: '/api/sections/securite-configuration/acces/logs',
    filename: 'journaux-acces',
    title: 'Journaux d’accès',
    subtitle: 'Sécurité & configuration',
    headers: ['Date', 'Utilisateur', 'Action', 'IP', 'Résultat'],
    mapRow: (item) => [
      cell(item.createdAt ?? item.timestamp),
      cell(item.userName ?? item.actorEmail),
      cell(item.action ?? item.event),
      cell(item.ipAddress ?? item.ip),
      cell(item.result ?? item.status),
    ],
  };
}

/**
 * Paramètres **compte utilisateur** par espace (pas les paramètres système établissement).
 *
 * | Espace        | Profil              | Paramètres compte        | Paramètres système (admin) |
 * |---------------|---------------------|--------------------------|----------------------------|
 * | Admin / RH    | /mon-profil         | /account/parametres      | /securite-configuration/parametres/settings |
 * | Collaborateur | /mon-profil         | /account/parametres      | — (selon permissions)      |
 * | Formateur     | /formateur/profil   | /formateur/parametres    | —                          |
 * | Stagiaire     | /mon-dossier/profil | /mon-dossier/parametres  | —                          |
 */

export type WorkspaceAccountKind = 'crm-user' | 'formateur' | 'stagiaire';

export type WorkspaceSettingsSectionId =
  | 'security'
  | 'presence'
  | 'notifications'
  | 'appearance'
  | 'profile-link';

export type WorkspaceSettingsSectionDef = {
  id: WorkspaceSettingsSectionId;
  anchor: string;
  title: string;
  description: string;
};

export type WorkspaceAccountSettingsDef = {
  kind: WorkspaceAccountKind;
  settingsPath: string;
  profilPath: string;
  title: string;
  description: string;
  badge: string;
  profilLinkLabel: string;
  sections: WorkspaceSettingsSectionDef[];
};

export const WORKSPACE_SECTION_SCROLL_MARGIN =
  'scroll-mt-[calc(var(--header-height)+2rem)]';

function section(
  id: WorkspaceSettingsSectionId,
  anchor: string,
  title: string,
  description: string,
): WorkspaceSettingsSectionDef {
  return { id, anchor, title, description };
}

export const WORKSPACE_ACCOUNT_SETTINGS: Record<
  WorkspaceAccountKind,
  WorkspaceAccountSettingsDef
> = {
  'crm-user': {
    kind: 'crm-user',
    settingsPath: '/account/parametres',
    profilPath: '/mon-profil',
    title: 'Paramètres du compte',
    description:
      'Session, notifications, présence et affichage — distinct de la fiche RH et des paramètres système établissement.',
    badge: 'Compte CRM',
    profilLinkLabel: 'Fiche métier (RH)',
    sections: [
      section(
        'security',
        'ws_security',
        'Connexion & sécurité',
        'Verrouillage de session et mot de passe.',
      ),
      section(
        'presence',
        'ws_presence',
        'Statut & présence',
        'Visible dans le menu utilisateur et auprès des autres utilisateurs connectés.',
      ),
      section(
        'notifications',
        'ws_notifications',
        'Préférences notifications',
        'Canaux et types d’alertes — oui ou non. L’historique est dans Notifications & alertes.',
      ),
      section(
        'appearance',
        'ws_appearance',
        'Langue & affichage',
        'Thème clair / sombre et langue de l’interface.',
      ),
      section(
        'profile-link',
        'ws_profile',
        'Fiche métier',
        'Identité RH, conformité et présentation publique — distinct du compte IAM.',
      ),
    ],
  },
  formateur: {
    kind: 'formateur',
    settingsPath: '/formateur/parametres',
    profilPath: '/formateur/profil',
    title: 'Paramètres du compte',
    description:
      'Préférences de l’espace formateur : session, chat, notifications et affichage.',
    badge: 'Espace formateur',
    profilLinkLabel: 'Mon profil (lecture seule)',
    sections: [
      section(
        'security',
        'ws_security',
        'Connexion & sécurité',
        'Verrouillage de session et mot de passe.',
      ),
      section(
        'presence',
        'ws_presence',
        'Statut & présence',
        'Pastille sur votre avatar dans l’en-tête formateur.',
      ),
      section(
        'notifications',
        'ws_notifications',
        'Préférences notifications',
        'Canaux et types d’alertes — oui ou non. L’historique est dans Notifications & alertes.',
      ),
      section(
        'appearance',
        'ws_appearance',
        'Langue & affichage',
        'Thème et langue (également modifiables depuis l’en-tête).',
      ),
      section(
        'profile-link',
        'ws_profile',
        'Fiche formateur',
        'Consultation de votre fiche RH — modifications via l’administration.',
      ),
    ],
  },
  stagiaire: {
    kind: 'stagiaire',
    settingsPath: '/mon-dossier/parametres',
    profilPath: '/mon-dossier/profil',
    title: 'Paramètres du compte',
    description:
      'Session, notifications et affichage de votre espace candidat / stagiaire.',
    badge: 'Mon dossier',
    profilLinkLabel: 'Mon profil candidat',
    sections: [
      section(
        'security',
        'ws_security',
        'Connexion & sécurité',
        'Verrouillage de session et mot de passe.',
      ),
      section(
        'presence',
        'ws_presence',
        'Statut & présence',
        'Statut affiché dans le menu utilisateur du portail.',
      ),
      section(
        'notifications',
        'ws_notifications',
        'Préférences notifications',
        'Canaux et types d’alertes — oui ou non. L’historique est dans Notifications & alertes.',
      ),
      section(
        'appearance',
        'ws_appearance',
        'Langue & affichage',
        'Thème clair / sombre et langue.',
      ),
      section(
        'profile-link',
        'ws_profile',
        'Mon profil',
        'Coordonnées personnelles de votre dossier.',
      ),
    ],
  },
};

/** Paramètres système établissement — page existante, non dupliquée ici. */
export const ADMIN_SYSTEM_SETTINGS_PATH =
  '/securite-configuration/parametres/settings';

/**
 * Matrice déterministe rôle → permissions CRM.
 * `superadmin` reçoit toutes les permissions en seed (wildcard ci-dessous ignoré).
 */
const CRM_PERMISSIONS = {
  superadmin: '*',
  admin: [
    'crm.dashboard.view',
    'crm.ressources.view',
    'crm.ressources.edit',
    'crm.academique.view',
    'crm.academique.edit',
    'crm.finance.view',
    'crm.finance.edit',
    'crm.communication.view',
    'crm.communication.edit',
    'crm.support.view',
    'crm.pilotage.view',
    'in_app_notifications.view',
    'settings.manage',
    'report.view',
    'report.export',
    'user.view',
    'user.edit',
  ],
  collaborateur: [
    'crm.dashboard.view',
    'crm.ressources.view',
    'crm.academique.view',
    'crm.support.view',
    'in_app_notifications.view',
  ],
  manager: [
    'crm.dashboard.view',
    'crm.ressources.view',
    'crm.ressources.edit',
    'crm.academique.view',
    'crm.academique.edit',
    'crm.support.view',
    'in_app_notifications.view',
    'report.view',
  ],
  staff: [
    'crm.dashboard.view',
    'crm.ressources.view',
    'crm.academique.view',
    'crm.support.view',
    'in_app_notifications.view',
  ],
  support: [
    'crm.dashboard.view',
    'crm.ressources.view',
    'crm.academique.view',
    'crm.support.view',
    'crm.communication.view',
    'in_app_notifications.view',
  ],
  formateur: ['in_app_notifications.view'],
  candidat: ['in_app_notifications.view'],
  eleve: ['in_app_notifications.view'],
};

module.exports = { CRM_PERMISSIONS };

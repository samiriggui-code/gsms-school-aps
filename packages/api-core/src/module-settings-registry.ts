/**

 * Registre des clés ModuleSetting autorisées — validation côté API parametres.

 */

export type ModuleSettingDefinition = {

  moduleKey: string;

  settingKey: string;

  label: string;

  description?: string;

};



export const MODULE_SETTING_REGISTRY: ModuleSettingDefinition[] = [

  {

    moduleKey: 'crm-dashboard',

    settingKey: 'layout',

    label: 'Layout dashboard CRM',

    description: 'Widgets visibles sur l’accueil administrateur.',

  },

  {

    moduleKey: 'formateur-dashboard',

    settingKey: 'layout',

    label: 'Layout dashboard formateur',

    description: 'Blocs de l’espace formateur.',

  },

  {

    moduleKey: 'stagiaire-dashboard',

    settingKey: 'layout',

    label: 'Layout mon dossier',

    description: 'Sections du portail stagiaire.',

  },

  {

    moduleKey: 'finance-landing',

    settingKey: 'layout',

    label: 'Landing Finance',

    description: 'Blocs visibles sur la page module Finance.',

  },

  {

    moduleKey: 'pilotage-landing',

    settingKey: 'layout',

    label: 'Landing Pilotage',

    description: 'Blocs visibles sur la page Pilotage & supervision.',

  },

  {

    moduleKey: 'support-landing',

    settingKey: 'layout',

    label: 'Landing Support',

    description: 'Blocs visibles sur la page Support & qualité.',

  },

  {

    moduleKey: 'gestion-ressources-landing',

    settingKey: 'layout',

    label: 'Landing Gestion ressources',

    description: 'Blocs visibles sur la landing Gestion ressources.',

  },

  {

    moduleKey: 'communication-landing',

    settingKey: 'layout',

    label: 'Landing Communication',

    description: 'Blocs visibles sur la landing Communication.',

  },

  {

    moduleKey: 'vie-scolaire-landing',

    settingKey: 'layout',

    label: 'Landing Vie scolaire',

    description: 'Blocs visibles sur la landing Vie scolaire.',

  },

  {

    moduleKey: 'support-qualite',

    settingKey: 'sla',

    label: 'SLA support',

    description: 'Délais cibles tickets (heures).',

  },

  {

    moduleKey: 'finance',

    settingKey: 'devis-workflow',

    label: 'Workflow devis',

    description: 'Étapes et automatisations devis.',

  },

  {

    moduleKey: 'finance',

    settingKey: 'einvoice',

    label: 'Facturation électronique',

    description: 'Profil Factur-X, PDP partenaire, contrôles SIRET (réforme sept. 2026).',

  },

  {

    moduleKey: 'pilotage-supervision',

    settingKey: 'alertes',

    label: 'Seuils alertes pilotage',

    description: 'Seuils d’alerte candidatures, finance, équipements, sessions.',

  },

];



const REGISTRY_SET = new Set(

  MODULE_SETTING_REGISTRY.map((d) => `${d.moduleKey}:${d.settingKey}`),

);



export function isAllowedModuleSetting(moduleKey: string, settingKey: string): boolean {

  return REGISTRY_SET.has(`${moduleKey}:${settingKey}`);

}



export function moduleSettingsForModule(moduleKey: string): ModuleSettingDefinition[] {

  return MODULE_SETTING_REGISTRY.filter((d) => d.moduleKey === moduleKey);

}


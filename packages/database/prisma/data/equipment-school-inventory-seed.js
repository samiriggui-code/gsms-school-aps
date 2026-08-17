'use strict';

/**
 * Inventaire école — pool global, finance carré par unité.
 *
 * Chaque unité porte : catalogKey, prix HT marché, date achat, ref facture, fournisseur,
 * marque/modèle, catégorie budget, amortissement.
 *
 * Prix calibrés sur références marché FR 2023–2025 (collectivités, Securimed, Epson, YLEA…).
 * Aucune affectation salle ici — lien via VenueRoomFixedEquipment dans le CRM.
 */

const { summarizeInventoryFinance } = require('./equipment-inventory-finance');

/** Lots d'achat réels (fournisseur + facture + date). */
const PROCUREMENT_LOTS = {
  'LOT-MOB-2022-Q4': {
    purchaseInvoiceRef: 'FA-MOB-2022-089',
    purchaseDate: '2022-11-15',
    supplier: 'Trigano Collectivités',
    supplierOrderRef: 'CMD-TRI-2022-8841',
    priceReference: 'Chaises Iso tissu M4 — trigano-collectivites.com ~72 € HT (2024)',
  },
  'LOT-MOB-2023-Q1': {
    purchaseInvoiceRef: 'FA-MOB-2023-041',
    purchaseDate: '2023-03-22',
    supplier: 'Net Collectivités',
    supplierOrderRef: 'NC-2023-11840',
    priceReference: 'Tables Massa 120×80 — fap-collectivites.com ~234–268 € HT',
  },
  'LOT-MOB-2023-Q3': {
    purchaseInvoiceRef: 'FA-MOB-2023-112',
    purchaseDate: '2023-09-08',
    supplier: 'Direct Collectivités',
    supplierOrderRef: 'DC-2023-5521',
    priceReference: 'Tables Comité stratifié 120×80 — direct-collectivites.com ~272 € HT (11+)',
  },
  'LOT-INFO-2024-Q1': {
    purchaseInvoiceRef: 'FA-INFO-2024-008',
    purchaseDate: '2024-01-18',
    supplier: 'Epson France (revendeur HelloRSE)',
    supplierOrderRef: 'HRSE-INFO-240118',
    priceReference: 'Vidéoprojecteur Epson EB-FH54 — epson.fr ~805 € HT',
  },
  'LOT-INFO-2024-Q2': {
    purchaseInvoiceRef: 'FA-INFO-2024-031',
    purchaseDate: '2024-06-05',
    supplier: 'LDLC Pro / Materiel.net',
    supplierOrderRef: 'LDLC-2024-88412',
    priceReference: 'Postes formateur + écrans interactifs — marché pro 2024',
  },
  'LOT-SEC-2023-Q4': {
    purchaseInvoiceRef: 'FA-SEC-2023-027',
    purchaseDate: '2023-11-20',
    supplier: 'Securimed / Laerdal France',
    supplierOrderRef: 'SEC-2023-4402',
    priceReference: 'Little Anne QCPR — securimed.fr ~329 € HT ; SMSP ~325 € HT',
  },
  'LOT-INC-2023-Q4': {
    purchaseInvoiceRef: 'FA-INC-2023-015',
    purchaseDate: '2023-10-12',
    supplier: 'YLEA Sécurité Incendie',
    supplierOrderRef: 'YLEA-2023-9912',
    priceReference: 'Extincteurs CO2 5 kg — ylea.eu ~66–88 € HT',
  },
  'LOT-INC-2024-Q2': {
    purchaseInvoiceRef: 'FA-INC-2024-004',
    purchaseDate: '2024-05-14',
    supplier: 'Camac Cie',
    supplierOrderRef: 'CAMAC-RIA-2024',
    priceReference: 'Module RIA pédagogique + pose — devis plateau technique',
  },
  'LOT-EPI-2024-Q4': {
    purchaseInvoiceRef: 'FA-EPI-2024-019',
    purchaseDate: '2024-11-12',
    supplier: 'Pro Sécurité Privée Équipements',
    supplierOrderRef: 'PSP-2024-771',
    priceReference: 'Lots EPI CNAPS + armoires atelier',
  },
  'LOT-BUR-2023-Q2': {
    purchaseInvoiceRef: 'FA-BUR-2023-006',
    purchaseDate: '2023-05-30',
    supplier: 'Canon France (leasing converti achat)',
    supplierOrderRef: 'CANON-IRADVDX-2023',
    priceReference: 'Photocopieur multifonction pro — marché B2B ~3 500–4 500 € HT',
  },
  'LOT-BUR-2024-Q3': {
    purchaseInvoiceRef: 'FA-BUR-2024-011',
    purchaseDate: '2024-08-22',
    supplier: 'Synology / LDLC Pro',
    supplierOrderRef: 'SYN-DS1823-2024',
    priceReference: 'NAS 8 baies + disques — synology.com ~2 000–2 400 € HT',
  },
  'LOT-MOB-2025-Q1': {
    purchaseInvoiceRef: 'FA-MOB-2025-003',
    purchaseDate: '2025-02-18',
    supplier: 'Mobilier Conférence',
    supplierOrderRef: 'MC-2025-220',
    priceReference: 'Tables modulaires — mobilier-conference.fr ~450–520 € HT',
  },
  'LOT-INFO-2026-Q1': {
    purchaseInvoiceRef: 'FA-INFO-2026-002',
    purchaseDate: '2026-03-10',
    supplier: 'DJI Enterprise (revendeur)',
    supplierOrderRef: 'DJI-ENT-2026-014',
    priceReference: 'Drone formation surveillance — gamme pro entrée ~900–1 200 € HT',
  },
  'LOT-SEC-PRIV-2024-Q3': {
    purchaseInvoiceRef: 'FA-SEC-PRIV-2024-008',
    purchaseDate: '2024-09-20',
    supplier: 'Pro Sécurité Privée Équipements',
    supplierOrderRef: 'PSP-PLATEAU-2024',
    priceReference: 'Plateau PCS pédagogique — arrêté 23/10/2024 art. 12',
  },
};

/**
 * @typedef {object} ProcurementSplit
 * @property {number} from
 * @property {number} to
 * @property {string} lotKey
 * @property {number} [acquisitionCost]
 * @property {number} [installationCost]
 * @property {string} [brand]
 * @property {string} [model]
 */

/**
 * @typedef {object} PoolItem
 * @property {string} catalogKey
 * @property {string} catalogLabel
 * @property {string} serialBase
 * @property {string} type
 * @property {number} unitCount
 * @property {string} siteCode
 * @property {Record<string, unknown>} metadata
 * @property {string} [defaultLotKey]
 * @property {ProcurementSplit[]} [procurementSplits]
 */

/** @type {PoolItem[]} */
const SCHOOL_EQUIPMENT_POOL = [
  {
    catalogKey: 'mobilier.chaise-empilable',
    catalogLabel: 'Chaise empilable',
    serialBase: 'CHAISE-EMP',
    type: 'MOBILIER',
    unitCount: 80,
    siteCode: 'CAMPUS-REUIL',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      amortizationYears: 7,
      pedagogicDomain: 'transversal',
    },
    procurementSplits: [
      {
        from: 1,
        to: 50,
        lotKey: 'LOT-MOB-2022-Q4',
        acquisitionCost: 72,
        brand: 'Trigano',
        model: 'Iso tissu M4',
      },
      {
        from: 51,
        to: 80,
        lotKey: 'LOT-MOB-2023-Q1',
        acquisitionCost: 74,
        brand: 'Net Collectivités',
        model: 'Iso tissu M4',
      },
    ],
  },
  {
    catalogKey: 'mobilier.table-pedagogique',
    catalogLabel: 'Table pédagogique 120×80',
    serialBase: 'TABLE-PED',
    type: 'MOBILIER',
    unitCount: 32,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-MOB-2023-Q1',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 268,
      amortizationYears: 7,
      brand: 'FAP Collectivités',
      model: 'Table Massa mélaminé 120×80',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'mobilier.table-amphitheatre',
    catalogLabel: 'Table amphithéâtre',
    serialBase: 'TABLE-AMPHI',
    type: 'MOBILIER',
    unitCount: 16,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-MOB-2022-Q4',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 398,
      amortizationYears: 7,
      brand: 'FAP Collectivités',
      model: 'Table basculante 120×80',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'mobilier.table-modulaire',
    catalogLabel: 'Table modulaire',
    serialBase: 'TABLE-MOD',
    type: 'MOBILIER',
    unitCount: 2,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-MOB-2025-Q1',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 485,
      amortizationYears: 7,
      brand: 'Mobilier Conférence',
      model: 'Table modulaire polyvalente',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'mobilier.etabli-pliant',
    catalogLabel: 'Établi pliant atelier',
    serialBase: 'ETABLI-PL',
    type: 'MOBILIER',
    unitCount: 6,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-EPI-2024-Q4',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 265,
      amortizationYears: 7,
      brand: 'Würth',
      model: 'Établi pliant pro 160×60',
      pedagogicDomain: 'securite-privee',
    },
  },
  {
    catalogKey: 'mobilier.armoire-epi',
    catalogLabel: 'Armoire EPI & consommables',
    serialBase: 'ARMOIRE-EPI',
    type: 'MOBILIER',
    unitCount: 2,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-EPI-2024-Q4',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 845,
      amortizationYears: 7,
      brand: 'Manutan',
      model: 'Armoire métallique 2 portes',
      pedagogicDomain: 'securite-privee',
    },
  },
  {
    catalogKey: 'informatique.videoprojecteur',
    catalogLabel: 'Vidéoprojecteur',
    serialBase: 'VIDEOPROJ',
    type: 'INFORMATIQUE',
    unitCount: 5,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q1',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 805,
      amortizationYears: 5,
      brand: 'Epson',
      model: 'EB-FH54 Full HD 4100 lm',
      warrantyUntil: '2027-01-18',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.ecran-projection',
    catalogLabel: 'Écran de projection motorisé',
    serialBase: 'ECRAN-PROJ',
    type: 'MOBILIER',
    unitCount: 3,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q1',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 598,
      installationCost: 145,
      amortizationYears: 7,
      brand: 'Screenline',
      model: 'Écran motorisé 200×200 cm',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.ecran-interactif',
    catalogLabel: 'Écran interactif',
    serialBase: 'ECRAN-INT',
    type: 'INFORMATIQUE',
    unitCount: 2,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 2890,
      installationCost: 220,
      amortizationYears: 5,
      brand: 'Promethean',
      model: 'ActivPanel 65"',
      warrantyUntil: '2027-06-05',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.pc-formateur',
    catalogLabel: 'PC formateur',
    serialBase: 'PC-FORM',
    type: 'INFORMATIQUE',
    unitCount: 5,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'BUREAU',
      acquisitionCost: 1095,
      amortizationYears: 3,
      brand: 'Dell',
      model: 'OptiPlex 7020 + écran 24"',
      warrantyUntil: '2027-06-05',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.sonorisation',
    catalogLabel: 'Sonorisation / micros HF',
    serialBase: 'SONO-HF',
    type: 'INFORMATIQUE',
    unitCount: 2,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 1890,
      installationCost: 420,
      amortizationYears: 5,
      brand: 'Sennheiser',
      model: 'Kit HF + ampli + enceintes salle',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.photocopieur',
    catalogLabel: 'Photocopieur multifonction',
    serialBase: 'PHOTOCOP',
    type: 'INFORMATIQUE',
    unitCount: 1,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-BUR-2023-Q2',
    metadata: {
      financialCategory: 'BUREAU',
      acquisitionCost: 3890,
      amortizationYears: 5,
      brand: 'Canon',
      model: 'iR-ADV DX C3826i',
      warrantyUntil: '2026-05-30',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.switch-reseau',
    catalogLabel: 'Switch réseau 48 ports',
    serialBase: 'SWITCH-48',
    type: 'INFORMATIQUE',
    unitCount: 1,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'BUREAU',
      acquisitionCost: 724,
      amortizationYears: 5,
      brand: 'Ubiquiti',
      model: 'UniFi Switch Pro 48 PoE',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'informatique.nas',
    catalogLabel: 'NAS pédagogique 24 To',
    serialBase: 'NAS-24TO',
    type: 'INFORMATIQUE',
    unitCount: 1,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-BUR-2024-Q3',
    metadata: {
      financialCategory: 'BUREAU',
      acquisitionCost: 2180,
      amortizationYears: 4,
      brand: 'Synology',
      model: 'DS1823xs+ + 4×6 To',
      warrantyUntil: '2027-08-22',
      pedagogicDomain: 'transversal',
    },
  },
  {
    catalogKey: 'secourisme.mannequin-adulte',
    catalogLabel: 'Mannequin RCP adulte',
    serialBase: 'MAN-ADULTE',
    type: 'MANNEQUIN_PEDAGOGIQUE',
    unitCount: 2,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 329,
      amortizationYears: 5,
      brand: 'Laerdal',
      model: 'Little Anne QCPR',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'secourisme.mannequin-enfant',
    catalogLabel: 'Mannequin RCP enfant',
    serialBase: 'MAN-ENFANT',
    type: 'MANNEQUIN_PEDAGOGIQUE',
    unitCount: 1,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 418,
      amortizationYears: 5,
      brand: 'Laerdal',
      model: 'Little Junior QCPR',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'secourisme.mannequin-nourrisson',
    catalogLabel: 'Mannequin RCP nourrisson',
    serialBase: 'MAN-NOUR',
    type: 'MANNEQUIN_PEDAGOGIQUE',
    unitCount: 1,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 392,
      amortizationYears: 5,
      brand: 'Laerdal',
      model: 'Baby Anne QCPR',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'secourisme.defibrillateur-formation',
    catalogLabel: 'Défibrillateur de formation AED',
    serialBase: 'DEF-AED',
    type: 'SECOURISME',
    unitCount: 2,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 415,
      amortizationYears: 4,
      brand: 'Laerdal',
      model: 'AED Trainer 3',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'secourisme.dae-mural',
    catalogLabel: 'DAE mural',
    serialBase: 'DAE-MURAL',
    type: 'SECOURISME',
    unitCount: 3,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'ACHAT',
      acquisitionCost: 1385,
      installationCost: 95,
      amortizationYears: 5,
      brand: 'Philips',
      model: 'HeartStart FRx + armoire',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'incendie.extincteur-eau',
    catalogLabel: 'Extincteur eau pulvérisée 6L',
    serialBase: 'EXT-EAU',
    type: 'INCENDIE',
    unitCount: 4,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 78,
      amortizationYears: 5,
      brand: 'Anaf',
      model: 'Eau pulvérisée 6L NF',
      pedagogicDomain: 'incendie',
    },
  },
  {
    catalogKey: 'incendie.extincteur-co2',
    catalogLabel: 'Extincteur CO2 5kg',
    serialBase: 'EXT-CO2',
    type: 'INCENDIE',
    unitCount: 6,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 88,
      amortizationYears: 5,
      brand: 'YLEA',
      model: 'CO2 5 kg NF EN3',
      pedagogicDomain: 'incendie',
    },
  },
  {
    catalogKey: 'incendie.extincteur-poudre',
    catalogLabel: 'Extincteur poudre ABC 9kg',
    serialBase: 'EXT-POU',
    type: 'INCENDIE',
    unitCount: 3,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2023-Q4',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 102,
      amortizationYears: 5,
      brand: 'Anaf',
      model: 'Poudre ABC 9 kg',
      pedagogicDomain: 'incendie',
    },
  },
  {
    catalogKey: 'incendie.ria',
    catalogLabel: 'Module RIA pédagogique',
    serialBase: 'RIA',
    type: 'INCENDIE',
    unitCount: 2,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2024-Q2',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 2650,
      installationCost: 380,
      amortizationYears: 7,
      brand: 'Fire Training',
      model: 'RIA pédagogique avec vanne',
      pedagogicDomain: 'incendie',
    },
  },
  {
    catalogKey: 'epi.lot-pedagogique',
    catalogLabel: 'Lot EPI pédagogique',
    serialBase: 'KIT-EPI',
    type: 'EPI',
    unitCount: 3,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-EPI-2024-Q4',
    metadata: {
      financialCategory: 'CONSOMMABLE',
      acquisitionCost: 520,
      amortizationYears: 3,
      brand: 'Pro Sécurité Privée',
      model: 'Kit CNAPS complet (10 postes)',
      pedagogicDomain: 'securite-privee',
    },
  },
  {
    catalogKey: 'logistique.chariot-atelier',
    catalogLabel: 'Chariot logistique atelier',
    serialBase: 'CHARIOT-EPI',
    type: 'AUTRE',
    unitCount: 2,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-EPI-2024-Q4',
    metadata: {
      financialCategory: 'ACHAT',
      acquisitionCost: 418,
      amortizationYears: 5,
      brand: 'Manutan',
      model: 'Chariot 3 niveaux 250 kg',
      pedagogicDomain: 'securite-privee',
    },
  },
  {
    catalogKey: 'secourisme.mallette-ps',
    catalogLabel: 'Mallette premiers secours',
    serialBase: 'KIT-PS',
    type: 'SECOURISME',
    unitCount: 4,
    siteCode: 'CAMPUS-REUIL',
    defaultLotKey: 'LOT-SEC-2023-Q4',
    metadata: {
      financialCategory: 'CONSOMMABLE',
      acquisitionCost: 165,
      amortizationYears: 3,
      brand: 'Securimed',
      model: 'Mallette PSC1 renforcée',
      pedagogicDomain: 'secourisme',
    },
  },
  {
    catalogKey: 'securite-privee.drone-demo',
    catalogLabel: 'Drone surveillance démo',
    serialBase: 'CAM-DRONE',
    type: 'SECURITE_PRIVEE',
    unitCount: 1,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-INFO-2026-Q1',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 999,
      amortizationYears: 3,
      brand: 'DJI',
      model: 'Mini 4 Pro + Fly More',
      warrantyUntil: '2028-03-10',
      pedagogicDomain: 'securite-privee',
    },
  },
  // --- Plateau examen sécurité privée (arrêté 23/10/2024 art. 12) ---
  {
    catalogKey: 'securite-privee.pcs-pedagogique',
    catalogLabel: 'Poste central de sécurité pédagogique (PCS)',
    serialBase: 'PCS',
    type: 'SECURITE_PRIVEE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 18500,
      installationCost: 4200,
      amortizationYears: 10,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'PCS_CORE',
      regulatoryRef: 'Arrêté 23/10/2024 art. 12 — PCS',
    },
  },
  {
    catalogKey: 'securite-privee.ssi-pedagogique',
    catalogLabel: 'SSI pédagogique (centrale incendie)',
    serialBase: 'SSI-PED',
    type: 'INCENDIE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 8900,
      installationCost: 2100,
      amortizationYears: 10,
      pedagogicDomain: 'incendie',
      examPedagogicalRole: 'SSI_INCENDIE',
    },
  },
  {
    catalogKey: 'securite-privee.videosurveillance-3cam',
    catalogLabel: 'Vidéosurveillance pédagogique (3 caméras)',
    serialBase: 'VSS-PED',
    type: 'SECURITE_PRIVEE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 3200,
      installationCost: 980,
      amortizationYears: 7,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'VIDEO_SURVEILLANCE',
    },
  },
  {
    catalogKey: 'securite-privee.centrale-alarme-intrusion',
    catalogLabel: 'Centrale alarme intrusion',
    serialBase: 'ALARM-INTR',
    type: 'SECURITE_PRIVEE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 2400,
      installationCost: 650,
      amortizationYears: 7,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'ALARME_INTRUSION',
    },
  },
  {
    catalogKey: 'securite-privee.radio-er-pti',
    catalogLabel: 'Émetteur-récepteur radio (PTI/DATI)',
    serialBase: 'RADIO-ER',
    type: 'SECURITE_PRIVEE',
    unitCount: 3,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 420,
      amortizationYears: 5,
      brand: 'Motorola',
      model: 'DP4400e',
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'RADIO_PTI',
    },
  },
  {
    catalogKey: 'securite-privee.armoire-cles',
    catalogLabel: 'Armoire à clés pédagogique',
    serialBase: 'ARM-CLES',
    type: 'MOBILIER',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'MOBILIER_SALLE',
      acquisitionCost: 890,
      amortizationYears: 7,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'PCS_CORE',
    },
  },
  {
    catalogKey: 'securite-privee.registres-consignes',
    catalogLabel: 'Registres consignes / clés / badges / visiteurs',
    serialBase: 'REG-CONS',
    type: 'AUTRE',
    unitCount: 2,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'CONSOMMABLE',
      acquisitionCost: 45,
      amortizationYears: 3,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'REGISTRES',
    },
  },
  {
    catalogKey: 'securite-privee.poste-qcm-examen',
    catalogLabel: 'Poste QCM examen (logiciel QCU)',
    serialBase: 'QCM-EXAM',
    type: 'INFORMATIQUE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 1180,
      amortizationYears: 5,
      brand: 'Lenovo',
      model: 'ThinkCentre M90q',
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'QCM_TERMINAL',
    },
  },
  {
    catalogKey: 'securite-privee.pc-main-courante',
    catalogLabel: 'PC main courante / rapport anomalies',
    serialBase: 'PC-MC',
    type: 'INFORMATIQUE',
    unitCount: 1,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-INFO-2024-Q2',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 980,
      amortizationYears: 5,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'PCS_CORE',
    },
  },
  {
    catalogKey: 'securite-privee.parcours-ronde-100m',
    catalogLabel: 'Parcours de ronde pédagogique (100 m + pointeaux)',
    serialBase: 'RONDE-PARC',
    type: 'SECURITE_PRIVEE',
    unitCount: 1,
    siteCode: 'PARCOURS-RONDE',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 12500,
      installationCost: 2800,
      amortizationYears: 10,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'RONDE_PARCOURS',
    },
  },
  {
    catalogKey: 'securite-privee.magnetometre',
    catalogLabel: 'Magnétomètre (détecteur de métaux)',
    serialBase: 'MAGNETO',
    type: 'SECURITE_PRIVEE',
    unitCount: 2,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'PEDAGOGIQUE_MOBILE',
      acquisitionCost: 890,
      amortizationYears: 5,
      brand: 'Garrett',
      model: 'Super Scanner V',
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'DETECTION',
    },
  },
  {
    catalogKey: 'securite-privee.fumigene-pedagogique',
    catalogLabel: 'Engin pyrotechnique fumigène (pédagogique)',
    serialBase: 'FUMIG',
    type: 'SECURITE_PRIVEE',
    unitCount: 4,
    siteCode: 'PLATEAU-PCS',
    defaultLotKey: 'LOT-SEC-PRIV-2024-Q3',
    metadata: {
      financialCategory: 'CONSOMMABLE',
      acquisitionCost: 38,
      amortizationYears: 1,
      pedagogicDomain: 'securite-privee',
      examPedagogicalRole: 'PYROTECHNIE',
    },
  },
  {
    catalogKey: 'incendie.ssi-categorie-a',
    catalogLabel: 'SSI catégorie A opérationnel (plateau SSIAP)',
    serialBase: 'SSI-CAT-A',
    type: 'INCENDIE',
    unitCount: 1,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2024-Q2',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 14200,
      installationCost: 3600,
      amortizationYears: 10,
      pedagogicDomain: 'incendie',
      examPedagogicalRole: 'SSI_INCENDIE',
    },
  },
  {
    catalogKey: 'incendie.parcours-anomalies-ssiap',
    catalogLabel: 'Parcours ronde SSIAP (anomalies configurables)',
    serialBase: 'SSIAP-RONDE',
    type: 'INCENDIE',
    unitCount: 1,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2024-Q2',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 6800,
      installationCost: 1200,
      amortizationYears: 10,
      pedagogicDomain: 'incendie',
      examPedagogicalRole: 'RONDE_PARCOURS',
    },
  },
  {
    catalogKey: 'incendie.simulateur-feu',
    catalogLabel: 'Aire feu / simulateur sinistre',
    serialBase: 'SIM-FEU',
    type: 'INCENDIE',
    unitCount: 1,
    siteCode: 'PLATEAU-INC',
    defaultLotKey: 'LOT-INC-2024-Q2',
    metadata: {
      financialCategory: 'INSTALLATION',
      acquisitionCost: 9200,
      installationCost: 2400,
      amortizationYears: 10,
      pedagogicDomain: 'incendie',
      examPedagogicalRole: 'INCENDIE_PRATIQUE',
    },
  },
  {
    catalogKey: 'secourisme.gants-palpation',
    catalogLabel: 'Gants palpation de sécurité',
    serialBase: 'GANT-PALP',
    type: 'SECOURISME',
    unitCount: 12,
    siteCode: 'ATELIER-EPI',
    defaultLotKey: 'LOT-EPI-2024-Q4',
    metadata: {
      financialCategory: 'CONSOMMABLE',
      acquisitionCost: 18,
      amortizationYears: 2,
      pedagogicDomain: 'secourisme',
      examPedagogicalRole: 'SECOURISME_EXAM',
    },
  },
];

/** Maintenance démo — coûts réels comptabilisés dans le budget exercice en cours. */
const MAINTENANCE_SEED = [
  {
    serialNumber: 'EXT-CO2-003',
    status: 'IN_PROGRESS',
    title: 'Vérification pression et étanchéité',
    notes: 'Contrôle semestriel en cours — prestataire agréé',
    scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    costAmount: 85,
  },
  {
    serialNumber: 'VIDEOPROJ-002',
    status: 'COMPLETED',
    title: 'Remplacement lampe vidéoprojecteur',
    notes: 'Lampe Epson ELPLP96 — intervention HelloRSE',
    scheduledDate: new Date('2026-02-10'),
    completedDate: new Date('2026-02-12'),
    costAmount: 245,
  },
  {
    serialNumber: 'PHOTOCOP-001',
    status: 'COMPLETED',
    title: 'Maintenance préventive annuelle',
    notes: 'Contrat Canon — tambour + nettoyage',
    scheduledDate: new Date('2026-04-15'),
    completedDate: new Date('2026-04-16'),
    costAmount: 320,
  },
  {
    serialNumber: 'VIDEOPROJ-003',
    status: 'SCHEDULED',
    title: 'Changement lampe vidéoprojecteur',
    notes: 'Maintenance planifiée T3 2026',
    scheduledDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    costAmount: null,
  },
];

const MOVEMENT_SEED = [
  { serialNumber: 'MAN-ADULTE-001', type: 'IN', quantity: 1, notes: 'Réception lot secourisme 2023' },
  { serialNumber: 'EXT-EAU-001', type: 'OUT', quantity: 1, notes: 'Sortie atelier feu réel' },
  { serialNumber: 'EXT-CO2-003', type: 'TRANSFER', quantity: 1, notes: 'Zone maintenance' },
  { serialNumber: 'DEF-AED-001', type: 'OUT', quantity: 1, notes: 'Module secourisme' },
  { serialNumber: 'RIA-001', type: 'IN', quantity: 1, notes: 'Réception module RIA 2024' },
];

function unitSerial(serialBase, index) {
  return `${serialBase}-${String(index).padStart(3, '0')}`;
}

/**
 * @param {PoolItem} item
 * @param {number} unitIndex
 */
function resolveProcurementForUnit(item, unitIndex) {
  if (item.procurementSplits?.length) {
    for (const split of item.procurementSplits) {
      if (unitIndex >= split.from && unitIndex <= split.to) {
        const lot = PROCUREMENT_LOTS[split.lotKey];
        return { lot, split };
      }
    }
  }
  if (item.defaultLotKey) {
    return { lot: PROCUREMENT_LOTS[item.defaultLotKey], split: null };
  }
  return { lot: null, split: null };
}

/**
 * Métadonnées finance complètes par unité physique.
 * @param {PoolItem} item
 * @param {number} unitIndex
 */
function buildUnitMetadata(item, unitIndex) {
  const { lot, split } = resolveProcurementForUnit(item, unitIndex);
  const base = { ...(item.metadata ?? {}) };

  const acquisitionCost =
    split?.acquisitionCost ?? base.acquisitionCost ?? 0;
  const installationCost =
    split?.installationCost ?? base.installationCost ?? 0;
  const brand = split?.brand ?? base.brand ?? '';
  const model = split?.model ?? base.model ?? '';

  const meta = {
    ...base,
    catalogKey: item.catalogKey,
    catalogLabel: item.catalogLabel,
    acquisitionCost,
    installationCost,
    brand,
    model,
  };

  if (lot) {
    meta.purchaseDate = lot.purchaseDate;
    meta.purchaseInvoiceRef = lot.purchaseInvoiceRef;
    meta.supplier = lot.supplier;
    meta.supplierOrderRef = lot.supplierOrderRef;
    meta.priceReference = lot.priceReference;
    meta.notes = [
      base.notes,
      `Réf. marché : ${lot.priceReference}`,
      `Commande ${lot.supplierOrderRef}`,
    ]
      .filter(Boolean)
      .join(' — ');
  }

  return meta;
}

/**
 * @param {import('@repo/database').Prisma.TransactionClient} tx
 * @param {Map<string, string>} siteByCode
 */
async function seedSchoolEquipmentInventory(tx, siteByCode) {
  const equipmentBySerial = new Map();
  const financeRows = [];

  for (const item of SCHOOL_EQUIPMENT_POOL) {
    const assignedSiteId = siteByCode.get(item.siteCode) || null;
    const unitCount = Math.max(item.unitCount ?? 1, 1);

    for (let index = 1; index <= unitCount; index += 1) {
      const serialNumber = unitSerial(item.serialBase, index);
      const metadata = buildUnitMetadata(item, index);
      const metadataJson = JSON.stringify(metadata);
      const purchaseDate = metadata.purchaseDate
        ? new Date(`${metadata.purchaseDate}T10:00:00.000Z`)
        : new Date();

      let unitStatus = 'AVAILABLE';
      if (serialNumber === 'EXT-CO2-003') unitStatus = 'MAINTENANCE';
      if (serialNumber === 'MAN-ADULTE-002') unitStatus = 'IN_USE';

      await tx.$executeRaw`
        INSERT INTO "Equipment" (
          "id", "serialNumber", "label", "type", "status", "assignedSiteId", "metadata", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid()::text,
          ${serialNumber},
          ${item.catalogLabel},
          ${item.type},
          CAST(${unitStatus} AS "EquipmentStatus"),
          ${assignedSiteId},
          CAST(${metadataJson} AS jsonb),
          ${purchaseDate},
          now()
        )
        ON CONFLICT ("serialNumber") DO UPDATE SET
          "label" = EXCLUDED."label",
          "type" = EXCLUDED."type",
          "status" = EXCLUDED."status",
          "assignedSiteId" = EXCLUDED."assignedSiteId",
          "metadata" = EXCLUDED."metadata",
          "createdAt" = EXCLUDED."createdAt",
          "updatedAt" = now()
      `;

      const rows =
        await tx.$queryRaw`SELECT "id" FROM "Equipment" WHERE "serialNumber" = ${serialNumber} LIMIT 1`;
      const equipmentId = rows[0]?.id;
      if (equipmentId) equipmentBySerial.set(serialNumber, equipmentId);
      financeRows.push({ metadata, type: item.type });
    }
  }

  const financeSummary = summarizeInventoryFinance(financeRows);

  await tx.$executeRaw`DELETE FROM "EquipmentMaintenance"`;
  for (const item of MAINTENANCE_SEED) {
    const equipmentId = equipmentBySerial.get(item.serialNumber);
    if (!equipmentId) continue;
    await tx.$executeRaw`
      INSERT INTO "EquipmentMaintenance" (
        "id", "equipmentId", "status", "title", "notes", "scheduledDate", "completedDate", "costAmount", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${equipmentId},
        CAST(${item.status} AS "EquipmentMaintenanceStatus"),
        ${item.title},
        ${item.notes},
        ${item.scheduledDate},
        ${item.completedDate ?? null},
        ${item.costAmount ?? null},
        now(),
        now()
      )
    `;
  }

  await tx.$executeRaw`DELETE FROM "StockMovement"`;
  for (const item of MOVEMENT_SEED) {
    const equipmentId = equipmentBySerial.get(item.serialNumber);
    if (!equipmentId) continue;
    await tx.$executeRaw`
      INSERT INTO "StockMovement" (
        "id", "equipmentId", "type", "quantity", "notes", "movementDate", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${equipmentId},
        CAST(${item.type} AS "StockMovementType"),
        ${item.quantity},
        ${item.notes},
        now(),
        now(),
        now()
      )
    `;
  }

  return { equipmentBySerial, fixedCount: 0, financeSummary };
}

module.exports = {
  PROCUREMENT_LOTS,
  SCHOOL_EQUIPMENT_POOL,
  buildUnitMetadata,
  seedSchoolEquipmentInventory,
};

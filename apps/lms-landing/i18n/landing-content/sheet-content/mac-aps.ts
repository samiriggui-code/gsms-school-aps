export const sheetContentMacApsMessages = {
  fr: {
    landing: {
      sheetContent: {
        macAps: {
          meta: {
            headline: 'MAC APS - Agent de prevention et de securite',
            track: 'Securite privee',
            type: 'CNAPS / Recyclage',
            financingPrice: '650 €',
          },
          stats1: {
            durationTotal: '27-34h',
            durationBadge: 'Heures',
            durationText: 'formation recyclage',
            traineesTotal: '4-12',
            priceTotal: '325',
            priceBadge: 'EUR',
            priceText: 'a partir de',
            priceSuffix: '€',
            successTotal: '100%',
            successBadge: '100%',
          },
          stats2: [
            { total: '5', label: 'Modules cles' },
            { total: '27-34h', label: 'Volume horaire' },
            { total: '20%', label: 'Theorie' },
            { total: '80%', label: 'Pratique' },
          ],
          stats4: {
            items: [
              { total: 'Valide', label: 'Carte Pro CNAPS' },
              { total: 'SST', label: 'Certificat Secours' },
              { total: 'B1', label: 'Niveau Francais' },
              { total: 'Vierge', label: 'Casier Judiciaire' },
            ],
          },
          modules: [
            {
              id: 'M1',
              title: 'Principes de la Republique',
              details: [
                'Liberte, egalite, fraternite, laicite, non-discrimination.',
                'Prevention de la violence, respect de la dignite humaine.',
                'Symboles republicains et respect qui leur est du.',
                'Etat de droit et ordre public.',
              ],
            },
            {
              id: 'M2',
              title: 'Cadre juridique d intervention',
              details: [
                'Evolutions du Livre VI et code de deontologie.',
                'Port des uniformes et insignes, detention et usage des armes.',
                'Legitime defense, atteintes a l integrite physique.',
                'Obligations et responsabilites (articles 53 et 73 du CPP).',
              ],
            },
            {
              id: 'M3',
              title: 'Competences operationnelles generales',
              details: [
                'Gerer les conflits : techniques verbales et maitrise des emotions.',
                'Maitriser les mesures d inspection-filtrage : palpations et inspection de bagages.',
                'Modalites d agrement et cadre legislatif.',
              ],
            },
            {
              id: 'M4',
              title: 'Prevention des risques terroristes',
              details: [
                'Typologie des menaces et niveaux de risques.',
                'Vigilance, detection, reflexes de securite, profiling.',
                'Gestion des foules, reactions adaptees (courir / se cacher / combattre).',
                'Secourisme tactique : blessures par balles/explosions, gestes de survie.',
              ],
            },
            {
              id: 'M5',
              title: 'Secourisme - MAC SST',
              details: [
                'Actualisation des gestes et procedures de secours.',
                'Structure d intervention, analyse des risques, actions de protection.',
                'Utilisation du materiel INRS, mannequins, defibrillateur.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Carte Professionnelle',
                detail: 'En cours de validite ou numero prealable du CNAPS',
                importance: 'Critique',
              },
              {
                item: 'Secourisme',
                detail: 'Diplome SST ou equivalent en cours de validite (pour parcours 27h)',
                importance: 'Obligatoire',
              },
              {
                item: 'SST a renouveler',
                detail: 'Certificat SST a renouveler pour le parcours de 34h',
                importance: 'Requis',
              },
              {
                item: 'Moralite',
                detail: 'Verification administrative par le CNAPS',
                importance: 'Essentiel',
              },
            ],
          },
          presentation: {
            title: 'MAC APS - Maintien et Actualisation des Competences',
            intro:
              'Formation reglementaire obligatoire tous les 5 ans pour le renouvellement de la carte professionnelle CNAPS.',
            suffix: 'Repartition: 20% theorique / 80% pratique.',
            bullets: [
              'Actualisation juridique et deontologique',
              'Gestion des conflits et inspection-filtrage',
              'Prevention des risques terroristes',
              'MAC SST inclus (selon parcours 34h)',
            ],
            badge: 'Eligible CPF',
          },
          loyalty: {
            title: 'MAC APS',
            subtitle: 'Recyclage',
            description:
              'Maintien et actualisation des competences indispensables pour conserver la validite du titre.',
            audience: {
              title: 'Public concerne',
              subtitle: 'Beneficiaires',
              value: 'Agents de securite (APS)',
            },
            prerequisites: {
              title: 'Prerequis',
              subtitle: 'Conditions d acces',
              value: 'Carte pro valide + SST',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Attestation',
              badge: 'CNAPS',
              value: 'Attestation de suivi',
            },
          },
          certification: {
            steps: [
              {
                title: 'Evaluation continue',
                description:
                  'Auto-evaluations quotidiennes et mises en situation reelles sur cas pratiques (incendie, filtrage).',
                badge: 'Pratique',
              },
              {
                title: 'Test de connaissances',
                description:
                  'Evaluation ecrite finale (QCM/QCU) validant la mise a jour des connaissances juridiques et techniques.',
                badge: 'Theorie',
              },
              {
                title: 'Attestation de suivi',
                description:
                  'Remise d une attestation de suivi de formation MAC APS indispensable pour le renouvellement de la carte CNAPS.',
                badge: 'Attestation',
              },
            ],
          },
          sessions: {
            subtitle: 'Formation MAC APS',
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        macAps: {
          meta: {
            headline: 'MAC APS - Security prevention officer refresher',
            track: 'Private security',
            type: 'CNAPS / Refresher',
            financingPrice: '650 €',
          },
          stats1: {
            durationTotal: '27-34h',
            durationBadge: 'Hours',
            durationText: 'refresher training',
            traineesTotal: '4-12',
            priceTotal: '325',
            priceBadge: 'EUR',
            priceText: 'from',
            priceSuffix: '€',
            successTotal: '100%',
            successBadge: '100%',
          },
          stats2: [
            { total: '5', label: 'Key modules' },
            { total: '27-34h', label: 'Training volume' },
            { total: '20%', label: 'Theory' },
            { total: '80%', label: 'Practice' },
          ],
          stats4: {
            items: [
              { total: 'Valid', label: 'CNAPS professional card' },
              { total: 'SST', label: 'First-aid certificate' },
              { total: 'B1', label: 'French level' },
              { total: 'Clean', label: 'Criminal record' },
            ],
          },
          modules: [
            {
              id: 'M1',
              title: 'Republic values and ethics',
              details: [
                'Liberty, equality, fraternity, secularism, non-discrimination.',
                'Violence prevention and respect for human dignity.',
                'Republic symbols and due respect.',
                'Rule of law and public order.',
              ],
            },
            {
              id: 'M2',
              title: 'Legal framework of intervention',
              details: [
                'Recent updates to Book VI and code of ethics.',
                'Uniform and insignia rules, possession and use of weapons.',
                'Self-defense and protection of physical integrity.',
                'Duties and liabilities (articles 53 and 73 of criminal procedure).',
              ],
            },
            {
              id: 'M3',
              title: 'General operational skills',
              details: [
                'Conflict management: verbal techniques and emotional control.',
                'Screening and inspection procedures: pat-downs and bag checks.',
                'Accreditation terms and legal framework.',
              ],
            },
            {
              id: 'M4',
              title: 'Terrorism risk prevention',
              details: [
                'Threat typologies and risk levels.',
                'Vigilance, detection, security reflexes, behavioral profiling.',
                'Crowd management and adapted reactions (run / hide / fight).',
                'Tactical first aid: gunshot/explosion trauma and survival gestures.',
              ],
            },
            {
              id: 'M5',
              title: 'First aid - MAC SST',
              details: [
                'Updated first-aid procedures and actions.',
                'Intervention sequence, risk analysis, protection actions.',
                'Use of INRS equipment, mannequins, and AED.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Professional card',
                detail: 'Valid card or CNAPS provisional number',
                importance: 'Critical',
              },
              {
                item: 'First aid',
                detail: 'Valid SST diploma or equivalent (27h track)',
                importance: 'Mandatory',
              },
              {
                item: 'SST renewal',
                detail: 'SST certificate renewal required for 34h track',
                importance: 'Required',
              },
              {
                item: 'Background',
                detail: 'Administrative screening by CNAPS',
                importance: 'Essential',
              },
            ],
          },
          presentation: {
            title: 'MAC APS - Skills maintenance and update',
            intro:
              'Mandatory regulatory training every 5 years to renew the CNAPS professional card.',
            suffix: 'Split: 20% theory / 80% practice.',
            bullets: [
              'Legal and ethical update',
              'Conflict management and screening',
              'Terrorism risk prevention',
              'MAC SST included (34h track)',
            ],
            badge: 'CPF eligible',
          },
          loyalty: {
            title: 'MAC APS',
            subtitle: 'Refresher',
            description:
              'Skills maintenance and updates required to keep the certification valid.',
            audience: {
              title: 'Target audience',
              subtitle: 'Learners',
              value: 'Security officers (APS)',
            },
            prerequisites: {
              title: 'Prerequisites',
              subtitle: 'Entry requirements',
              value: 'Valid card + SST',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Proof',
              badge: 'CNAPS',
              value: 'Training attendance certificate',
            },
          },
          certification: {
            steps: [
              {
                title: 'Continuous assessment',
                description:
                  'Daily self-assessment and practical scenarios (fire safety, screening).',
                badge: 'Practical',
              },
              {
                title: 'Knowledge test',
                description:
                  'Final written assessment (MCQ/single-choice) validating legal and technical updates.',
                badge: 'Theory',
              },
              {
                title: 'Attendance certificate',
                description:
                  'Issued MAC APS attendance certificate required for CNAPS card renewal.',
                badge: 'Certificate',
              },
            ],
          },
          sessions: {
            subtitle: 'MAC APS training',
          },
        },
      },
    },
  },
};

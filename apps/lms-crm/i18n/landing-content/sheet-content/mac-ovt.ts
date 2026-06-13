export const sheetContentMacOvtMessages = {
  fr: {
    landing: {
      sheetContent: {
        macOvt: {
          meta: {
            headline:
              'MAC OVT - Maintien et Actualisation des Competences d Operateur en Videoprotection',
            track: 'Securite privee',
            type: 'Recyclage CNAPS',
            financingPrice: '490 €',
          },
          stats1: {
            durationTotal: '31h',
            durationBadge: '4-5j',
            durationText: 'recyclage periodique',
            traineesTotal: '4-12',
            priceTotal: '490',
            priceBadge: 'EUR',
            priceText: 'a partir de',
            priceSuffix: '€',
            successTotal: '100%',
            successBadge: '100%',
          },
          stats2: [
            { total: '5', label: 'Modules cles' },
            { total: '31h', label: 'Volume standard' },
            { total: '20%', label: 'Theorie' },
            { total: '80%', label: 'Pratique' },
          ],
          stats4: {
            items: [
              { total: 'OUI', label: 'Carte Pro valide' },
              { total: 'A jour', label: 'SST / Secourisme' },
              { total: 'B1', label: 'Niveau Francais' },
              { total: 'CNAPS', label: 'Controle CNAPS' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'Principes de la Republique',
              details: [
                'Liberte, egalite, fraternite, laicite, non-discrimination.',
                'Prevention de la violence et respect de la dignite humaine.',
                'Symboles republicains et Etat de droit.',
              ],
            },
            {
              id: 'UV2',
              title: 'Actualisation des connaissances juridiques',
              details: [
                'Evolutions recentes du Livre VI du CSI.',
                'Code de deontologie de la securite privee.',
                'Respect de la vie privee et droit de propriete.',
                'Dispositions specifiques a la videoprotection.',
              ],
            },
            {
              id: 'UV3',
              title: 'Actualisation des pratiques operationnelles',
              details: [
                'Evolution des menaces et de la delinquance.',
                'Analyse des comportements a risque.',
                'Consequences economiques des actes reprehensibles.',
              ],
            },
            {
              id: 'UV4',
              title: 'Maitrise des outils de travail',
              details: [
                'Reglages cameras analogiques et numeriques.',
                'Logiciels d exploitation video et VMS.',
                'Interconnexions (controle d acces, anti-intrusion).',
                'Techniques de maintenance de premier niveau.',
              ],
            },
            {
              id: 'UV5',
              title: 'Prevention des risques terroristes',
              details: [
                'Bons reflexes face aux menaces terroristes.',
                'Alerte des forces de l ordre et facilitation de l intervention.',
                'Alerte des secours.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Carte Pro',
                detail: 'Carte professionnelle Videoprotection en cours de validite',
                importance: 'Critique',
              },
              {
                item: 'Secourisme',
                detail: 'Diplome SST ou equivalent a jour (validite < 2 ans)',
                importance: 'Obligatoire',
              },
              {
                item: 'Francais',
                detail: 'Comprehension et expression ecrite/orale (Niveau B1)',
                importance: 'Indispensable',
              },
              {
                item: 'Moralite',
                detail: 'Absence de condamnation incompatible (enquete CNAPS)',
                importance: 'Requis',
              },
            ],
          },
          presentation: {
            title: 'MAC OVT - Recyclage Operateur Videoprotection',
            intro:
              'Actualisez vos competences professionnelles pour le renouvellement de votre carte CNAPS.',
            suffix: 'Ce stage couvre les evolutions juridiques et technologiques du secteur.',
            bullets: [
              'Actualisation des connaissances juridiques',
              'Evolution des menaces et pratiques operationnelles',
              'Maitrise des nouveaux outils de travail',
              'Prevention des risques terroristes',
            ],
            badge: 'Maintien de competence',
          },
          loyalty: {
            title: 'MAC OVT',
            subtitle: 'Recyclage',
            description:
              'Mise a jour indispensable tous les 5 ans pour conserver le droit d exercer en tant qu operateur.',
            audience: {
              title: 'Public concerne',
              subtitle: 'Beneficiaires',
              value: 'Operateurs en poste',
            },
            prerequisites: {
              title: 'Prerequis',
              subtitle: 'Conditions d acces',
              value: 'Carte Pro + SST',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Renouvellement',
              badge: 'MAC',
              value: 'Carte CNAPS',
            },
          },
          certification: {
            steps: [
              {
                title: 'Actualisation juridique',
                description:
                  'Validation des connaissances sur les evolutions du Livre VI du Code de la Securite Interieure et du RGPD.',
                badge: 'Legal',
              },
              {
                title: 'Controle continu',
                description:
                  'Evaluation des aptitudes techniques lors des mises en situation pratique sur PC de videoprotection.',
                badge: 'Pratique',
              },
              {
                title: 'Attestation MAC',
                description:
                  'Delivrance de l attestation de suivi permettant le renouvellement de la carte professionnelle aupres du CNAPS.',
                badge: 'CNAPS',
              },
            ],
          },
          sessions: {
            subtitle: 'Formation MAC OVT',
            layout: 'grid',
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        macOvt: {
          meta: {
            headline: 'MAC OVT - Refresher for video-surveillance operators',
            track: 'Private security',
            type: 'CNAPS refresher',
            financingPrice: '490 €',
          },
          stats1: {
            durationTotal: '31h',
            durationBadge: '4-5d',
            durationText: 'periodic refresher',
            traineesTotal: '4-12',
            priceTotal: '490',
            priceBadge: 'EUR',
            priceText: 'from',
            priceSuffix: '€',
            successTotal: '100%',
            successBadge: '100%',
          },
          stats2: [
            { total: '5', label: 'Key modules' },
            { total: '31h', label: 'Standard volume' },
            { total: '20%', label: 'Theory' },
            { total: '80%', label: 'Practice' },
          ],
          stats4: {
            items: [
              { total: 'YES', label: 'Valid professional card' },
              { total: 'Up to date', label: 'SST / First aid' },
              { total: 'B1', label: 'French level' },
              { total: 'CNAPS', label: 'CNAPS check' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'Republic principles',
              details: [
                'Liberty, equality, fraternity, secularism, non-discrimination.',
                'Violence prevention and respect for human dignity.',
                'Republic symbols and rule of law.',
              ],
            },
            {
              id: 'UV2',
              title: 'Legal knowledge update',
              details: [
                'Recent updates to Book VI of internal security code.',
                'Private security code of ethics.',
                'Privacy and property rights.',
                'Video-surveillance specific rules.',
              ],
            },
            {
              id: 'UV3',
              title: 'Operational practices update',
              details: [
                'Evolution of threats and delinquency.',
                'Risk behavior analysis.',
                'Economic impact of unlawful acts.',
              ],
            },
            {
              id: 'UV4',
              title: 'Mastering work tools',
              details: [
                'Analog and digital camera settings.',
                'Video management software and VMS.',
                'Interconnections (access control, intrusion systems).',
                'First-level maintenance techniques.',
              ],
            },
            {
              id: 'UV5',
              title: 'Terrorism risk prevention',
              details: [
                'Best practices when facing terrorist threats.',
                'Alerting law enforcement and facilitating intervention.',
                'Emergency services alert workflow.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Professional card',
                detail: 'Valid video-surveillance professional card',
                importance: 'Critical',
              },
              {
                item: 'First aid',
                detail: 'Valid SST diploma or equivalent (validity < 2 years)',
                importance: 'Mandatory',
              },
              {
                item: 'French',
                detail: 'Written and spoken comprehension (B1 level)',
                importance: 'Essential',
              },
              {
                item: 'Background',
                detail: 'No disqualifying conviction (CNAPS inquiry)',
                importance: 'Required',
              },
            ],
          },
          presentation: {
            title: 'MAC OVT - Video operator refresher',
            intro:
              'Refresh your professional skills to renew your CNAPS professional card.',
            suffix: 'This course covers legal and technological updates in the sector.',
            bullets: [
              'Legal knowledge update',
              'Threat evolution and operational practices',
              'Mastery of new work tools',
              'Terrorism risk prevention',
            ],
            badge: 'Skills maintenance',
          },
          loyalty: {
            title: 'MAC OVT',
            subtitle: 'Refresher',
            description:
              'Essential update every 5 years to keep the right to operate as an operator.',
            audience: {
              title: 'Target audience',
              subtitle: 'Learners',
              value: 'Current operators',
            },
            prerequisites: {
              title: 'Prerequisites',
              subtitle: 'Entry requirements',
              value: 'Professional card + SST',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Renewal',
              badge: 'MAC',
              value: 'CNAPS card',
            },
          },
          certification: {
            steps: [
              {
                title: 'Legal update',
                description:
                  'Validation of updates on Book VI of internal security code and GDPR.',
                badge: 'Legal',
              },
              {
                title: 'Continuous assessment',
                description:
                  'Evaluation of technical skills through practical video-control room scenarios.',
                badge: 'Practical',
              },
              {
                title: 'MAC certificate',
                description:
                  'Issuance of attendance certificate required to renew the professional CNAPS card.',
                badge: 'CNAPS',
              },
            ],
          },
          sessions: {
            subtitle: 'MAC OVT training',
            layout: 'grid',
          },
        },
      },
    },
  },
};

export const sheetContentAsraMessages = {
  fr: {
    landing: {
      sheetContent: {
        asra: {
          meta: {
            headline: 'TITRE ASRA D - Agent de Securite Renforcee Arme (Cat. D)',
            track: 'Securite privee armee',
            type: 'CNAPS / UFACS',
            financingPrice: '2 590 €',
          },
          stats1: {
            durationTotal: '70-100h',
            durationBadge: '10-15j',
            durationText: 'formation intensive',
            traineesTotal: '1-10',
            priceTotal: '2590',
            priceBadge: 'EUR',
            priceText: 'a partir de',
            priceSuffix: '€',
            successTotal: '94%',
            successBadge: '98%',
          },
          stats2: [
            { total: '4', label: 'Unites de valeur' },
            { total: '100h', label: 'Volume max' },
            { total: '25%', label: 'Theorie' },
            { total: '75%', label: 'Pratique' },
          ],
          stats4: {
            items: [
              { total: 'Valide', label: 'Carte Pro APS' },
              { total: 'Apte', label: 'Certificat medical' },
              { total: 'SST', label: 'Secourisme a jour' },
              { total: 'Psychos', label: 'Tests aptitude' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'Cadre juridique et deontologique',
              details: [
                'Livre VI du CSI et ses decrets.',
                'Reglementation sur l acquisition, la detention et l usage des armes.',
                'Principes de legitime defense, absolue necessite et proportionnalite.',
                'Preparation mentale et physique a l intervention.',
              ],
            },
            {
              id: 'UV2',
              title: 'Connaissance technique des armes de categorie D',
              details: [
                'Caracteristiques et entretien des armes d impact et aerosols.',
                'Regles de securite, stockage et transport des armes.',
                'Utilisation des aerosols de defense (poivre, lacrymogene).',
                'Maitrise des armes d impact : baton telescopique et tonfa.',
              ],
            },
            {
              id: 'UV3',
              title: 'Techniques d intervention et maniement des armes',
              details: [
                'Maitrise de la violence sans arme (frappes, controle, deplacements).',
                'Techniques de garde et de mise au sol.',
                'Utilisation d armes d impact en situation reelle.',
                'Gestion d individus violents, entraves et controles au sol.',
              ],
            },
            {
              id: 'UV4',
              title: 'Tactique et gestion operationnelle',
              details: [
                'Utiliser son arme dans le strict respect de la gradation de la force.',
                'Coordination avec les forces de l ordre et gestion post-intervention.',
                'Gestion du stress et prevention du risque post-traumatique.',
                'Justification ecrite et orale de ses actes (rapports).',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Carte Pro APS',
                detail: 'En cours de validite (enquete administrative CNAPS)',
                importance: 'Critique',
              },
              {
                item: 'Medical',
                detail: 'Certificat medical recent d aptitude a l armement',
                importance: 'Obligatoire',
              },
              {
                item: 'Secourisme',
                detail: 'SST / PSE1 / PSC1 en cours de validite',
                importance: 'Indispensable',
              },
              {
                item: 'Langue',
                detail: 'Maitrise du francais (niveau B1 minimum)',
                importance: 'Requis',
              },
              {
                item: 'Psychologie',
                detail: 'Tests psychotechniques et d aptitude au stress',
                importance: 'Requis',
              },
            ],
          },
          presentation: {
            title: 'ASRA D - Agent de Securite Renforcee Arme (Cat. D)',
            intro:
              'Maitrisez l usage professionnel des armes de categorie D (baton, tonfa, aerosol) dans le respect du Livre VI du CSI.',
            suffix: 'Repartition: 25% theorique / 75% pratique.',
            bullets: [
              'Cadre legal de l usage des armes',
              'Techniques de maniement et de garde',
              'Gestion des interventions sous stress',
              'Tactique et gradation de la force',
            ],
            badge: 'Eligible CPF',
          },
          loyalty: {
            title: 'ASRA D',
            subtitle: 'Armement',
            description:
              'Apprentissage tactique intensif combinant technique, cadre legal et psychologie de l intervention.',
            audience: {
              title: 'Public concerne',
              subtitle: 'Beneficiaires',
              value: 'APS, Militaires, Policiers',
            },
            prerequisites: {
              title: 'Prerequis',
              subtitle: 'Conditions d acces',
              value: 'Carte APS + Medical + B1',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Niveau RNCP',
              badge: 'UFACS',
              value: 'Validation Jury',
            },
          },
          certification: {
            steps: [
              {
                title: 'Controle des postures',
                description:
                  'Observation continue des reflexes de securite, des positions de garde et de la prise de decision.',
                badge: 'Tactique',
              },
              {
                title: 'Evaluation de la force',
                description:
                  'Validation de la capacite a justifier ses actes et a respecter la gradation de la force avant et apres action.',
                badge: 'Juridique',
              },
              {
                title: 'Certification UFACS',
                description:
                  'Examen final valide par le certificateur UFACS permettant l exercice des missions armees.',
                badge: 'Titre',
              },
            ],
          },
          sessions: {
            subtitle: 'TITRE ASRA D',
            layout: 'compact',
            emptyTitle: 'Prochaines sessions en cours de planification',
            emptyHint: 'Les creneaux publies dans le catalogue CRM apparaitront ici automatiquement.',
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        asra: {
          meta: {
            headline: 'ASRA D TITLE - Armed reinforced security officer (Cat. D)',
            track: 'Armed private security',
            type: 'CNAPS / UFACS',
            financingPrice: '2,590 €',
          },
          stats1: {
            durationTotal: '70-100h',
            durationBadge: '10-15d',
            durationText: 'intensive training',
            traineesTotal: '1-10',
            priceTotal: '2590',
            priceBadge: 'EUR',
            priceText: 'from',
            priceSuffix: '€',
            successTotal: '94%',
            successBadge: '98%',
          },
          stats2: [
            { total: '4', label: 'Value units' },
            { total: '100h', label: 'Maximum volume' },
            { total: '25%', label: 'Theory' },
            { total: '75%', label: 'Practice' },
          ],
          stats4: {
            items: [
              { total: 'Valid', label: 'APS professional card' },
              { total: 'Fit', label: 'Medical certificate' },
              { total: 'SST', label: 'Up-to-date first aid' },
              { total: 'Psych', label: 'Aptitude tests' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'Legal and ethical framework',
              details: [
                'Book VI of internal security code and related decrees.',
                'Regulations on acquisition, possession and use of weapons.',
                'Self-defense, absolute necessity and proportionality principles.',
                'Mental and physical preparation for intervention.',
              ],
            },
            {
              id: 'UV2',
              title: 'Technical knowledge of category D weapons',
              details: [
                'Characteristics and maintenance of impact weapons and sprays.',
                'Safety rules, storage and transport of weapons.',
                'Defensive spray usage (pepper, tear gas).',
                'Mastery of impact weapons: telescopic baton and tonfa.',
              ],
            },
            {
              id: 'UV3',
              title: 'Intervention techniques and weapon handling',
              details: [
                'Unarmed control techniques (strikes, control, movement).',
                'Guard and takedown techniques.',
                'Use of impact weapons in real scenarios.',
                'Managing violent individuals, restraints, and ground control.',
              ],
            },
            {
              id: 'UV4',
              title: 'Tactics and operational management',
              details: [
                'Use force strictly according to escalation principles.',
                'Coordination with law enforcement and post-incident handling.',
                'Stress management and post-trauma risk prevention.',
                'Written and oral justification of actions (reports).',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'APS card',
                detail: 'Valid card (CNAPS administrative inquiry)',
                importance: 'Critical',
              },
              {
                item: 'Medical',
                detail: 'Recent medical certificate of fitness for arming',
                importance: 'Mandatory',
              },
              {
                item: 'First aid',
                detail: 'Valid SST / PSE1 / PSC1',
                importance: 'Essential',
              },
              {
                item: 'Language',
                detail: 'French proficiency (minimum B1)',
                importance: 'Required',
              },
              {
                item: 'Psychology',
                detail: 'Psychometric and stress aptitude tests',
                importance: 'Required',
              },
            ],
          },
          presentation: {
            title: 'ASRA D - Armed reinforced security officer (Cat. D)',
            intro:
              'Master professional use of category D weapons (baton, tonfa, spray) in full compliance with Book VI.',
            suffix: 'Split: 25% theory / 75% practice.',
            bullets: [
              'Legal framework for weapon usage',
              'Handling and guard techniques',
              'Intervention management under stress',
              'Tactics and force escalation',
            ],
            badge: 'CPF eligible',
          },
          loyalty: {
            title: 'ASRA D',
            subtitle: 'Arming',
            description:
              'Intensive tactical learning combining technique, legal framework and intervention psychology.',
            audience: {
              title: 'Target audience',
              subtitle: 'Learners',
              value: 'Security officers, military, police',
            },
            prerequisites: {
              title: 'Prerequisites',
              subtitle: 'Entry requirements',
              value: 'APS card + medical + B1',
            },
            certification: {
              title: 'Certification',
              subtitle: 'RNCP level',
              badge: 'UFACS',
              value: 'Jury validation',
            },
          },
          certification: {
            steps: [
              {
                title: 'Posture control',
                description:
                  'Continuous observation of safety reflexes, guard positions and decision making.',
                badge: 'Tactical',
              },
              {
                title: 'Use-of-force assessment',
                description:
                  'Validation of ability to justify actions and respect force escalation before and after action.',
                badge: 'Legal',
              },
              {
                title: 'UFACS certification',
                description:
                  'Final exam validated by UFACS certifier enabling armed mission operations.',
                badge: 'Title',
              },
            ],
          },
          sessions: {
            subtitle: 'ASRA D title',
            layout: 'compact',
            emptyTitle: 'Upcoming sessions being scheduled',
            emptyHint: 'Slots published in the CRM catalogue will appear here automatically.',
          },
        },
      },
    },
  },
};

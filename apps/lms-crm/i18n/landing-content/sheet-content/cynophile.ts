export const sheetContentCynophileMessages = {
  fr: {
    landing: {
      sheetContent: {
        cynophile: {
          meta: {
            headline: 'Titre ASC - Agent de securite cynophile (niveau III)',
            track: 'Securite privee cynophile',
            type: 'CNAPS / Titre ASC',
            centerNote:
              "Form'SSI — formations au centre de Rueil-Malmaison (9 av. Alexandre Maistrasse, 92500).",
          },
          stats2: [
            { total: '5', label: 'Unites de valeur (UV)' },
            { total: '315h', label: 'Volume indicatif hors examen' },
            { total: 'UV 1-2', label: 'Epreuves QCU theoriques' },
            { total: 'UV 3-5', label: 'Mises en situation pratiques' },
          ],
          stats4: {
            items: [
              { total: 'CNAPS', label: 'Autorisation ou carte pro valide' },
              { total: '18 ans', label: 'Age minimum a l entree' },
              { total: 'Chien', label: 'Conforme au referentiel (LOF / races autorisees)' },
              { total: 'Sante', label: 'Carnet de sante et vaccins a jour' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'Legislation et reglementations cynophiles - 35 h',
              details: [
                'Cadre juridique du metier d agent cynophile et responsabilites du maitre-chien.',
                'Deontologie, obligations CNAPS et environnement de travail.',
                'Reglementation transport et presence du chien sur les missions.',
              ],
            },
            {
              id: 'UV2',
              title: 'Connaissances generales du chien - 35 h',
              details: [
                'Comportement, education de base, bien-etre animal.',
                'Identification, sante et documents obligatoires.',
                'Relations avec le public et prevention des incidents.',
              ],
            },
            {
              id: 'UV3',
              title: 'Obeissance et sociabilite - 54 h',
              details: [
                'Exercices d obeissance appliques aux missions de securite.',
                'Socialisation et gestion des stimuli en environnement urbain.',
                'Renforcement du binome operateur / chien.',
              ],
            },
            {
              id: 'UV4',
              title: 'Maitrise du chien dans le cadre de la legitime defense - 92 h',
              details: [
                'Techniques de protection et usage maitrise du mordant.',
                'Analyse de situation, gradation de la reponse et securisation.',
                "Equipements de protection et protocoles Form'SSI.",
              ],
            },
            {
              id: 'UV5',
              title: 'Detection avec chien - 99 h',
              details: [
                'Principes de recherche olfactive et protocoles operationnels.',
                'Mises en situation sur contextes varies.',
                'Coordination avec les equipes et compte rendu d intervention.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'Autorisation CNAPS',
                detail:
                  'Autorisation prealable en cours de validite ou carte professionnelle en cours de validite selon le cas.',
                importance: 'Critique',
              },
              {
                item: 'Age',
                detail: '18 ans revolus a l entree en formation.',
                importance: 'Obligatoire',
              },
              {
                item: 'Chien',
                detail:
                  'Chien inscrit au LOF ou conforme aux races autorisees au mordant ; identification ; carnet de sante et vaccinations a jour.',
                importance: 'Obligatoire',
              },
              {
                item: 'Propriete du chien',
                detail:
                  'Le stagiaire doit etre proprietaire du chien dans les delais fixes par le referentiel avant les epreuves finales.',
                importance: 'Indispensable',
              },
              {
                item: 'Assurance',
                detail:
                  'Attestation de responsabilite civile couvrant la detention et la manipulation du chien en formation.',
                importance: 'Obligatoire',
              },
              {
                item: 'Categories de chiens',
                detail:
                  'Respect des restrictions reglementaires pour les categories concernees (tests et formalites complementaires si requis).',
                importance: 'Selon cas',
              },
            ],
          },
          presentation: {
            title: 'Titre ASC - Agent de securite cynophile (niveau III)',
            intro:
              'Formation initiale pour exercer le metier d agent de securite cynophile : binome maitre-chien, prevention des risques, interventions avec chien et conformite au cadre CNAPS / titre professionnel.',
            bullets: [
              'Legislation et reglementation cynophiles',
              'Travail du binome, obeissance, sociabilite et conduite operationnelle',
              'Situations de legitime defense et gestion du mordant',
              'Detection avec chien et preparation aux epreuves du titre',
            ],
            badge: 'Eligibilite financements selon dossier (CPF, France Travail, OPCO...)',
          },
          loyalty: {
            title: 'ASC Cynophile',
            subtitle: 'Maitre-chien',
            description:
              'Parcours certifiant preparant au titre professionnel et a l examen en binome avec un chien conforme aux exigences du referentiel.',
            audience: {
              title: 'Public concerne',
              subtitle: 'Candidats',
              value: 'Futurs agents cynophiles (titre ASC)',
            },
            dog: {
              title: 'Binome',
              subtitle: 'Chien',
              value: 'LOF ou races habilitees au mordant (cf. liste reglementaire)',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Diplome',
              badge: 'CNAPS',
              value: 'Titre ASC niveau III',
            },
            contact: "Centre : Form'SSI - contact@form-ssi.fr - 01 71 11 39 63",
          },
          certification: {
            steps: [
              {
                title: 'Epreuves theoriques (UV 1 et 2)',
                description:
                  'Questionnaires a choix unique (QCU) couvrant la reglementation, les connaissances cynophiles et les fondamentaux du metier.',
                badge: 'Theorie',
              },
              {
                title: 'Epreuves pratiques (UV 3 a 5)',
                description:
                  'Mises en situation avec tirage au sort de contextes ; demonstration du binome maitre-chien sur les competences du titre.',
                badge: 'Pratique',
              },
              {
                title: 'Titre ASC niveau III',
                description:
                  'Validation du titre permettant la demande de carte professionnelle CNAPS pour missions cynophiles dans le cadre legal.',
                badge: 'Diplome',
              },
            ],
            note:
              "Modalites d examen et lieu conventionne communiques lors de votre inscription aupres de Form'SSI.",
          },
          sessions: {
            subtitle: 'Titre ASC - Agent cynophile',
            layout: 'compact',
            emptyTitle: 'Prochaines sessions en cours de planification',
            emptyHint:
              "Les dates publiees dans le catalogue CRM Form'SSI apparaitront ici automatiquement.",
          },
          financing: {
            defaultPrice: '—',
          },
        },
      },
    },
  },
  en: {
    landing: {
      sheetContent: {
        cynophile: {
          meta: {
            headline: 'ASC title - K9 security officer (level III)',
            track: 'K9 private security',
            type: 'CNAPS / ASC title',
            centerNote:
              "Form'SSI - training center in Rueil-Malmaison (9 av. Alexandre Maistrasse, 92500).",
          },
          stats2: [
            { total: '5', label: 'Value units (UV)' },
            { total: '315h', label: 'Indicative volume excluding exam' },
            { total: 'UV 1-2', label: 'Theoretical single-choice tests' },
            { total: 'UV 3-5', label: 'Practical scenarios' },
          ],
          stats4: {
            items: [
              { total: 'CNAPS', label: 'Valid authorization or professional card' },
              { total: '18 years', label: 'Minimum age at entry' },
              { total: 'Dog', label: 'Compliant with framework (LOF / authorized breeds)' },
              { total: 'Health', label: 'Health record and vaccines up to date' },
            ],
          },
          modules: [
            {
              id: 'UV1',
              title: 'K9 legislation and regulations - 35h',
              details: [
                'Legal framework of K9 officer role and handler responsibilities.',
                'Ethics, CNAPS obligations and working environment.',
                'Rules for transport and dog presence during missions.',
              ],
            },
            {
              id: 'UV2',
              title: 'General canine knowledge - 35h',
              details: [
                'Behavior, basic education, animal welfare.',
                'Identification, health and mandatory documents.',
                'Public interactions and incident prevention.',
              ],
            },
            {
              id: 'UV3',
              title: 'Obedience and socialization - 54h',
              details: [
                'Obedience exercises applied to security missions.',
                'Socialization and stimulus management in urban settings.',
                'Handler/dog team strengthening.',
              ],
            },
            {
              id: 'UV4',
              title: 'Dog control in legitimate defense context - 92h',
              details: [
                'Protection techniques and controlled bite usage.',
                'Situation analysis, response escalation and securing.',
                "Protective equipment and Form'SSI protocols.",
              ],
            },
            {
              id: 'UV5',
              title: 'Detection with dog - 99h',
              details: [
                'Scent search principles and operational protocols.',
                'Practical scenarios across varied contexts.',
                'Team coordination and intervention reporting.',
              ],
            },
          ],
          prerequisites: {
            rows: [
              {
                item: 'CNAPS authorization',
                detail:
                  'Valid prior authorization or valid professional card, depending on profile.',
                importance: 'Critical',
              },
              {
                item: 'Age',
                detail: '18 years old at training entry.',
                importance: 'Mandatory',
              },
              {
                item: 'Dog',
                detail:
                  'LOF registered dog or breed authorized for bite work; identification, health record and vaccinations up to date.',
                importance: 'Mandatory',
              },
              {
                item: 'Dog ownership',
                detail:
                  'Trainee must own the dog within deadlines defined by the framework before final exams.',
                importance: 'Essential',
              },
              {
                item: 'Insurance',
                detail:
                  'Civil liability certificate covering dog possession and handling during training.',
                importance: 'Mandatory',
              },
              {
                item: 'Dog categories',
                detail:
                  'Compliance with category restrictions (additional tests/formalities if required).',
                importance: 'Case by case',
              },
            ],
          },
          presentation: {
            title: 'ASC title - K9 security officer (level III)',
            intro:
              'Initial training to work as a K9 security officer: handler-dog team, risk prevention, dog-assisted intervention and CNAPS/professional-title compliance.',
            bullets: [
              'K9 legislation and regulations',
              'Handler-dog teamwork, obedience, socialization and operational conduct',
              'Legitimate defense situations and bite management',
              'Detection with dog and exam preparation',
            ],
            badge: 'Funding options available depending on file (CPF, France Travail, OPCO...)',
          },
          loyalty: {
            title: 'ASC K9',
            subtitle: 'Handler',
            description:
              'Certifying pathway preparing for the professional title and exam with a dog compliant with framework requirements.',
            audience: {
              title: 'Target audience',
              subtitle: 'Candidates',
              value: 'Future K9 security officers (ASC title)',
            },
            dog: {
              title: 'Team',
              subtitle: 'Dog',
              value: 'LOF or authorized bite-work breeds (see regulation list)',
            },
            certification: {
              title: 'Certification',
              subtitle: 'Diploma',
              badge: 'CNAPS',
              value: 'ASC title level III',
            },
            contact: "Center: Form'SSI - contact@form-ssi.fr - 01 71 11 39 63",
          },
          certification: {
            steps: [
              {
                title: 'Theory exams (UV 1 and 2)',
                description:
                  'Single-choice tests covering regulation, canine knowledge and role fundamentals.',
                badge: 'Theory',
              },
              {
                title: 'Practical exams (UV 3 to 5)',
                description:
                  'Scenario-based exercises with random contexts; handler-dog demonstration on title competencies.',
                badge: 'Practical',
              },
              {
                title: 'ASC title level III',
                description:
                  'Title validation allowing CNAPS professional-card application for K9 missions in legal framework.',
                badge: 'Diploma',
              },
            ],
            note:
              "Exam modalities and approved venue are provided during registration with Form'SSI.",
          },
          sessions: {
            subtitle: 'ASC title - K9 officer',
            layout: 'compact',
            emptyTitle: 'Upcoming sessions being scheduled',
            emptyHint: "Dates published in Form'SSI CRM catalogue will appear here automatically.",
          },
          financing: {
            defaultPrice: '—',
          },
        },
      },
    },
  },
};

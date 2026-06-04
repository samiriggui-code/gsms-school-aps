export const preinscriptionMessages = {
  fr: {
    landing: {
      preinscription: {
        sheetTitle: 'Preinscription candidat',
        sheetDescription: 'Dossier d entree en formation avec verification de conformite',
        formTitle: 'Candidature Form SSI',
        verificationBadge: 'Verification requise',
        pathwayLabel: 'Parcours:',
        pathwayValue: 'Securite / Incendie / Habilitation',
        channelLabel: 'Canal',
        channelValue: 'Landing centralise',
        tabs: {
          profile: 'Profil candidat',
          compliance: 'Conformite',
          project: 'Projet de formation',
        },
        fields: {
          firstName: { label: 'Prenom', placeholder: 'Prenom' },
          lastName: { label: 'Nom', placeholder: 'Nom' },
          email: { label: 'Email', placeholder: 'email@domaine.fr' },
          phone: { label: 'Telephone', placeholder: '06 00 00 00 00' },
          birthDate: { label: 'Date de naissance' },
          birthPlace: { label: 'Lieu de naissance', placeholder: 'Ville de naissance' },
          nationality: { label: 'Nationalite', placeholder: 'Nationalite' },
          currentSituation: {
            label: 'Situation actuelle',
            placeholder: 'Ex: Salarie, demandeur d emploi...',
          },
          address: { label: 'Adresse', placeholder: 'Adresse complete' },
          postalCode: { label: 'Code postal', placeholder: 'Code postal' },
          city: { label: 'Ville', placeholder: 'Ville' },
          formation: {
            label: 'Formation visee',
            placeholder: 'Selectionner une formation',
          },
          funding: {
            label: 'Mode de financement souhaite',
            placeholder: 'Choisir un mode de financement',
            hint: 'Indispensable pour anticiper les sessions et le volume par type de prise en charge.',
          },
          session: {
            label: 'Session souhaitee (optionnel)',
            loadingPlaceholder: 'Chargement des sessions...',
            placeholder: 'Choisir une session ou une preference',
            flexibleOption: 'Periode a preciser avec l ecole',
            flexiblePlaceholder: 'Ex: Mai 2026 / des que possible',
            noSessionsHint:
              'Aucune session publiee pour cette formation — indiquez une periode souhaitee ci-dessus.',
            fullSuffix: ' (complet)',
            closedSuffix: ' (inscriptions fermees)',
          },
          experience: {
            label: 'Experience securite / incendie (optionnel)',
            placeholder: 'Precisez vos experiences, diplomes ou missions pertinentes',
          },
          motivation: {
            label: 'Motivation / besoin candidat (optionnel)',
            placeholder: 'Expliquez votre objectif professionnel',
          },
        },
        funding: {
          cpf: 'CPF (Compte personnel de formation)',
          transition: 'Transition professionnelle / plan de developpement des competences',
          opco: 'OPCO / Employeur - prise en charge',
          franceTravail: 'France Travail / AIF / aide publique',
          selfFunded: 'Autofinancement',
          apprenticeship: 'Contrat apprentissage ou professionnalisation',
          discuss: 'A discuter avec l ecole / je ne sais pas encore',
        },
        compliance: {
          intro: 'Verifications de conformite demandees pour constituer votre dossier.',
          hasValidIdentityDocument: 'Je dispose d une piece d identite valide.',
          hasNoIncompatibleConviction:
            'Je confirme ne pas avoir de condamnation incompatible avec le metier vise.',
          meetsFormationPrerequisites:
            'Je confirme repondre aux prerequis de la formation choisie.',
          acceptsInternalRules:
            'J accepte le reglement interieur et le processus de verification Form SSI.',
          acknowledgesCnapsHandledBySchool:
            'J ai compris que la demande d autorisation prealable CNAPS est geree par l ecole.',
          certifiesInformationAccuracy: 'Je certifie l exactitude des informations transmises.',
        },
        actions: {
          cancel: 'Annuler',
          submit: 'Valider la candidature',
          submitting: 'Envoi en cours...',
        },
        toasts: {
          success: 'Preinscription enregistree. Notre equipe vous contacte rapidement.',
          errorGeneric: 'Une erreur est survenue pendant la preinscription.',
          saveFailed: 'Impossible d enregistrer la preinscription.',
        },
      },
    },
  },
  en: {
    landing: {
      preinscription: {
        sheetTitle: 'Candidate pre-registration',
        sheetDescription: 'Training enrolment file with compliance verification',
        formTitle: 'Form SSI application',
        verificationBadge: 'Verification required',
        pathwayLabel: 'Pathway:',
        pathwayValue: 'Security / Fire safety / Authorisation',
        channelLabel: 'Channel',
        channelValue: 'Central landing page',
        tabs: {
          profile: 'Candidate profile',
          compliance: 'Compliance',
          project: 'Training project',
        },
        fields: {
          firstName: { label: 'First name', placeholder: 'First name' },
          lastName: { label: 'Last name', placeholder: 'Last name' },
          email: { label: 'Email', placeholder: 'email@example.com' },
          phone: { label: 'Phone', placeholder: '06 00 00 00 00' },
          birthDate: { label: 'Date of birth' },
          birthPlace: { label: 'Place of birth', placeholder: 'City of birth' },
          nationality: { label: 'Nationality', placeholder: 'Nationality' },
          currentSituation: {
            label: 'Current situation',
            placeholder: 'E.g. employed, job seeker...',
          },
          address: { label: 'Address', placeholder: 'Full address' },
          postalCode: { label: 'Postcode', placeholder: 'Postcode' },
          city: { label: 'City', placeholder: 'City' },
          formation: {
            label: 'Target training programme',
            placeholder: 'Select a programme',
          },
          funding: {
            label: 'Preferred funding method',
            placeholder: 'Choose a funding method',
            hint: 'Required to plan sessions and capacity by funding type.',
          },
          session: {
            label: 'Preferred session (optional)',
            loadingPlaceholder: 'Loading sessions...',
            placeholder: 'Choose a session or preference',
            flexibleOption: 'Dates to be agreed with the school',
            flexiblePlaceholder: 'E.g. May 2026 / as soon as possible',
            noSessionsHint:
              'No published sessions for this programme — indicate your preferred dates above.',
            fullSuffix: ' (full)',
            closedSuffix: ' (registration closed)',
          },
          experience: {
            label: 'Security / fire safety experience (optional)',
            placeholder: 'Describe relevant experience, qualifications or assignments',
          },
          motivation: {
            label: 'Motivation / candidate needs (optional)',
            placeholder: 'Explain your professional objective',
          },
        },
        funding: {
          cpf: 'CPF (Personal training account)',
          transition: 'Career transition / skills development plan',
          opco: 'OPCO / Employer funding',
          franceTravail: 'France Travail / AIF / public support',
          selfFunded: 'Self-funded',
          apprenticeship: 'Apprenticeship or professionalisation contract',
          discuss: 'To discuss with the school / not sure yet',
        },
        compliance: {
          intro: 'Compliance checks required to build your application file.',
          hasValidIdentityDocument: 'I hold a valid identity document.',
          hasNoIncompatibleConviction:
            'I confirm I have no conviction incompatible with the intended profession.',
          meetsFormationPrerequisites:
            'I confirm I meet the prerequisites for the selected programme.',
          acceptsInternalRules:
            'I accept the internal regulations and the Form SSI verification process.',
          acknowledgesCnapsHandledBySchool:
            'I understand that the CNAPS prior authorisation application is handled by the school.',
          certifiesInformationAccuracy: 'I certify that the information provided is accurate.',
        },
        actions: {
          cancel: 'Cancel',
          submit: 'Submit application',
          submitting: 'Submitting...',
        },
        toasts: {
          success: 'Pre-registration recorded. Our team will contact you shortly.',
          errorGeneric: 'An error occurred during pre-registration.',
          saveFailed: 'Unable to save pre-registration.',
        },
      },
    },
  },
} as const;

# VisioFormation — arborescence app (essai)

Source : cartographie UI Claude · 27 août 2026 · `app3.visioformation.fr`  
26 catégories · 90+ pages

```
VisioFormation (app3)
│
├── Tableau de Bord
│   └── dashboard.php
│
├── Intelligence Artificielle
│   ├── Agent IA (Lilya) .................... AI-visioformation-assistant-v2.php
│   ├── Programmes par IA ................... create-library-ai-choice.php
│   ├── Évaluations par IA .................. evaluation-ai-create.php
│   ├── Déroulé pédagogique par IA .......... deroule-pedagogique-create.php
│   ├── Support de formation PowerPoint IA .. support-formation-create.php
│   ├── Audit Qualiopi par IA
│   │   ├── Accès / tutoriel ................ acces-audit-qualiopi-ia.php
│   │   ├── Référentiel 32 ind. ............. qualiopi-ai.php
│   │   └── Fiche indicateur ................ qualiopi-ai-indicateur.php
│   └── E-learning par IA ................... acces-generation-elearning-ia.php
│
├── CRM Leads
│   ├── Ajouter ............................. add-lead.php
│   └── Tunnel de Vente ..................... crm.php
│
├── Clients & Financeurs
│   ├── Ajouter un Apprenant ................ apprenants-ajouter.php
│   ├── Ajouter une Entreprise .............. entreprise-ajouter.php
│   ├── Ajouter un Financeur ................ financeur-ajouter.php
│   ├── Profils ............................. apprenants-profiles.php
│   ├── Tous Les Apprenants ................. apprenants-tous.php
│   ├── Toutes Les Entreprises .............. entreprises-toutes.php
│   ├── Tous Les Financeurs ................. financeurs-tous.php
│   ├── Importer des Apprenants ............. apprenants-import.php
│   ├── Importer des Entreprises ............ entreprises-import.php
│   └── Alertes - Durée de Validité ......... validity-alert.php
│
├── Formateurs
│   ├── Ajouter ............................. formateurs-ajouter.php
│   ├── Profils ............................. formateurs-profiles.php
│   └── Tous ................................ formateurs-tous.php
│
├── Formations
│   ├── Ajouter ............................. formation-ajouter.php
│   ├── Ajouter à partir d'un programme ..... formation-ajouter-program-beta.php
│   ├── Filtrer ............................. formation-filtre.php
│   ├── Réglages Automatisation ............. automation-settings.php
│   ├── Circuits d'automatisation ........... automation-circuits.php
│   └── [fiche session] ..................... formation-summary.php (+ onglets)
│
├── Bibliothèque
│   ├── Créer ............................... create-library.php
│   ├── Générer par IA ...................... (sous-entrée IA biblio)
│   ├── Programmes .......................... programs.php
│   ├── Templates des modules ............... modules-templates.php
│   ├── Catalogue (Public) .................. catalogue-settings.php
│   └── Paiements en ligne .................. online-payments.php
│
├── Formulaires
│   ├── Evaluation .......................... evaluation.php
│   ├── Satisfaction & Qualité .............. satisfaction.php
│   └── Questionnaires pour Lead ............ lead-questionnaires.php
│
├── e-Learning & SCORM
│   ├── Créer Un Cours ...................... elearning-activation.php
│   ├── Mes Cours E-Learning ................ (espace cours natif)
│   └── Moodle .............................. elearning-lms-scorm.php
│
├── Documents
│   ├── Politiques .......................... policies.php
│   ├── Pour Les Clients .................... documents-clients-templates.php
│   ├── Pour Les Formateurs ................. documents-formateurs-templates.php
│   ├── Pour Les Apprenants ................. documents-apprenants-templates.php
│   ├── Factures & Devis .................... documents-invoices-templates.php
│   ├── Certification ....................... documents-certification-templates.php
│   └── Entête et autre ..................... documents-header-andother-templates.php
│
├── Emails
│   ├── Communs ............................. emails-common-templates.php
│   ├── Pour Les Clients .................... emails-clients-templates.php
│   ├── Pour Les Formateurs ................. emails-formateurs-templates.php
│   ├── Pour Les Apprenants ................. emails-apprenants-templates.php
│   ├── Pour Les Leads ...................... emails-leads-templates.php
│   ├── Factures & Devis .................... emails-invoices-templates.php
│   ├── Évaluations ......................... emails-evaluation-templates.php
│   ├── Signature ........................... email-signature-template.php
│   ├── Réglages Email ...................... emails-settings.php
│   ├── Email Libre ......................... email-marketing-libre.php
│   └── Historique .......................... emails-history-libre.php
│
├── Suivis & Bilans
│   ├── Suivi de L'activité ................. suivi-activite.php
│   ├── Suivi des Absences .................. suivi-absences.php
│   ├── Suivi Qualité ....................... suivi-qualite-detailed.php
│   ├── Suivi des Factures .................. suivi-factures.php
│   ├── Suivi des Devis ..................... suivi-devis-choice.php
│   ├── Suivi Commercial .................... suivi-commercial.php
│   ├── Suivi Documents ..................... suivi-documents-sans-signature.php
│   ├── Suivi Documents (E-Signature) ....... suivi-documents-avec-signature.php
│   ├── Incidents Qualité ................... incidents.php
│   ├── Bilan Pédagogique et Financier ...... bpf.php
│   └── BPF + E-Learning .................... bpf-elearning.php
│
├── Passeport prévention .................... passeport-prevention.php
│
├── Compte
│   ├── Profil .............................. profile.php
│   ├── Abonnement .......................... account-subscription.php
│   ├── Admins .............................. admins.php
│   └── Lieux/Salles de Formation ........... locations.php
│
├── La Veille
│   ├── Tous Les Articles ................... veille-articles.php
│   ├── Mes Articles ........................ veille-mes-articles.php
│   └── Mes Liens de Veille ................. veille-links.php
│
├── CV-Thèque ............................... cv-theque.php
│
├── Amélioration Continue ................... amelioration.php   (ind. 32)
│
├── Affacturage
│   ├── Nouvelle Demande .................... affacturage.php
│   └── Mes Demandes ........................ affacturage-demandes.php
│
├── Formateurs & Certificateurs
│   ├── Formateurs SOS ...................... liste-des-formateurs.php
│   └── Partenaires & Certificateurs ........ liste-des-certificateurs.php
│
├── Organigramme ............................ organigramme.php
│
├── Compétences (ind. 22) ................... indicateur-22.php
│
├── Personnels - ind. 20 (CFA) .............. indicateur-20.php
│
├── Contact & Conseils
│   ├── Demander un appel ................... contact-us.php
│   ├── Démo en Viso ........................ contact-demo.php
│   ├── Support en visio .................... contact-support-team.php
│   ├── Conseiller Marketing ................ contact-marketing-team.php
│   └── Ingénieur pédagogique ............... contact-pedago-team.php
│
├── Programme de Parrainage ................. referral-program.php
│
├── Achat/Vente d'un organisme .............. buyandsell.php
│
├── Formations sur étagère .................. formation-sur-etagere.php
│
└── Déconnexion
```

## Vue condensée (catégories seules)

1. Tableau de Bord  
2. Intelligence Artificielle (7)  
3. CRM Leads (2)  
4. Clients & Financeurs (10)  
5. Formateurs (3)  
6. Formations (5 + fiche session)  
7. Bibliothèque (6)  
8. Formulaires (3)  
9. e-Learning & SCORM (3)  
10. Documents (7)  
11. Emails (11)  
12. Suivis & Bilans (11)  
13. Passeport prévention  
14. Compte (4)  
15. La Veille (3)  
16. CV-Thèque  
17. Amélioration Continue  
18. Affacturage (2)  
19. Formateurs & Certificateurs (2)  
20. Organigramme  
21. Compétences ind. 22  
22. Personnels ind. 20  
23. Contact & Conseils (5)  
24. Programme de Parrainage  
25. Achat/Vente d'un organisme  
26. Formations sur étagère  

Base URL : `https://app3.visioformation.fr/`

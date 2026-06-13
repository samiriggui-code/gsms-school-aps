# LMS Monorepo - Reference Roadmap

Ce document est la reference de pilotage du projet pour eviter toute perte de contexte.

## 1) Vision et scope

- Monorepo single-tenant pour une ecole (pas de multi-tenant actif).
- App unique:
  - `apps/lms-crm` (landing publique, CRM, documentation, futurs espaces candidat/LMS)
- Shared packages:
  - `packages/database` (Prisma schema + seed + client)
  - `packages/auth` (config auth partagee)
  - `packages/api-core`, `redis`, `storage`, `workers`

## 2) Technologies utilisees

- Runtime/outillage:
  - `Node.js` + `pnpm` workspaces
- Frontend:
  - `Next.js 16` (App Router)
  - `React 19`
  - `TypeScript`
  - `Tailwind CSS v4`
  - UI basee sur composants style Radix/shadcn (selon les demos Metronic)
- Backend:
  - API Routes + Server Actions Next.js
  - `NextAuth` pour l'authentification
- Data:
  - `Prisma ORM`
  - `PostgreSQL` (DB unique `lms_app`)
- Documentation:
  - Fichiers MDX dans `apps/lms-crm/content/docs` (navigation `docs.json`, rendu `/docs`)
  - Ancien contenu TurboStack/Mintlify archive dans `content/docs/_archive/`

### Briques techniques complementaires (prevues / optionnelles)

- Paiement et monetisation:
  - `Stripe` (prevu pour paiements/modules, non bloqueur pour la base LMS actuelle)
- Realtime et notifications:
  - `Pusher` (optionnel pour events temps reel: notifications, presence, updates UI live)
- Traitements asynchrones:
  - Workers/jobs (emails, relances, recalculs, synchronisations, taches longues)
  - Queue backend a formaliser (Redis/BullMQ ou equivalent) selon besoins de charge
- Stockage media open-source:
  - S3 compatible / `MinIO` (priorite self-host possible), avec fallback local en dev
- Video et contenu:
  - lecteur HTML5 natif ou `video.js` (open source)
- IA (optionnelle plus tard):
  - assistant pedagogique via provider configurable (ex: API standard ou local type Ollama)

## 3) Ce qui a deja ete fait

### Architecture monorepo

- Workspace pnpm racine (`apps/*`, `packages/*`).
- **App unique** `apps/lms-crm` — port dev **3001** :
  - landing publique `(site)/`
  - CRM `(protected)/`
  - espaces candidat / formateur / e-formation
  - documentation `/docs`

### Base de donnees unique

- Choix valide: une seule DB PostgreSQL `lms_app` pour LMS + CRM.
- Schema Prisma unique centralise dans `packages/database/prisma/schema.prisma`.
- Seed unique centralise dans `packages/database/prisma/seed.js`.
- Scripts DB racine disponibles:
  - `pnpm db:generate`
  - `pnpm db:push`
  - `pnpm db:seed`

### Authentification et securite de base

- Logique NextAuth centralisee dans `packages/auth`.
- App unique `lms-crm` raccordee a la logique partagee.
- Signup public desactive dans le backoffice CRM (acquisition via landing).
- Pages `2fa` et `lockscreen` dans l'app unique.
- Comptes de dev seeds:
  - `superadmin@lms.local`
  - `admin@ecole.local`
  - `user.crm@ecole.local`
  - `formateur@ecole.local`
  - `candidat@ecole.local`
  - mot de passe: `demo123`

### Nettoyage demo/legacy

- Suppression des parties reCAPTCHA/Google auth sur app + crm.
- Consolidation progressive pour sortir du modele GSMS multi-tenant.

## 4) Roadmap reste a faire

## Phase A - Stabilisation execution monorepo (priorite immediate)

- [ ] Verifier que toutes les apps bootent via scripts workspace.
- [ ] Verifier imports/alias partages (`@repo/auth`, `@repo/database`).
- [ ] Ajouter un check type/lint au niveau racine (scripts harmonises).
- [ ] Ajouter un guide runbook local (DB reset, push, seed, dev).

## Phase B - Auth flow produit final

- [ ] Landing comme point d entree unique.
- [ ] Redirection post-login directe par role (sans page intermediaire):
  - admin_ecole/superadmin -> app ou crm selon contexte
  - crm_user -> crm
  - formateur/candidat -> app
- [ ] Gestion first-time auth par app (verification initiale), puis switch fluide.
- [ ] Switch inter-app pour admins (header/user menu).

## Phase C - RBAC et controle d acces

- [ ] Formaliser matrice Role -> Permissions -> App access.
- [ ] Middleware d acces par app + guard de routes sensibles.
- [ ] Strategie d erreurs d acces claire (403 + UX propre).

## Phase D - Hardening securite

- [ ] Rate limiting signin/reset-password.
- [ ] Journalisation audit des tentatives (IP, user, action, resultat).
- [ ] Finaliser lockscreen (verif credential/session reelle).
- [ ] Politique de reset password plus robuste (token, expiration, traces).

## Phase E - Landing signup special

- [ ] Finaliser formulaire candidat sur la landing (`app/(site)/`).
- [ ] Pipeline de qualification (prospect/candidat) vers DB.
- [ ] Workflow "validation dossier/paiement -> activation acces LMS".

## Phase F - Docs et exploitation

- [ ] Documenter conventions techniques (naming, routes, prisma, seeds).
- [ ] Documenter procedure de release locale/preprod/prod.
- [ ] Documenter incidents frequents + solutions.

## Phase G - LMS learning stack (inspiree du plan Udemy open-source)

- [ ] Definir/etendre modele LMS (`course`, `module`, `lesson`, `progress`, `exam`, `enrollment`).
- [ ] Mettre en place authoring admin complet (cours/modules/lecons/examens).
- [ ] Construire experience apprenant (catalogue, detail cours, lecteur, progression).
- [ ] Implementer controle d'acces local (`FREE`/`PRO`/`ULTRA`) sans dependance SaaS obligatoire.
- [ ] Brancher paiement Stripe quand la monetisation est activee.
- [ ] Ajouter realtime (Pusher) la ou l'UX/metier le justifie.
- [ ] Industrialiser workers pour traitements asynchrones critiques.

## 5) Decisions actees (a ne pas casser)

- NextAuth uniquement (pas Clerk).
- Single-tenant actif.
- Une seule DB `lms_app`.
- Signup ferme dans app et crm.
- Landing = acquisition/public.
- Docs interne (pas exposee candidats).
- Le plan LMS open-source (inspiration Udemy) est la base fonctionnelle cible.
- Stripe/Pusher/workers sont des briques activables par phase, pas imposees partout des maintenant.

## 6) Commandes utiles

- Install : `pnpm install`
- Dev (app unique) : `pnpm dev` → http://localhost:3001
- Build : `pnpm build`
- DB :
  - `pnpm db:generate`
  - `pnpm db:push`
  - `pnpm db:seed`

## 7) Convention de suivi

Pour chaque prochaine modification importante:

- Mettre a jour ce fichier (section "Ce qui a deja ete fait" et checklist phase concernee).
- Noter les nouvelles decisions "a ne pas casser".
- Si une decision change, lister clairement ancien -> nouveau choix.

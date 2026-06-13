# FORM'SSI — application unique

Site public, CRM, documentation et futurs espaces candidat/LMS : une seule app Next.js (`@lms-crm`, port **3001**).

## URLs

| Zone | URL |
|------|-----|
| Site public (landing) | `/` |
| Connexion | `/signin` |
| Espace candidat | `/mon-dossier` |
| Suivi CNAPS | `/cnaps` |
| LMS (aperçu) | `/apprendre` |
| Tableau de bord CRM | `/accueil` |
| Leads & devis | `/communication-contenu/marketing/formulaires-leads` |
| Préinscriptions | `/gestion-academique/vie-scolaire/etudiants` |
| Sessions | `/gestion-academique/vie-scolaire/sessions` |
| Utilisateurs | `/securite-configuration/acces/users` |
| Documentation | `/docs` |

## Démarrage

```bash
# Racine monorepo
pnpm install
pnpm db:push
pnpm dev
```

Variables : `apps/lms-crm/.env.local` (copier depuis `.env.example` + `DATABASE_URL`).

Comptes démo visibles sur `/signin` en développement.

## Architecture

```
apps/lms-crm/
├── app/
│   ├── (site)/       # landing publique
│   ├── (auth)/       # connexion
│   ├── mon-dossier/  # espace candidat (layout partagé cnaps, apprendre)
│   ├── (protected)/  # CRM backoffice
│   ├── docs/         # rendu MDX
│   └── api/          # routes publiques + sections CRM
├── content/docs/     # fichiers MDX (ex apps/lms-docs)
└── components/       # UI partagée landing + CRM
```

Packages partagés : `packages/database`, `auth`, `api-core`, `redis`, `storage`, `workers`.

## Documentation (`/docs`)

- Contenu : `content/docs/*.mdx` — guide métier FORM'SSI (FR + EN).
- Navigation : `content/docs/docs.json` (héritage format Mintlify, rendu custom).
- Rendu : `app/docs/` + `react-markdown` (composants Mintlify convertis à la volée).
- Archives template TurboStack : `content/docs/_archive/` (hors navigation).

Pour ajouter une page : créer le `.mdx`, l'ajouter dans `docs.json`, liens internes en `/docs/...`.

## Monorepo

| Chemin | Rôle |
|--------|------|
| **`apps/lms-crm`** | Seule app Next.js — `pnpm dev` |
| `packages/*` | Prisma, auth, logique métier, workers |

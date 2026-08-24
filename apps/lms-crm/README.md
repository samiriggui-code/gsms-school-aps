# FORM'SSI — application

Site public, CRM, portails et documentation dans une seule application Next.js.

## Accès (chemins relatifs)

| Zone | Chemin |
|------|--------|
| Site public | `/` |
| Connexion | `/signin` |
| CRM | `/accueil` |
| Documentation | `/docs` |
| Espace candidat | `/mon-dossier` |

## Démarrage local

Depuis la racine du monorepo :

```bash
pnpm install
pnpm db:push
pnpm dev
```

Copier `apps/lms-crm/.env.example` vers `.env.local` et renseigner les variables requises.

## Auth — filet `proxy.ts` (Next.js 16)

Next.js 16 utilise **`proxy.ts`** (plus `middleware.ts`). Le fichier coupe court si aucune session NextAuth n’est présente :

- pages CRM / portails → redirect `/signin`
- API métier → `401` JSON

Exceptions volontaires : `/api/auth`, catalogue, préinscription, contact, devis public, `/api/public/*`, `/api/internal/*` (auth propre), `/export/official/[token]`.

Les helpers serveur (`requireCrmApiAuth`, portal, formateur…) restent obligatoires pour rôles et permissions.

## Documentation intégrée (`/docs`)

- Contenu : `content/docs/` (fichiers MDX, FR + EN)
- Navigation : `content/docs/docs.json`
- Pages orientées **procédures métier** (candidatures, catalogue, sessions)

Pour ajouter une page : créer le `.mdx`, l’inscrire dans `docs.json`.

## Packages partagés

`packages/database`, `auth`, `api-core`, `redis`, `storage`, `workers` — voir la racine du monorepo.

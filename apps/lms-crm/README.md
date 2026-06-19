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

## Documentation intégrée (`/docs`)

- Contenu : `content/docs/` (fichiers MDX, FR + EN)
- Navigation : `content/docs/docs.json`
- Pages orientées **procédures métier** (candidatures, catalogue, sessions)

Pour ajouter une page : créer le `.mdx`, l’inscrire dans `docs.json`.

## Packages partagés

`packages/database`, `auth`, `api-core`, `redis`, `storage`, `workers` — voir la racine du monorepo.

# FORM'SSI — plateforme école

Application web pour la gestion d’un centre de formation : site public, CRM métier, espaces candidat et formateur, documentation intégrée.

## Fonctionnalités

- Site vitrine et préinscriptions
- CRM (candidatures, sessions, planning, examens, certifications)
- Catalogue formations synchronisé avec le site public
- Documentation utilisateur accessible depuis l’application (`/docs`)

## Prérequis

- Node.js 20+
- pnpm 9+
- PostgreSQL

## Installation (développement)

```bash
pnpm install
cp apps/lms-crm/.env.example apps/lms-crm/.env.local
# Renseigner DATABASE_URL et les secrets dans .env.local
pnpm db:push
pnpm db:seed   # optionnel — données de démo
pnpm dev
```

L’application est disponible sur le port configuré dans votre environnement (voir `.env.example`).

## Structure du dépôt

| Dossier | Description |
|---------|-------------|
| `apps/lms-crm` | Application Next.js (site + CRM + docs) |
| `packages/` | Bibliothèques partagées (base de données, auth, API, stockage) |
| `deploy/` | Scripts de déploiement (configuration locale requise) |

## Documentation

- **Guide métier** : `/docs` une fois l’application lancée
- **Déploiement** : voir `deploy/README.md` (sans secrets — configurer les fichiers locaux hors Git)

## Licence

Usage privé — tous droits réservés.

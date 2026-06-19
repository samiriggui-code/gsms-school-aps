# @repo/storage

Stockage fichiers unifié pour tout le monorepo LMS (avatars, PDF, pièces jointes, logos).

## Modes

| Mode | Quand | URLs |
|------|-------|------|
| **local** | `STORAGE_*` absent ou placeholder (`your_*`) — dev uniquement | `/uploads/...` → `public/uploads/` |
| **remote** | MinIO, DO Spaces, AWS S3 | `STORAGE_CDN_URL` ou `/api/public/storage/...` |

## Dev rapide (sans Docker)

Ne pas définir `STORAGE_*` dans `apps/lms-crm/.env.local` → uploads locaux persistants dans `public/uploads/`.

## MinIO Docker

```bash
docker compose -f docker-compose.storage.yml up -d
```

Copier les variables `STORAGE_*` depuis `apps/lms-crm/.env.example` dans `.env.local`, redémarrer `pnpm dev`.

Console MinIO : http://localhost:9001 — `minioadmin` / `minioadmin`

## API

- `uploadFile({ file, module, entityType, ... })` — chemins structurés métier
- `uploadFileToDirectory(file, 'company/avatars')` — compat logos CRM
- `ensureStorageSocle()` — crée les préfixes principaux (`.keep`) sur MinIO/S3 ou local
- `ensureEntityStoragePrefix('rh/equipes/{teamId}')` — sous-dossier à la création d'une entité
- `getStoredFile(key)` — proxy `/api/public/storage` et `/uploads`
- `deleteFileByKey(key)` / `resolveKeyFromUrl(url)`

### Socle (préfixes principaux)

Voir `STORAGE_SOCLE_PREFIXES` dans `src/storage-socle.ts` — initialisé au deploy (`deploy/gsms/scripts/init-storage-socle.sh`) et via Gouvernance → Storage conformité.

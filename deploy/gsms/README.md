# Deploy VPS — app unique `apps/lms-crm`

Une seule image Docker `gsms-app` (site + CRM + docs). **Pas** de landing/docs séparés.

```powershell
pnpm build
.\scripts\redeploy-vps.ps1
```

Sur le VPS : conteneurs `gsms-app` + `gsms-worker` + infra (postgres, redis, minio).

# Module: finance

Sous-domaines API :

- `budget` — lignes budgétaires (+ sync EQUIPEMENT depuis inventaire `metadata.acquisitionCost`)
- `devis` — `FinanceDevis` (cycle commercial)
- `factures` — même modèle `FinanceDevis` filtré `status: ACCEPTED`
- `paiements` — `FinancePayment` (+ sync budget `actualAmount` à réception)
- `rapports` — export CSV
- `stats` — KPIs via `@repo/api-core` `StatService.getFinanceStats`
- `operations` — flux récent devis / factures / paiements (hub)
- `alerts` — devis expirés, factures impayées, paiements en attente

Auto-devis landing : variable d’environnement `CRM_FINANCE_AUTO_DEVIS_FROM_LEAD=1` sur `POST /api/quote-requests`.

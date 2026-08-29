# {{OPCO_NAME}} — fiche connecteur

| Champ | Valeur |
|-------|--------|
| `adapter` | `{{ADAPTER}}` |
| `verification` | UNVERIFIED |
| `default_mode` | MANUAL_PORTAL |
| `api_available` | **false** (jusqu’à preuve) |

## Checklist technique

- [ ] API / Web service ?
- [ ] Documentation développeur (URL) ?
- [ ] Portail entreprise ?
- [ ] Portail organisme de formation ?
- [ ] Dépôt de dossier ?
- [ ] Dépôt de facture ?
- [ ] Documents acceptés ?
- [ ] Statuts officiels ?
- [ ] Webhooks ?
- [ ] SFTP ?
- [ ] EDI ?
- [ ] Authentification ?
- [ ] Sandbox ?

## Sources (à coller)

| source_id | url | notes |
|-----------|-----|-------|
| | | |

## Capabilities (brouillon)

```json
{
  "application_api": false,
  "status_api": false,
  "invoice_api": false,
  "manual_portal": true
}
```

## Qualiopi / Evidence

Via `FundingCase` → Evidence Engine uniquement.

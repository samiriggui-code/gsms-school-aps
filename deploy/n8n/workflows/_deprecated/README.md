# Workflows n8n — archivés (ne pas importer)

Ces fichiers ne sont **plus déployés**. Le script `deploy-gsms-folder.py` les **supprime** de l’instance n8n s’ils existent encore.

| Fichier | Raison |
|---------|--------|
| `gsms-01-hub-evenements.json` | Hub legacy `/webhook/gsms-events` — remplacé par webhook standard |
| `gsms-04-devis-landing-manuel.json` | Doc / gap — l’app émet déjà `landing.quote.requested` |
| `gsms-05-parcours-candidat.json` | Doc référence uniquement — pas une automatisation |

**Pack opérationnel (3 workflows)** : `gsms-00`, `gsms-02`, `gsms-03` à la racine de `workflows/`.

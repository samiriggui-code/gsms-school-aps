# Mapping Evidence ↔ Qualiopi (brouillon)

Source : Guide de lecture RNQ V9 (`QUALIOPI_GUIDE_LECTURE_V9_2024_01`).

| evidence_type (GSMS) | Indicateurs typiques (à valider au fil du guide) | Notes |
|----------------------|--------------------------------------------------|-------|
| `needs_analysis` / `positioning` | entrée parcours / analyse besoin | Preuves session / learner |
| `signed_contract` / `convention` | contractualisation | |
| `convocation_sent` / `pretraining_info` | information préalable | |
| `attendance_signature` | réalisation / assiduité | Aussi justificatif financeur |
| `assessment_result` / `exam_result` | évaluation / certification | Indicateurs spécifiques si certifiant |
| `survey_response` | satisfaction / amélioration | |
| `funding_agreement` | engagements financeur | Via FundingCase |
| `funding_invoice` / `funding_payment` | traçabilité financière | |
| `service_completion` | réalisation / DSF | EDOF guide entrée→DSF |
| `watch_record` | veilles | Org workflows |
| `accessibility_adaptation` | handicap / adaptation | Agefiph + WF-04 |

**Règle :** une preuve peut couvrir plusieurs indicateurs (`EvidenceIndicatorLink`).  
Ne jamais hardcoder l’indicateur dans n8n.

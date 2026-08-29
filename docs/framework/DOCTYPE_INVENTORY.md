# DOCTYPE_INVENTORY.md

> Audit §65 · 2026-08-29 · Runtime actuel = `EntityDefinition` (pas encore DocType V2)

| name | Module actuel | Table Prisma | Controller | Fields (#) | Child | Perms (slugs) | Workflow | API | Frontend | Events/hooks | Dependencies |
|------|---------------|--------------|------------|------------|-------|---------------|----------|-----|----------|--------------|--------------|
| `user` | iam (déclaré dans registry core) | `user` | hooks: none | ~12 | — | IAM users* | — | `/api/entities/user` + sections users (list) | framework-lab, Accès users | — | role Link |
| `role` | iam | `userRole` | none | ~7 | — | IAM roles* | — | entities + sections roles list | framework-lab, Accès roles | softDelete | SCHOOL_IAM_ROLE_SLUGS filter |
| `course` | **lms** | `course` | beforeCreate sets createdById | ~8 | — | LMS course/content | — | entities only | lab | — | user Link |
| `lesson` | **lms** | `chapter` | none | ~8 | — | LMS | — | entities | lab | — | course Link (model mismatch name) |
| `enrollment` | **lms** | `enrollment` | none | ~7 | — | LMS | — | entities | lab | — | user, course |
| `leaveRequest` | rh / ressources | `rhAbsence` | none | ~8 | — | ressources* | — | entities | lab (UI RH absences = autre?) | — | user |
| `complianceDossierItem` | **qualiopi/of** | `complianceDossierItem` | beforeUpdate+afterUpdate (events+aggregate) | ~10 + virtuels | — | ressources* (après fix) | — | entities **+** sections/qualiopi/items | Classeur Qualiopi | ComplianceItemEvent | **registry ← lib/of** |

## Manquants (cible V2 domaines CRM→…→LMS)

Lead, Contact, Company, Learner, TrainingRequest, NeedsAnalysis, Positioning, Program, Session, Enrollment(OF), Trainer, Room, ScheduleSlot, Attendance*, Assessment, Funding*, Document*, Survey*, Complaint, Finding, Evidence*, QualiopiCriterion/Indicator, Audit*, Quote/Invoice/Payment, Course/Lesson (après socle)…

## Flags absents sur toutes les lignes

`is_child` · `is_single` · `is_virtual` · `is_submittable` · `naming` · `workflow` · `module` metadata · `schema_version`

## Naming

Tous : ID Prisma technique. Aucun `name` métier type `SES-2026-00045`.

## Notes

- `lesson` → prisma `chapter` : naming DocType ≠ table (acceptable si documenté ; aujourd’hui opaque).  
- Qualiopi item = seul DocType « OF » réel ; mal placé (import domaine dans core).

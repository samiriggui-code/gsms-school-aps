# LMS_DRIFT.md

> Audit §67 · 2026-08-29

## Findings

| ID | Sévérité | Finding |
|----|----------|---------|
| L1 | **P0** | Registry core contient `course`, `lesson`, `enrollment` **avant** tout DocType CRM/Training OF (Session, Learner…). Inverse l’ordre V2 §44. |
| L2 | **P0** | Lab UI (`framework-lab`) liste surtout user/role/course/lesson/enrollment/leave — **pilote mental** du framework = LMS+IAM, pas OF. |
| L3 | P1 | `lesson` mappe Prisma `chapter` — vocabulaire LMS Learning, pas Session OF. |
| L4 | P1 | Permissions `LMS_PERMISSION.*` dans le noyau registry — OK si client, mais renforce le biais. |
| L5 | OK | Pas d’import `framework → app/lms` pages détecté. |
| L6 | **P0** | Skill V2 : *aucune nouvelle feature LMS avant réparation socle* — à appliquer dès maintenant. |
| L7 | P2 | Confusion sémantique possible : `enrollment` LMS ≠ `Enrollment` OF (inscription session). Risque de réutiliser le mauvais DocType. |

## Règle correcte

```text
domains/lms/*  →  importe framework
framework/*    →  n’importe jamais lms
```

Les DocTypes Course/Lesson restent **clients** déclarés **après** CRM/Training/Funding (Phase 18).

## Action

- Freeze features LMS liées framework.  
- Ne plus ajouter d’entités LMS dans `registry.ts` jusqu’à Phase 18.  
- Renommer conceptuellement dans la doc : `LmsCourse` / `LmsEnrollment` pour éviter collision avec OF Enrollment.

## ✅ Gel levé (29/08/2026, Claude + Cursor)

- **L1 résolu** : `registerLmsDocTypes` déplacé en dernier dans `bootstrap.ts` (commit `ae14261`), après CRM/Training/Documents/Quality/RH/Qualiopi/Funding/Evidence/Audit — ordre §44 respecté.
- **L2 atténué** : `framework-lab` réordonné, domaines OF avant Lms*.
- **L3 résolu (K8)** : DocType canonique `LmsChapter` → Prisma `Chapter` ; aliases `LmsLesson` / `lmsChapter` / `lesson` pour compat.
- **L7 résolu** : alias DocType `enrollment` nu retiré, seul `lmsEnrollment` reste — plus de collision possible avec `FormationSessionParticipant` (OF).
- **L5** : toujours OK, inchangé.

Vérifié indépendamment par Claude : ordre bootstrap confirmé (grep), alias `lmsEnrollment` confirmé (aucun alias `enrollment` nu résiduel), `test:doctype` 9/9. **Phase 18 / G12 LMS peut démarrer**, règle à respecter : `domains/lms/*` importe le framework, jamais l’inverse.

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

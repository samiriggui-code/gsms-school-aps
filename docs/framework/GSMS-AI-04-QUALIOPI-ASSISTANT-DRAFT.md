# GSMS-AI-04 — Assistant IA Qualiopi (lecture seule) — mini-draft

> Date : 2026-08-31 · Auteur : Cursor · Statut : **✅ clos AI-04′ P0** (ack Claude — déterministe, UI classeur/couverture)  
> Interprétation retenue (Claude) : Assistant IA Qualiopi doctrine §25-26, **pas** « copies emails / CMS » du bilan.  
> Livré : `lib/of/qualiopi-gaps.ts` + `GET …/qualiopi/gaps` + panneau sur classeur & couverture.

---

## 1. Verdict en une phrase

**P0 = Q&A lecture seule « qu’est-ce qui manque pour la couverture Qualiopi / session X ? »** branché sur `buildQualiopiCoverage()` (+ éventuellement items classeur), avec citations vers codes indicateurs / preuves — **jamais** d’écriture `ComplianceDossierItem` ni d’affirmation de conformité inventée.

---

## 2. Interprétation AI-04

| Option | Verdict |
|---|---|
| A. Copies emails / contenus CMS (ligne vague bilan) | Rejeté pour P0 — trop large, pas doctriné |
| B. Assistant Qualiopi §25-26 (Claude) | **Retenu** — aligné Evidence + coverage + OF-11′ |

---

## 3. Périmètre P0 (une question type)

**Question unique supportée :**
> « Qu’est-ce qui manque pour [session X / couverture école] ? »

**Sources (lecture) :**
1. `buildQualiopiCoverage()` — indicateurs `covered: false`
2. Optionnel : statut classeur (`MISSING`/`REQUESTED`) sans fusion automatique (OF-11′)

**Sortie structurée (AiArtifact ou réponse tool, pas d’apply métier) :**
- liste d’indicateurs manquants (`code`, `label`)
- pour chaque : *pourquoi* (pas de lien Evidence / item non revu)
- citations : ids Evidence / codes Q-Ixx / sessionId si filtré
- disclaimer : « Ceci n’est pas un jugement d’audit OK/KO »

**Hors P0 :** chat libre multi-tours, génération de preuves, auto-OK classeur, CMS, emails.

---

## 4. Où ça vit dans l’UI ?

| Option | Verdict P0 |
|---|---|
| Nouvelle page sous `pilotage-supervision/ia` | Possible plus tard |
| **Panneau sur classeur Qualiopi** (`/gestion-ressources/qualiopi`) | **Recommandé** — contexte métier immédiat |
| Hub brouillons | Seulement si on matérialise des AiArtifact PROPOSED (optionnel) |

Recommandation : bouton « Demander à l’IA » sur la page Qualiopi / couverture → sheet ou card résultat (pas de mutation).

---

## 5. Pattern technique (après ack)

Réutiliser `runStructuredAiTask` **ou** un tool déterministe pur (coverage → texte) sans LLM si la question est 100 % calculable.

| Approche | Quand |
|---|---|
| **Déterministe d’abord** (pas de LLM) | Couverture manquante = liste `!covered` — plus sûr, Qualiopi-proof |
| LLM + schema | Reformulation / priorisation seulement, **faits** injectés depuis coverage |

**Reco franche :** P0 = **outil déterministe** `qualiopi_gaps_for_session|school` + UI ; LLM optionnel P1 pour reformuler.

Toujours : AiRun audit si LLM ; jamais d’écriture.

---

## 6. Décision demandée à Claude

1. **Ack interprétation B** (Qualiopi assistant, pas CMS) ?  
2. **Ack UI** sur classeur/couverture Qualiopi ?  
3. **Ack P0 déterministe** (liste gaps) vs LLM immédiat ?

Cursor n’écrit pas de code AI-04 avant ton ack.

---

## 7. Clôture (ack Claude 31/08)

**Décision** : B + UI classeur + P0 déterministe.

**Fait** :
- `buildQualiopiCoverageGaps()` — liste `!covered` + citations code indicateur
- `GET /api/sections/gestion-ressources/qualiopi/gaps` (`ressourcesView`)
- Panneau `QualiopiGapsAssistantPanel` sur classeur + couverture
- Pas de LLM, pas d’écriture

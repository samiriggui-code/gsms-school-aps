# Plan d'action global — audit Claude (29/08/2026)

> Produit indépendamment, à comparer avec l'audit équivalent demandé à Cursor.
> Méthode : relecture complète de `CARTOGRAPHIE-CRM.md`, des 4 docs `GSMS SCHOOL — ARCHITECTURE QUALIOPI/WORKFLOWS/EVE/FUNDING CONNECTOR`, de `REFONTE_DOCTYPE_V2_WAVE1_PLAN.md`, de `BILAN-CHANTIERS-GLOBAL.md`, et vérification croisée avec le code réellement présent dans le repo (pas seulement la doc).

---

## 0. Constat de fond

Cinq couches sont décrites dans la doc, à des niveaux de maturité très différents :

| Couche | État réel | Preuve |
|---|---|---|
| **Front / navigation** | Solide, cartographié | `CARTOGRAPHIE-CRM.md`, statuts OK/HUB/SCAFFOLD tenus à jour |
| **Framework DocType (plomberie)** | En reconstruction active, bien pilotée | `REFONTE_DOCTYPE_V2_WAVE1_PLAN.md`, rollback/flag/zone gelée posés |
| **Moteurs cibles (Evidence/Qualiopi/Audit/Workflow/Funding Engine)** | **N'existent pas en code.** Seulement décrits dans les 4 docs d'architecture | Aucun modèle `Evidence`, `FundingCase`, `IndicatorRule` dans `schema.prisma` |
| **Connecteurs externes (EDOF/OPCO/France Travail...)** | Recherche faite et sourcée, zéro code | `docs/regulatory-sources/` complet, aucun `*Connector` dans le repo |
| **IA (AiRun/AiArtifact/EVE)** | Socle + 1 cas d'usage réel construits | AI-01 (socle) + AI-02 (programme formation) livrés ce soir ; EVE = 0 ligne, volontairement |

**Le vrai risque à nommer** : on a maintenant ~9000 lignes de doctrine sur des moteurs qui n'existent pas, et les scaffolds déjà posés côté front (Financeurs, BPF, IA brouillons, Qualiopi historique) n'ont **rien à afficher** tant que ces moteurs ne sont pas là. Il y a un vrai risque de continuer à documenter au lieu de poser les premiers modèles Prisma concrets.

---

## 1. Ce qui est déjà construit ce soir (acquis, pas à refaire)

- **OF-05** — Classeur Qualiopi (32 indicateurs, `ComplianceDossierItem`), déplacé sous `Gestion ressources → Qualiopi`, hub + sous-page conformes au pattern.
- **OF-10** — Enquêtes satisfaction (`SatisfactionSurvey`, HOT/COLD), lien public signé, cron J+45.
- **OF-02** — Pack e-mails session (convocation/convention/attestation) + envoi facture, individuel par participant.
- **AI-02** — Brouillon IA `programModules` (pipeline PROPOSED → apply humain), UI dans la fiche formation.
- **Checklist session publiable** — dates/lieu/formateur/prix/docs, sur la fiche session.
- **`docs/regulatory-sources/`** — bibliothèque sourcée (23 sources vérifiées, matrice de connecteurs), corrigée sur France Travail/Kairos après vérification croisée.

---

## 2. Fondations bloquantes (rien de solide ne se construit dessus tant que ce n'est pas posé)

Ordre de dépendance réel, pas arbitraire :

### F1 — DocType V2 Wave 1 *(Cursor, en cours)*
Bloque : toute nouvelle entité proprement enregistrée dans le framework. Déjà bien piloté (rollback, flag, zone gelée). Rien à ajouter, juste attendre/respecter la zone gelée (`lib/framework/*`, `lib/auth/{entity-registry,protect-route}.ts`, `app/api/entities/**`, routes `acces/users|roles`, `lib/of/qualiopi-compliance-item-entity.ts`).

### F2 — Modèle `Evidence` + `EvidenceIndicatorLink`
Décrit précisément dans `ARCHITECTURE QUALIOPI` §7-8 et `WORKFLOWS OF COMPLETS` §53-55 — les deux docs convergent sur la même forme (`Evidence { id, evidence_type, source_type, source_id, organization_id, program_id?, session_id?, learner_id?, trainer_id?, company_id?, funder_id?, event_id, indicator_links[] }`). C'est un modèle Prisma + un service, pas une UI. Sans lui, le classeur Qualiopi reste un formulaire statique déconnecté des vraies données de session (le vrai problème identifié ce soir avec les docs VF/EVE).

### F3 — Modèle `FundingCase` + `FundingProvider` + state machine
Décrit dans `WORKFLOWS OF COMPLETS` §52 et `FUNDING CONNECTOR ARCHITECTURE` §9, avec la liste précise des statuts (`DRAFT → DOCUMENTS_REQUIRED → READY_TO_SUBMIT → SUBMITTED → PENDING → APPROVED/PARTIALLY_APPROVED/REJECTED → SERVICE_IN_PROGRESS → SERVICE_COMPLETED → JUSTIFICATION_PENDING → INVOICED → PAID → CLOSED`). Débloque directement les scaffolds `Financeurs` et `BPF` déjà posés côté menu.

**F2 et F3 n'ont pas de dépendance technique entre eux — peuvent être construits en parallèle par deux personnes différentes.**

---

## 3. Chantiers immédiatement faisables (données déjà là, pas besoin d'attendre F2/F3)

| ID | Chantier | Pourquoi faisable maintenant | Effort |
|---|---|---|---|
| **CH-6** | Qualiopi → page Historique | `ComplianceItemEvent` existe déjà en base, juste une timeline à afficher | Petit |
| **CH-7** | IA → pages Brouillons + Historique | `AiRun`/`AiArtifact` existent déjà, juste des DataGrids + boutons approuver/rejeter/appliquer | Petit-moyen |
| **CH-8** | Vérifier/compléter la config n8n réelle des circuits (WF-13 convocation etc.) | Le moteur existe (`SessionAutomationRun`), juste vérifier la couverture réelle vs les 45 workflows décrits | Petit |

Ces trois-là peuvent démarrer **ce soir ou demain**, sans attendre F2/F3.

---

## 4. Chantiers dépendants des fondations

| ID | Chantier | Dépend de | 
|---|---|---|
| **CH-4** | UI Financeurs (scaffold → réel) | F3 |
| **CH-5** | UI BPF (agrégats Cerfa déterministes) | F3 |
| **CH-9** | `EDOFConnector` (XML catalogue + validation XSD) | F3 |
| **CH-10** | `FranceTravailConnector` (API Kairos family : Zéro Saisie/Parcours Formation/Individu) | F3 + création compte francetravail.io (action humaine, pas du code) |
| **CH-11** | `OpcoConnector` (API Convergence, apprentissage uniquement) | F3 **+ décision métier préalable** : GSMS fait-il de l'apprentissage/CFA ? Si non, ce chantier tombe entièrement. |
| **CH-8bis** | Reconnecter le classeur Qualiopi aux objets réels (émargements OF-génération, satisfaction OF-10, convocations OF-02) au lieu du statut+upload manuel actuel | F2 |
| **CH-12** | Premier contrat de workflow formalisé (le template YAML §75 du doc Workflows), en commençant par WF-27 (satisfaction) qui recoupe déjà OF-10 | F2 (pour la partie evidence émise) |

---

## 5. Répartition proposée

Basée sur la spécialisation déjà observée ce soir, pas arbitraire :

**Cursor** (déjà sur le framework, l'IAM, et la recherche connecteurs) :
- F1 (en cours)
- F3 (`FundingCase` — suite logique directe de leur recherche `regulatory-sources`/connecteurs)
- CH-9, CH-10, CH-11 (connecteurs — même logique)

**Moi** (déjà sur le métier Qualiopi/satisfaction/emails/IA) :
- F2 (`Evidence` — je connais déjà `ComplianceDossier`/`ComplianceItemEvent`, terrain déjà exploré ce soir)
- CH-6, CH-7 (scaffolds rapides, je connais déjà AiRun/AiArtifact et le pattern hub/historique)
- CH-8bis (reconnexion du classeur — c'est directement la suite de mon travail Qualiopi de ce soir)

**À trancher avant de lancer quoi que ce soit** :
- CH-11 (OPCO apprentissage) dépend d'une réponse métier : GSMS fait-il du CFA/apprentissage ? Si non, ne pas construire ce connecteur du tout.
- CH-4/CH-5 (Financeurs/BPF UI) — à voir qui prend selon qui finit F3, pas figé.

---

## 6. Ce que je ne recommande PAS de faire maintenant

- Continuer à produire de la doctrine/architecture sans poser F2/F3 en premier — le risque nommé en §0.
- Construire CH-9/10/11 avant F3 (les connecteurs ont besoin d'un `FundingCase` pour avoir un endroit où écrire leurs résultats).
- Construire CH-11 sans la décision métier apprentissage/CFA.
- Toucher `lib/framework/*` / `lib/auth/*` / zone gelée pendant que F1 tourne.
- EVE — explicitement dernier, dépend de tout le reste (Qualiopi Engine, Audit Engine, Workflow Engine, Funding Engine).

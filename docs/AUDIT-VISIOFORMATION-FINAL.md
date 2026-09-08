# Audit VisioFormation — rapport final

**27 août 2026** · essai légitime `app3.visioformation.fr` · OF · 15 j restants · données fictives · aucun paiement / RIB / clé API · usage GSMS

> Canvas interactif (si tu arrives à l’ouvrir) :  
> `C:\Users\samir\.cursor\projects\c-laragon-www-gsms-school\canvases\visioformation-audit-final.canvas.tsx`  
> Raccourci Cursor : `Ctrl+P` → colle ce chemin → Entrée → bouton **Open Canvas** / preview.

---

## Verdict

VisioFormation gagne sur la **largeur marketing OF** (menu, templates docs/emails, Qualiopi visible, Factur-X, BPF). Sur l’essai, la couche « IA » et l’automatisation sont surtout des **studios / KB + paywall Platinum 99 € HT** — pas un co-pilote session-aware utilisable dès J1.

**Coup GSMS :** 1 génération IA réelle + 1 circuit auto + preuves Qualiopi liées aux objets métier battent 7 entrées menu décoratives.

| Zone | Note |
|------|------|
| CRM / OF essai | **B+** |
| IA en essai | **D+** |
| Auto / circuits | **C** |
| Docs & finance UI | **B** |
| Profondeur menu | **A-** |

---

## 1. Méthode & périmètre

**Fait :** navigation UI + création objets fictifs + forçage flux IA jusqu’au paywall ; headers/certs stack LAMP ; croisement rapport fonctionnel + peigne fin live.

**Hors scope :** pentest, prompt injection, scrape massif ; paiement / RIB / clé OpenAI ; Moodle provisionné / génération PDF IA forcée.

---

## 2. Stack technique (confirmée)

| Affirmation | Preuve | Statut |
|-------------|--------|--------|
| PHP + Apache maison | `Server: Apache` · URLs `.php` · pas de `X-Powered-By` | OK |
| Pas WordPress / pas SPA | `wp-json` 404 · 0 React/Vue/`_next` · FA 4.7 + jQuery | OK |
| Multi-hosts app1–5 | Sharding tenants · app3 = instance essai | OK |
| Support Board 3.6.8 | `supportboard/js/main.js` · `version = '3.6.8'` | OK |
| SSL Let’s Encrypt ~90 j | Cert www · issuer YR2 | OK |
| Hetzner (pas OVH) | Infra IP / reverse DNS | Nuancé |

---

## 3. Cartographie produit

- **96** liens menu uniques · **25+** sections sidebar · **7** entrées menu IA · **99 €** Platinum HT / mois

Sidebar : Dashboard · IA · CRM Leads · Clients & Financeurs · Formateurs · Formations · Bibliothèque · Formulaires · e-Learning & SCORM · Documents · Emails · Suivis & Bilans · Passeport prévention · Compte · Veille · CV-Thèque · Amélioration continue · Affacturage · Certificateurs · Organigramme · Compétences · Personnels CFA · Contact · Parrainage · Achat/Vente OF · Formations étagère

---

## 4. Campagne writes (données fictives)

| Objet | Résultat | ID / preuve |
|-------|----------|-------------|
| Lead Marie Martin | Créé | Tunnel CRM (+ Jean Dupont préexistant) |
| Apprenant Paul Durand | Créé + rattaché | id **1263** → session **#214** |
| Entreprise ACME Formation Test SAS | Créé | entreprises-toutes.php |
| Formateur Sophie Bernard | Créé | select id **254** · pas encore lié session |
| Financeur OPCO Test Audit GSMS | Créé | financeurs-tous.php |
| Programme biblio Gestion du temps | Créé | programs.php · 1 prog · non public |
| Session #214 | Réutilisée | 01–02/09/2026 · À distance Paris · alertes prix + programme |

---

## 5. Matrice IA (cœur du finding)

Utilisabilité réelle en essai (0–100, qualitatif) :

| Entrée | Score | Comportement | Preuve |
|--------|------:|--------------|--------|
| Lilya | 5 | Lock essai | Message période d’essai · 1M tokens affichés inutilisables |
| Programme résumé IA | 0 | → Abonnement | create-library-new-ai.php → account-subscription.php |
| Programme PDF IA | 25 | UI seule | Upload 5 Mo / 10/mois · génération non forcée |
| Évaluations IA | 0 | → Abonnement | evaluation-ai-create.php |
| Déroulé pédagogique IA | 15 | Studio OK | Programme trouvé · même pattern studio que PPT |
| PowerPoint IA | 0 | → Abonnement | support-formation-create.php → Platinum (**prouvé**) |
| E-learning IA | 10 | How-to | Landing marketing, pas générateur |
| Qualiopi IA session | 35 | KB générique | 32 ind. · tag Session #214 · pas analyse live · CTA RDV |

---

## 6. Modules clés hors IA

- **SCORM / LMS :** `elearning-lms-scorm.php` = demande Moodle (pas de player). LMS natif séparé OK sans Moodle.
- **Automatisation :** lock explicite essai. Circuits = « Planifiez une démo… ».
- **Docs & emails :** force VF — templates OF riches (convocation, certificat, DPC, VAE, assiduité, émargement, relances…).
- **Finance / BPF :** Factur-X masse (zéros). BPF A→G (zéros).

---

## 7. Forces / faiblesses VF

### Forces
- Surface OF complète au menu dès l’essai
- Templates docs/emails → time-to-value conformité
- Qualiopi visible (narratif + 32 indicateurs)
- CRM + session + référentiels : writes métier réels

### Faiblesses (essai)
- IA = paywall binaire (promesse vitrine ≠ valeur essai)
- Auto / circuits lockés
- Qualiopi ≠ session-aware (KB + tag, pas preuves objets)
- SCORM = provisioning Moodle (ambiguïté LMS natif)

---

## 8. VS GSMS — où attaquer

| Domaine | VF essai | Priorité | Action produit |
|---------|----------|----------|----------------|
| IA generative | Studios + redirect Platinum | **P0** | 1 génération réelle en essai |
| Automatisation | Lock essai + démo circuits | **P0** | 1 circuit relance email utilisable J1 |
| Qualiopi | KB + upload + RDV | **P1** | Preuves liées session / docs / émargement |
| Docs OF | Templates riches OOTB | **P1** | Parité convocation / certificat / émargement |
| Factur-X / BPF | UI + export masse | **P2** | Garder avance technique GSMS, clarifier UI OF |
| SCORM | Moodle form + LMS maison | **P2** | Clarifier SCORM natif vs Moodle |
| Stack UX | PHP/jQuery 2015–18 | Diff | Next moderne = avantage ressenti si vitesse OK |

### Recommandation stratégique GSMS

Ne pas copier les 96 liens. Gagner l’essai sur **3 preuves** :

1. IA qui produit un livrable réel  
2. Automatisation qui envoie  
3. Qualiopi qui cite des objets de la session  

Ensuite rattraper la densité templates docs/emails OF.

---

## Comparaison avec la cartographie Claude (même jour)

| | Claude | Cursor |
|---|---|---|
| Méthode | Inventaire UI exhaustif (~90 pages), sans débloquer les dépendances | Carto + **writes** fictifs + forçage IA jusqu’au paywall |
| Force | Sitemap URL-par-URL, maturité 1–5, vigilance data, intégrations (Stripe/Calendly/SMTP), Formateurs SOS PII | Preuve PPT IA → Platinum après création programme ; objets liés session #214 |
| IA déroulé / PPT | « Partiel » faute de programme (blocage cascade) | Programme créé → **paywall abonnement** (vrai mur) |
| Compteurs vides | 0 apprenant / entreprise / formateur / programme | Vrai *avant* writes ; faux après (Paul 1263, ACME, Sophie 254, OPCO, programme) |
| LMS | Moodle formulaire, contenu natif non testé | LMS maison séparé confirmé (`elearning` / vcourse) |
| Qualiopi IA | Hypothèse KB | Confirmé (générique + tag session) |

**Rapport fusionné :** garder Claude comme inventaire de référence ; garder Cursor comme preuves d’essai. Nuancer le finding Claude « blocage cascade programme » — c’est un prérequis levé en 2 min ; le mur réel est Platinum.

Canvas comparaison : `audit-compare-claude-cursor.canvas.tsx`  
(`Ctrl+P` → `audit-compare-claude`)

---

## Annexes

Canvases Cursor (dossier hors repo) :
- `visioformation-cartographie.canvas.tsx`
- `visioformation-tests-essai.canvas.tsx`
- `visioformation-peigne-fin.canvas.tsx`
- `visioformation-audit-final.canvas.tsx` ← synthèse
- `audit-compare-claude-cursor.canvas.tsx` ← vs Claude
- `lms-crm-audit.canvas.tsx` (audit interne GSMS)

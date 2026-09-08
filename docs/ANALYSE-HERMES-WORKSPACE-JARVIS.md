# Analyse — Hermes Workspace (VPS) ↔ Jarvis Core ↔ Windows Agent

**Date :** 27 août 2026  
**Instance :** [Hermes Workspace VPS](https://hermes-workspace-ppy9.srv1722028.hstgr.cloud/chat)  
**Repo Jarvis :** `C:\laragon\www\jarvis-os-linux`

---

## 1. Ce que tu as réellement (3 cerveaux, pas 1)

| Pièce | Où | Rôle aujourd’hui |
|-------|----|------------------|
| **Hermes Workspace** | VPS Hostinger (`srv1722028…/chat`) | Agent Nous autonome + UI web. Chat / tools / files / memory / jobs. **Isolé** sur le VPS → pas de navigateur PC, pas d’accès LAN maison par défaut. |
| **Jarvis Core** | NUC `192.168.1.37` (`wss://jarvis.global-it-ss.com/ws`) | **Seul cerveau** Jarvis : Policy, HA, inventaire satellites, LLM via OpenRouter. |
| **Windows Agent** | Ton PC (`deploy/windows-agent`) | **Satellite** Jarvis : inventaire apps, `app.launch`, WS vers le Core. **Pas** un client Hermes. |

### Point critique (décision produit Jarvis)

Le **16 août 2026** : Hermes retiré du runtime Jarvis (`DECISIONS.md`).  
Le **27 août 2026** : **réintégration partielle** sous **deux couloirs Policy** (`policy_corridor.py`) :

| Couloir | Qui | Chat libre | Hermes |
|---------|-----|------------|--------|
| **family** | salon, enfants, devices partagés | LLM (OpenRouter) | refusé |
| **lab** | admin / Samir / poste personnel | Hermes `agent.tools` (skills) | tuiles browser, terminal, files… |

**État NUC 27 août 18:54+ :** `jarvis-core` + `jarvis-hermes` active ; `HASS_URL` Hermes corrigé → `127.0.0.1:8123` ; smoke `_smoke_corridor_live` ALL PASS.

**MCP Workspace :** scaffold `deploy/mcp-jarvis-core/` (stdio MVP) — à brancher sur le VPS via tunnel.

Un seul cerveau = **Jarvis Core**. Hermes Workspace VPS = même agent Hermes (UI alternative), pas second cerveau autonome sur le foyer.

Avant cette réintégration :

```
Hermes Workspace (VPS)     ≠     Jarvis Core (NUC)     ≠     Windows Agent (PC)
      cerveau #2                   cerveau #1                  bras du Core
```

Ils **ne se parlent pas**. Brancher « n’importe comment » crée un **second cerveau** qui bypasse la Policy Jarvis — exactement ce que ton archi satellites interdit ([JARVIS-Satellites.md](../architecture/JARVIS-Satellites.md)).

---

## 2. Pourquoi Workspace « n’a pas de navigateur »

Normal pour un agent **sur VPS** :

- Pas de Chrome/GUI sur le serveur.
- Les outils navigateur Hermes passent par :
  1. **Nous Portal / Tool Gateway** (`hermes setup --portal`) — browser/search/TTS cloud ([docs Hermes](https://hermes-agent.nousresearch.com/docs/)), ou
  2. **MCP browser** (ex. `chrome-devtools-mcp`) pointant vers **une machine qui a Chrome** (ton PC), ou
  3. Backend **SSH/Docker** vers une machine avec browser.

Sans l’un des trois → chat seul, pas de navigateur.

---

## 3. Ce que tu veux (traduit en architecture)

> « Hermes Workspace utilise les utils de mon PC + le Core Jarvis »

Deux intentions distinctes — **ne pas les fusionner** :

| Intention | Correct | Incorrect |
|-----------|---------|-----------|
| A. Hermes utilise **Chrome / fichiers / shell PC** | MCP ou tunnel vers le PC | Donner root SSH du PC à Hermes sans Policy |
| B. Hermes utilise **HA / inventaire / apps via Jarvis** | Hermes → API/outils **Core** (Policy au milieu) | Hermes → Windows Agent en direct |
| C. Remplacer le chat Jarvis par Workspace | Possible UX, mais Core reste orchestrateur | Workspace = nouveau cerveau + Core ignoré |

---

## 4. Topologies possibles

### Option 0 — Ne pas reconnecter Hermes au Core (aligné décisions actuelles)

Workspace = **lab / second agent** (dev, recherche).  
Jarvis = foyer (HA, HUD, Windows Agent).  
Lien faible : même clé OpenRouter, pas de bus d’outils.

**Quand :** tu veux juste un chat Hermes cloud sans toucher au foyer.

---

### Option 1 — Workspace → outils PC via MCP (recommandé pour « navigateur / PC utils »)

```
[Hermes Workspace VPS]
        │  MCP (SSE / tunnel)
        ▼
[Bridge sur PC Windows]  ← Chrome DevTools MCP, filesystem, shell limité
        │
   (optionnel) Twingate / SSH reverse / Cloudflare Tunnel
```

**Comment :**

1. Sur le PC : installer MCP utiles (`chrome-devtools-mcp`, filesystem scoped, éventuellement shell restreint).
2. Exposer le MCP au VPS **sans ouvrir le PC au monde** :
   - Twingate (déjà dans ton topo Jarvis), ou
   - `ssh -R` depuis le PC vers le VPS, ou
   - tunnel Cloudflare vers `localhost:MCP_PORT`.
3. Sur le VPS Hermes : `hermes mcp …` / config `mcp_servers` ([MCP docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp)).

**FAQ Hermes** le dit explicitement pour WSL→Chrome Windows : préférer MCP bridge ([FAQ](https://hermes-agent.nousresearch.com/docs/reference/faq)).

**Sécurité :** scope dossiers Laragon seulement ; pas de `C:\` entier ; approval Hermes pour commandes.

---

### Option 2 — Workspace → Core Jarvis (recommandé pour « utils Jarvis »)

```
[Hermes Workspace]
        │  MCP « jarvis-core » (à écrire)
        ▼
[Core NUC : HTTP / WS authentifié]
        │  Policy Engine
        ▼
[Windows Agent | Pi | HA]
```

Hermes **ne parle jamais** au Windows Agent. Il demande au Core :

- `app.launch` / inventaire  
- `home.control`  
- mémoire / missions si exposées  

Le Core applique Policy → exécute via satellite.

**À construire :**

1. Petit **MCP server** (Python) côté NUC ou VPS qui wrappe les endpoints Core déjà existants (`/ws`, `/v1/…`).
2. Auth : token dédié `HERMES_WORKSPACE` ≠ clés root ; rate limit ; allowlist d’intents.
3. Config Hermes MCP → ce serveur (SSE vers NUC via Twingate/`jarvis.global-it-ss.com`).

**Effort :** moyen (1–2 sem. pour MVP lecture + 3–5 tools).

---

### Option 3 — Tool Gateway Nous (navigateur cloud, zéro PC)

Sur le VPS :

```bash
hermes setup --portal
```

Active web search + browser + image + TTS via subscription Nous ([portal](https://hermes-agent.nousresearch.com/docs/integrations/nous-portal)).

**Avantage :** rapide, pas de tunnel PC.  
**Limite :** ce n’est **pas** ton Chrome / tes cookies / ton Windows Agent / ton Core.

---

### Option 4 — Réintégrer Hermes derrière le Core (ancien modèle)

```
HUD / chat Jarvis → Core → (ex-)Hermes bridge → tools
Windows Agent reste satellite du Core
```

**Conflictuel** avec la décision du 16/08 (« Hermes retiré »).  
Ne le faire que si tu **révoques** explicitement cette décision et réécris le pont.

Workspace VPS resterait alors un **front** optionnel, pas l’orchestrateur.

---

## 5. Ce qui ne marchera pas / à éviter

| Idée | Pourquoi non |
|------|----------------|
| Pointer Workspace directement sur `windows_agent.py` | Agent = protocole Core WS, pas OpenAI tools / pas MCP |
| Donner à Hermes la clé SSH root NUC + PC | Bypass Policy ; « IA → root » interdit |
| Croire que Workspace « détecte » Jarvis | Aucun discovery cross-produit |
| Remonter `jarvis-hermes` NUC legacy sans plan | Code produit retiré ; dette |
| Ouvrir MCP Windows en `0.0.0.0` public | Surface d’attaque énorme |

---

## 6. Plan d’action recommandé (ordre)

### Phase A — Clarifier le rôle (1 décision)

Choisis **une** phrase :

1. « Workspace = lab cloud (Option 0 + Option 3 portal) »  
2. « Workspace = cerveau distant qui agit chez moi via Core (Option 2) »  
3. « Workspace = surtout mon PC (Option 1 MCP) »  
4. « Je reviens au modèle Core-orchestre + Hermes agent (Option 4) »

Sans ça tu mélanges 3 architectures.

### Phase B — Quick wins navigateur (si tu gardes Workspace)

1. Sur VPS : `hermes setup --portal` **ou** MCP browser.  
2. Vérifier gateway + dashboard Hermes tournent (Reddit : Workspace exige souvent les deux).  
3. OpenRouter déjà OK (même clé que NUC).

### Phase C — PC utils (si Option 1)

1. MCP Chrome + filesystem sur PC.  
2. Tunnel Twingate/SSH vers VPS.  
3. Enregistrer MCP dans Hermes Workspace.  
4. Tester : « ouvre example.com » / « liste `C:\laragon\www` ».

### Phase D — Core Jarvis (si Option 2)

1. Spec MCP `jarvis-core` : 5 tools max (`status`, `list_caps`, `launch_app`, `ha_call`, `memory_search`).  
2. Implémenter serveur MCP + auth.  
3. Brancher Workspace → MCP.  
4. Smokes : Policy refuse une action, accepte une autre.  
5. `memory_search` → **TencentDB Agent Memory** (Hub/Proxy NUC), pas les DBs métier — doctrine : `gsms-platform/docs/circuit/AGENT-MEMORY-TENCENT.md` (écriture métier interdite depuis Memory).

### Phase E — Ne pas toucher

Windows Agent continue à parler **uniquement** au Core (`ws://192.168.1.37:8080/ws` / Twingate).

---

## 7. Schéma cible (si tu veux les deux : PC + Core)

```
                    ┌──────────────────────────┐
                    │  Hermes Workspace (VPS)  │
                    │  chat UI + LLM tools     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │ MCP              │ MCP               │ Tool Gateway
              ▼                  ▼                   ▼
     ┌────────────────┐  ┌──────────────┐   ┌─────────────┐
     │ MCP PC (tunnel)│  │ MCP jarvis   │   │ Nous Portal │
     │ Chrome, files  │  │ (Core API)   │   │ browser cloud│
     └───────┬────────┘  └──────┬───────┘   └─────────────┘
             │                  │
             │                  ▼
             │         ┌────────────────┐
             │         │  Jarvis Core   │  Policy
             │         │  NUC           │
             │         └───────┬────────┘
             │                 │
             │         ┌───────┴────────┐
             │         ▼                ▼
             │   Windows Agent        HA / Pi
             └──(pas de lien direct)──┘
```

---

## 8. Verdict

- **Workspace seul sur VPS** = normal qu’il n’ait ni navigateur PC ni Core.  
- **Windows Agent** ne se « branche » pas sur Hermes : il est satellite **du Core**.  
- Pour Hermes + PC : **MCP + tunnel**.  
- Pour Hermes + Jarvis : **MCP wrapper Core** (Policy au milieu), pas de lien direct agent Windows.  
- Pour navigateur sans PC : **`hermes setup --portal`**.  
- Réintégrer Hermes *dans* Jarvis = **changement de décision produit**, pas un réglage.

---

## 9. Prochaine question (à trancher)

Dis laquelle tu veux **en premier** :

1. Navigateur cloud (portal)  
2. Chrome/fichiers PC via MCP  
3. MCP vers Core Jarvis  
4. Remise Hermes derrière le Core (révocation décision 16/08)

Ensuite on peut faire le runbook concret (commandes VPS + PC) pour **une** option.

# API CRM - Guide de structure

Ce dossier centralise tous les endpoints backend du CRM.

Objectifs:

- standardiser l'organisation des routes API;
- separer clairement le technique (`_shared`) du metier (`sections`);
- accelerer la creation de nouvelles APIs sans casser l'existant;
- garder une architecture lisible pour toute l'equipe.

---

## Schema d'arborescence

```text
api/
├─ _shared/                     # utilitaires techniques partages
├─ auth/                        # authentification et compte
├─ common/                      # endpoints transverses (health, files, stats...)
├─ dashboard/                   # endpoints dashboard global
├─ health/                      # healthcheck global
└─ sections/                    # endpoints metier par section CRM
   ├─ gestion-ressources/
   ├─ administration-facturation/
   ├─ securite-configuration/
   ├─ gestion-sites-clients/    # donnees sites clients (consommees par gestion-ressources; pas de section front dediee)
   ├─ gestion-academique/       # inclut vie-scolaire (examens, certifications, suivi-formations...)
   ├─ communication-contenu/
   ├─ pilotage-supervision/
   ├─ support-qualite/
   └─ workspace/                # vues workspace generiques par viewKey (useModuleWorkspaceQuery)
```

---

## Regles: ou creer une API

- creer dans `api/sections/<section>/<module>/...` pour toute logique metier liee a une section du menu CRM;
- creer dans `api/common/...` uniquement pour les endpoints transverses reutilisables par plusieurs sections;
- creer dans `api/auth/...` uniquement pour login/session/password/verification;
- utiliser `api/_shared/...` seulement pour helpers techniques (validation, reponse, erreurs, auth guard), jamais pour du metier.

---

## Regles: pourquoi creer une API

Creer une nouvelle API quand:

- une page/metrique a besoin d'une source de donnees stable et versionnable;
- la logique metier ne doit pas vivre dans le front;
- plusieurs composants front doivent reutiliser la meme logique;
- on doit appliquer controles d'acces, validations, audit ou format de reponse standard.

Eviter de creer une nouvelle API quand:

- un endpoint existant couvre deja le besoin (et peut etre etendu proprement);
- la logique est purement visuelle/front (formatage local, affichage);
- la duplication peut etre resolue via un helper `_shared`.

---

## Convention de creation d'endpoints

- dossier par domaine: `.../<ressource>/route.ts` ou `.../<ressource>/[id]/route.ts`;
- nommage explicite et metier (pas de nom generique type `data` ou `list2`);
- une responsabilite claire par endpoint;
- valider les payloads en entree;
- normaliser les reponses HTTP et erreurs;
- proteger les endpoints sensibles par auth/role.

---

## Convention de documentation

Chaque section/module doit contenir un `README.md` avec:

- sous-domaines API cibles;
- endpoints deja implementes;
- endpoints a creer (ordre de priorite);
- notes de dependances (DB, auth, fichiers, services externes).

---

## Regle d'evolution

- ne pas melanger les routes legacy et sectionnelles dans un meme endpoint;
- privilegier les routes sectionnelles `api/sections/...` pour les nouveaux developpements;
- faire des migrations progressives: garder compatibilite tant que le front n'est pas bascule;
- toute nouvelle page module doit avoir son endpoint documente dans le README du module.

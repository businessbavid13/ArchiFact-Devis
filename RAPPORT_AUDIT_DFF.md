# Rapport complet d’audit du code — DFF / ArchiFact Devis

**Date de l’audit :** 27 septembre 2026  
**Périmètre :** archive `DFF.zip` fournie par l’utilisateur  
**Méthode :** inspection statique de la structure et du code, analyse des configurations, installation des dépendances, exécution du build, du typage et des tests unitaires.  
**Modification du projet :** aucune modification fonctionnelle n’a été effectuée dans l’archive auditée.

---

## 1. Synthèse exécutive

DFF est une application de devis et de facturation destinée aux artisans et entreprises du BTP. L’interface est une SPA React/Vite pensée comme une application mobile, avec :

- authentification Supabase ;
- gestion des clients, articles, devis et factures ;
- génération de PDF ;
- scan photo/OCR et dictée vocale ;
- système de crédits ;
- intégration préparée pour Gemini, Supabase et un backend Express ;
- référentiel de données localStorage et implémentations Supabase en parallèle.

Le projet présente une **bonne base fonctionnelle et visuelle**, mais il n’est pas prêt pour une mise en production fiable dans son état actuel.

### Verdict global

| Domaine | Évaluation |
|---|---|
| Fonctionnalités UI | Bonne base de prototype avancé |
| Architecture | Cohérente dans l’intention, incomplètement intégrée |
| Build production | **Bloqué par une erreur JSX de syntaxe** |
| Typage | **Bloqué par la même erreur de syntaxe** |
| Tests unitaires | 44 tests passés sur 3 fichiers |
| Persistance réelle | Principalement localStorage dans le parcours utilisé |
| Sécurité multi-utilisateur | **Risque critique à traiter avant production** |
| Paiement | Simulation uniquement |
| OCR/IA côté interface | Simulation ; backend Gemini non branché au parcours UI |
| Maintenabilité | Moyenne ; dette technique importante |

### Priorités absolues

1. Corriger l’erreur JSX qui empêche le build.
2. Brancher réellement l’application à une stratégie de persistance unique et cohérente.
3. Ajouter les filtres `user_id` et les politiques RLS Supabase adaptées.
4. Remplacer le paiement simulé par un flux serveur vérifié par webhook.
5. Remplacer le faux OCR par l’appel backend Gemini avec validation stricte de sortie.
6. Mettre en place une CI minimale : typecheck, build, tests et contrôle des secrets.

---

## 2. Inventaire du projet

### Statistiques observées

- Environ **98 fichiers** hors dépendances et dossier `dist`.
- Environ **12 245 lignes** de TypeScript/TSX.
- 3 fichiers de tests unitaires :
  - `src/utils/calculations.test.ts`
  - `src/utils/formatting.test.ts`
  - `src/utils/voiceParser.test.ts`
- Build précompilé présent dans `dist/`.
- Fichier `.env` présent dans l’archive.
- Aucun workflow CI/CD visible dans l’archive.
- Aucun fichier de migration SQL Supabase visible.
- Aucun Dockerfile, Procfile ou configuration de déploiement complète visible.

### Technologies

- React 19
- TypeScript
- Vite 8
- React Router 7 avec `createHashRouter`
- Tailwind CSS 4
- Supabase JS
- Express
- Gemini via `@google/genai`
- jsPDF et html2canvas
- Vitest
- Prisma déclaré, mais non intégré de façon opérationnelle au chemin principal

### Scripts npm

- `npm run dev` : serveur Vite sur le port 3000.
- `npm run build` : build Vite.
- `npm run lint` : en réalité un `tsc --noEmit`, pas un linter.
- `npm test` : Vitest.
- `npm run backend` : serveur Express via `tsx`.

Le nom `lint` est trompeur : aucun ESLint ou équivalent n’est configuré.

---

## 3. Architecture et flux applicatifs

### Entrée principale

Le flux est :

1. `main.tsx` monte l’application.
2. `App.tsx` installe `AuthProvider`.
3. Sans session Supabase, `AuthScreen` est affiché.
4. Avec session, `RouterProvider` affiche les routes.
5. `AppLayout` installe `AppProvider`, les modales globales et la navigation mobile.

### Domaines fonctionnels

| Domaine | Éléments principaux |
|---|---|
| Authentification | `AuthContext`, `AuthScreen`, Supabase Auth |
| Factures | pages et écrans de liste/formulaire |
| Devis | pages et écrans de liste/formulaire |
| Clients | liste, ajout, modification, suppression |
| Articles | catalogue d’articles/services |
| Paramètres | société, personnalisation, moyens de paiement |
| Crédits | solde local, boutique simulée |
| Scan | modal photo, documents d’exemple, extraction simulée |
| PDF | génération jsPDF, QR de paiement, images et signatures |
| Backend IA | Express + trois endpoints Gemini |

### Gestion d’état actuelle

Le parcours réellement utilisé par l’interface repose sur des hooks React et `localStorage` :

- `df_invoices`
- `df_quotes`
- `df_articles`
- `df_clients`
- `df_settings`
- `df_credits`

Les classes Supabase existent, mais ne sont pas injectées dans `AppProvider` ni dans les hooks métier. Le code contient donc deux architectures concurrentes :

- une architecture locale synchrone effectivement utilisée ;
- une architecture Supabase asynchrone préparée mais non finalisée.

Cette situation crée un risque de divergence entre ce que l’utilisateur voit, ce qui est sauvegardé localement et ce qui serait sauvegardé côté serveur.

---

## 4. Analyse fonctionnelle

### Points positifs

- Parcours métier clair pour créer un devis ou une facture.
- Conversion devis → facture prévue.
- Duplication de devis et de factures.
- Calcul des remises, taxes et totaux centralisé.
- Génération PDF relativement riche : templates, logo, signature, cachet, QR de paiement.
- Interface responsive orientée mobile.
- Tests unitaires existants sur les fonctions critiques de calcul, formatage et dictée.
- Les crédits sont contrôlés avant lancement du scan dans l’interface.

### Limites fonctionnelles importantes

#### Scan/OCR non réel dans le parcours UI

`processPhotoDocument` renvoie des documents d’exemple et des valeurs synthétiques. Pour des photos utilisateur, il génère aussi des articles modèles au lieu d’analyser le contenu réel de l’image. Le backend Express possède un endpoint Gemini, mais le composant `PhotoScanModal` ne l’appelle pas.

Conséquence : l’interface peut donner l’impression qu’un OCR réel a été effectué alors que les données peuvent être inventées ou génériques.

#### Paiement simulé

`simulateCreditPayment` attend 1,5 seconde puis renvoie toujours un paiement réussi avec un identifiant calculé localement. Aucun opérateur Mobile Money, carte bancaire, serveur de paiement ou webhook n’est utilisé.

Conséquence : aucun achat réel ne doit être autorisé en production avec ce flux.

#### Crédits locaux et non transactionnels

Le solde est stocké dans `localStorage`. Un utilisateur peut le modifier via les outils du navigateur. Il n’existe pas de ledger, de transaction serveur, de contrôle anti-rejeu ni de réservation atomique.

#### Dates par défaut codées en dur

Le flux de scan injecte des dates fixes comme `14/09/2026`, `21/09/2026` et `14/10/2026`. Cela produira des documents incorrects lorsque ces dates seront dépassées.

#### Création automatique de client artificielle

Lors d’un scan, un client absent est créé avec :

- un téléphone par défaut ;
- une adresse `Abidjan` ;
- une adresse email construite en `@example.com`.

Cela est acceptable pour une maquette, mais dangereux si le résultat est considéré comme une donnée métier confirmée.

---

## 5. Problèmes bloquants et défauts techniques

### P0 — Build impossible à compiler

Le fichier `src/screens/Settings/SettingsScreen.tsx` ferme le conteneur JSX principal avant le bloc « Logout Button », puis utilise un fragment fermant `</>` sans fragment ouvrant correspondant dans cette portée.

Constat d’exécution :

```text
error TS1005: ')' expected
error TS1128: Declaration or statement expected
vite: Expected `,` or `)` but found `{`
```

Le build et le typecheck échouent à cet endroit.

### P1 — Hook `useAsync` incomplet

`src/hooks/useAsync.ts` utilise `useEffect` mais ne l’importe pas. Cette erreur est masquée actuellement par l’erreur de parsing précédente ; après correction du JSX, elle devrait apparaître au typecheck.

### P1 — Contrat repository incohérent

Les interfaces de repository sont synchrones, alors que les implémentations Supabase sont asynchrones et implémentent les méthodes synchrones par des `throw new Error(...)`.

Exemple de comportement problématique :

- l’interface expose `getAll(): T[]` ;
- l’implémentation Supabase expose réellement `getAllAsync(): Promise<T[]>` ;
- `getAll()` lève une exception.

Ce design empêche un remplacement transparent de localStorage par Supabase, contrairement à l’objectif documenté.

### P1 — Données globales dans Supabase

Les appels Supabase lisent ou modifient des lignes sans filtrer par `user_id` :

- `select('*').order(...)`
- `eq('id', id)`
- `update(...).eq('id', id)`
- `delete().eq('id', id)`
- `single()`

Le schéma typé contient pourtant `user_id` sur plusieurs tables. Sans politiques RLS strictes et sans filtres applicatifs, un utilisateur authentifié pourrait potentiellement lire ou modifier des données d’un autre compte si les règles de base de données le permettent.

### P1 — Solde de crédits vulnérable aux courses concurrentes

La déduction Supabase fait :

1. lecture du solde ;
2. calcul local ;
3. update du solde.

Deux requêtes concurrentes peuvent lire le même solde et le débiter toutes les deux. La solution doit être une fonction SQL/RPC atomique ou une table de ledger avec transaction.

### P1 — Gestion d’erreur d’inscription incomplète

Après `signUp`, les insertions de `company_settings` et `credits` sont effectuées sans vérifier leurs erreurs. Un compte peut donc être créé sans paramètres ni crédits, tout en retournant une inscription réussie à l’utilisateur.

### P1 — Backend IA non sécurisé pour une exposition internet

Le serveur Express :

- utilise `cors()` sans restriction d’origine ;
- ne demande pas d’authentification sur les endpoints IA ;
- accepte des payloads base64 jusqu’à 10 Mo sans quota utilisateur ;
- n’applique pas de rate limiting ;
- ne limite pas le nombre d’images ;
- n’impose pas de schéma de sortie Gemini ;
- loggue l’erreur serveur complète côté backend.

Les endpoints IA doivent être protégés par la session utilisateur, un quota de crédits côté serveur, un rate limit et une validation structurée.

### P2 — Configurations Prisma incohérentes

Le dépôt contient un schéma Prisma SQLite avec plusieurs champs `String[]`, notamment `scannedPagesUrls`, `paymentModes` et `termsAndConditions`. Les listes scalaires ne sont pas compatibles avec SQLite dans les versions Prisma usuelles ; cette combinaison doit être revue.

Par ailleurs, Prisma est déclaré en version release candidate et le fichier `prisma.config.ts` utilise une configuration récente, tandis que la commande `prisma validate` n’est pas reconnue dans l’environnement installé. La chaîne Prisma n’est donc pas vérifiable de manière fiable avec l’archive actuelle.

### P2 — Verrouillage des dépendances non reproductible

`npm ci` échoue car `package.json` et `package-lock.json` ne sont pas synchronisés :

```text
npm ci can only install packages when package.json and package-lock.json are in sync
Missing: typescript@6.0.3 from lock file
```

Une installation `npm install` a pu être effectuée pour poursuivre l’audit, mais elle a dû recalculer l’arbre de dépendances. Le projet nécessite un lockfile régénéré et validé.

### P2 — Versions incompatibles avec Node 20

L’installation émet de nombreux avertissements `EBADENGINE` : plusieurs dépendances, dont Supabase, Prisma et Vitest, demandent Node 22 ou supérieur alors que l’environnement utilise Node 20.20.2.

Il faut choisir explicitement :

- soit Node 22 LTS et un lockfile régénéré ;
- soit des versions compatibles Node 20.

---

## 6. Sécurité

### Données de configuration

Un fichier `.env` est inclus dans l’archive. Même si ses valeurs n’apparaissent pas dans ce rapport, il ne devrait pas être transmis dans une archive de code ou commité. Il faut :

1. révoquer toute clé qui aurait été exposée ;
2. retirer `.env` de l’historique Git si nécessaire ;
3. conserver uniquement `.env.example` avec des placeholders ;
4. fournir les secrets via l’environnement de déploiement.

Le frontend contient aussi une URL Supabase et une clé `anon` de secours codées en dur. Une clé Supabase `anon` est destinée à être publique, mais le fallback codé en dur masque les erreurs de configuration et rend les environnements difficiles à contrôler. L’URL et la clé doivent venir exclusivement des variables Vite.

### Isolation multi-tenant

Le modèle possède des colonnes `user_id` dans les types générés, mais les mappers et écritures Supabase n’ajoutent généralement pas `user_id`. Il faut définir une règle unique :

- récupérer l’utilisateur courant ;
- ajouter `user_id` sur chaque insertion ;
- filtrer chaque lecture, mise à jour et suppression ;
- activer et tester RLS sur chaque table ;
- éviter que l’ID envoyé par le navigateur soit le seul contrôle d’accès.

### Uploads et images

Les images sont conservées comme URLs de prévisualisation et peuvent être intégrées aux PDF. Il manque une politique claire de stockage :

- durée de conservation ;
- taille maximale par fichier ;
- type MIME réellement inspecté ;
- suppression après traitement ;
- contrôle d’accès aux objets ;
- protection contre les URLs publiques non désirées.

---

## 7. Qualité du code et maintenabilité

### Forces

- Types métier lisibles.
- Découpage par domaines UI.
- Fonctions de calcul séparées et testées.
- Utilisation correcte de callbacks React dans plusieurs hooks.
- Génération PDF isolée dans un module dédié.
- Documentation interne expliquant l’intention de migration.

### Faiblesses

- Le projet mélange prototype local, backend Express, Supabase et Prisma sans flux de production unique.
- Présence de `server.ts.bak`, fichiers de test temporaires (`test.txt`, `test2.txt`) et artefacts générés (`dist`) dans l’archive.
- Commentaires parfois plus ambitieux que l’implémentation réelle, notamment autour de l’OCR, des paiements et de la migration backend.
- Validation des données entrantes faible : casts directs depuis `Record<string, unknown>` dans les mappers Supabase.
- Génération d’identifiants avec `Date.now()` et `Math.random()` dans le modèle local ; cela peut provoquer des collisions.
- Pas de couche de schéma runtime comme Zod ou équivalent pour les réponses Gemini et les payloads API.
- Pas de logger structuré ni de corrélation de requêtes.
- Pas de tests de composants, d’authentification, de repositories, d’API ou de PDF.
- Aucun contrôle visible de couverture.
- Aucune CI visible.

### Tests vérifiés

Résultat obtenu :

```text
Test Files  3 passed (3)
Tests       44 passed (44)
```

Les tests sont utiles mais couvrent essentiellement des fonctions pures. Ils ne détectent pas le défaut JSX qui bloque l’application, car aucun test de build ou de compilation n’est exécuté dans la commande de test.

---

## 8. Recommandations d’architecture

### Option recommandée : Supabase comme backend principal

1. Supprimer le choix implicite localStorage/Supabase dans les hooks métier.
2. Définir des repositories asynchrones dès l’interface :
   - `getAll(): Promise<T[]>`
   - `getById(id): Promise<T | undefined>`
   - `create(item): Promise<void>`
   - etc.
3. Injecter ces repositories dans les hooks ou dans un service de contexte.
4. Ajouter systématiquement `user_id` aux insertions.
5. Utiliser RLS et des contraintes SQL.
6. Déplacer les opérations sensibles vers des Edge Functions ou le backend.
7. Conserver localStorage uniquement comme cache offline explicite, jamais comme source d’autorité.

### Paiements

- Créer une commande de paiement côté serveur.
- Enregistrer une transaction avec statut `pending`.
- Rediriger vers le fournisseur de paiement.
- Vérifier la notification via webhook signé.
- Créditer le compte uniquement après confirmation serveur.
- Rendre le webhook idempotent.
- Ajouter une table de ledger de crédits.

### Gemini/OCR

- Recevoir les images côté backend authentifié.
- Vérifier taille et MIME.
- Utiliser un schéma JSON strict.
- Valider la réponse avec un parseur runtime.
- Refuser les quantités/prix négatifs et les totaux incohérents.
- Débiter le crédit dans une transaction atomique.
- Enregistrer usage, coût, utilisateur et résultat.
- Ne pas fabriquer de client ou de date sans le signaler explicitement à l’utilisateur.

### Dates et montants

- Stocker les dates au format ISO côté données.
- Formater uniquement à l’affichage.
- Utiliser une librairie ou une stratégie explicite de timezone.
- Éviter `Float` pour les montants financiers ; préférer des entiers en unité minimale ou `Decimal`.
- Recalculer les totaux côté serveur avant persistance.

---

## 9. Plan d’action priorisé

### Phase 1 — Remise en état immédiate

- Corriger le JSX de `SettingsScreen`.
- Importer `useEffect` dans `useAsync`.
- Régénérer et vérifier `package-lock.json`.
- Choisir Node 22 LTS ou abaisser les dépendances.
- Faire passer `npm run lint`, `npm run build` et `npm test`.
- Supprimer les fichiers `.bak` et temporaires de l’archive.

### Phase 2 — Sécurisation des données

- Retirer les fallbacks Supabase codés en dur.
- Révoquer les secrets éventuellement exposés.
- Définir le modèle multi-tenant.
- Ajouter `user_id` aux repositories.
- Activer et tester RLS.
- Remplacer les opérations de crédit par une fonction atomique.

### Phase 3 — Fonctionnalités réelles

- Connecter `PhotoScanModal` au backend IA.
- Remplacer `processPhotoDocument` par une intégration Gemini réelle.
- Ajouter validation runtime des réponses.
- Implémenter le paiement réel avec webhook.
- Persister devis, factures, clients, articles et paramètres dans une seule source d’autorité.

### Phase 4 — Industrialisation

- Ajouter tests de composants et tests d’intégration.
- Ajouter tests API et tests RLS.
- Ajouter CI : installation propre, typecheck, tests, build, audit secrets.
- Ajouter observabilité et logs structurés.
- Mettre en place migrations DB versionnées.
- Ajouter documentation de déploiement et procédure de rotation des secrets.

---

## 10. Conclusion

DFF est un prototype avancé avec une interface riche et une base métier pertinente. La structure est suffisamment claire pour être industrialisée sans réécriture totale. Toutefois, le projet mélange encore plusieurs niveaux de maturité : l’UI est démontrable, tandis que la persistance cloud, l’IA et le paiement sont partiellement simulés ou seulement préparés.

La priorité n’est pas d’ajouter de nouvelles fonctionnalités, mais de stabiliser le socle : compilation, dépendances, modèle de données, isolation utilisateur, persistance serveur et opérations financières atomiques. Une fois ces points traités, le produit pourra évoluer vers une version de production de manière progressive et maîtrisée.

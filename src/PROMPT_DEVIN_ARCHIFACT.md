# ARCHIFACT — PROMPT DE CONTINUATION DU DÉVELOPPEMENT

## MISSION

Tu reçois un projet existant nommé **ARCHIFACT DEVIS**, généré initialement avec Google AI Studio.

Ta mission est de continuer son développement et de le transformer progressivement en une application **WEB FULL-STACK** professionnelle, fiable, sécurisée, maintenable, testable, performante et prête pour la production.

IMPORTANT :

**NE RECOMMENCE PAS LE PROJET DEPUIS ZÉRO.**

**NE REMPLACE PAS L'APPLICATION EXISTANTE.**

**NE SUPPRIME PAS LES FONCTIONNALITÉS EXISTANTES.**

**NE CHANGE PAS ARBITRAIREMENT LE DESIGN EXISTANT.**

Le projet Google AI Studio constitue la base de travail.

Agis comme un développeur senior qui reprend un produit existant et l'industrialise.

Avant toute modification importante :
1. analyser le code ;
2. comprendre l'architecture ;
3. identifier les fonctionnalités existantes ;
4. identifier les fonctionnalités réellement fonctionnelles et celles qui sont simulées ;
5. identifier les dépendances ;
6. identifier les problèmes techniques ;
7. établir un plan de migration progressif.

---

# 1. STACK

Conserver autant que pertinent la stack existante :

- React
- TypeScript
- Vite
- TailwindCSS
- Motion
- Lucide React
- jsPDF
- html2canvas
- qrcode
- @google/genai
- Node.js
- Express
- dotenv

Le produit reste une :

**APPLICATION WEB FULL-STACK**

Il doit être :
- mobile-first ;
- responsive ;
- compatible tablette ;
- compatible desktop ;
- installable comme PWA.

NE PAS migrer vers :
- Flutter
- React Native
- Kotlin
- Swift
- Ionic
- Capacitor
- WebView

---

# 2. ARCHITECTURE CIBLE

Architecture souhaitée :

```text
                  FRONTEND
             React + TypeScript
                     │
              Responsive / PWA
                     │
                    API
                     │
                  BACKEND
                     │
               Business Logic
                     │
                 DATABASE
                     │
        ┌────────────┼────────────┐
        │            │            │
       IA         PAIEMENT     STORAGE
        │            │            │
     Gemini       GeniusPay      Files
```

L'objectif est d'obtenir une architecture capable d'accueillir de vrais utilisateurs.

---

# 3. FONCTIONNALITÉS EXISTANTES À CONSERVER

Conserver et améliorer les fonctionnalités présentes dans le projet :

- Dashboard
- Factures
- Devis
- Articles / Services
- Clients
- Personnalisation
- Paramètres
- Génération PDF
- QR Code
- Signature
- Logo
- Scan photo
- OCR
- Scan multi-pages
- Dictée vocale
- Génération à partir de photo
- Génération à partir de voix
- Crédits
- Packs de crédits
- Paiement
- Prévisualisation
- Conversion devis → facture
- Bottom navigation
- Swipe actions
- Animations
- Responsive
- PWA

Ne pas supprimer une fonctionnalité simplement parce qu'elle est actuellement mockée.

Si une fonctionnalité est mockée, conserver l'interface et remplacer progressivement le mock par une implémentation réelle.

---

# 4. DESIGN

Le design actuel du projet est la référence.

Conserver autant que possible :
- couleurs ;
- typographie ;
- espacements ;
- cartes ;
- boutons ;
- formulaires ;
- icônes ;
- navigation ;
- bottom navigation ;
- modales ;
- animations ;
- hiérarchie visuelle ;
- comportement mobile.

Réutiliser les composants existants.

NE PAS remplacer l'interface par une UI générique.

Les améliorations visuelles doivent principalement concerner :
- responsive ;
- accessibilité ;
- cohérence ;
- UX ;
- performance.

---

# 5. RESPONSIVE

L'application doit fonctionner parfaitement sur :
- smartphone ;
- tablette ;
- laptop ;
- desktop.

Sur smartphone :
- pleine largeur ;
- interactions tactiles ;
- boutons suffisamment grands ;
- formulaires adaptés ;
- navigation mobile ;
- modales adaptées.

Sur tablette et desktop :
- exploiter correctement l'espace disponible ;
- éviter les interfaces trop étroites ;
- conserver la même identité visuelle.

NE PAS simplement afficher une interface mobile centrée au milieu d'un écran desktop.

---

# 6. PWA

Ajouter progressivement une vraie PWA :
- manifest ;
- icônes ;
- service worker ;
- cache ;
- installation ;
- mode standalone ;
- stratégie de mise à jour ;
- fonctionnement offline lorsque pertinent.

`vite-plugin-pwa` peut être utilisé si adapté au projet.

---

# 7. FACTURES

Conserver et fiabiliser :
- liste ;
- recherche ;
- filtres ;
- création ;
- édition ;
- suppression ;
- duplication ;
- sélection client ;
- articles ;
- quantités ;
- prix ;
- remise fixe ;
- remise en pourcentage ;
- TVA ;
- taxes ;
- sous-total ;
- total ;
- statut ;
- paiement ;
- retard ;
- prévisualisation ;
- PDF ;
- QR code ;
- signature ;
- logo ;
- personnalisation.

Les calculs financiers doivent être centralisés dans des fonctions métier testables.

---

# 8. DEVIS

Conserver :
- création ;
- modification ;
- suppression ;
- consultation ;
- recherche ;
- filtrage ;
- statut ;
- date d'expiration ;
- calcul ;
- PDF ;
- prévisualisation ;
- personnalisation.

Conserver impérativement :

**DEVIS → FACTURE**

Lors de la conversion :
- reprendre le client ;
- reprendre les articles ;
- reprendre les quantités ;
- reprendre les prix ;
- reprendre les taxes ;
- reprendre les remises ;
- recalculer les totaux.

---

# 9. ARTICLES / SERVICES

Conserver :
- création ;
- modification ;
- suppression ;
- recherche ;
- consultation ;
- prix ;
- unité ;
- description ;
- import depuis photo ;
- utilisation dans devis ;
- utilisation dans factures.

---

# 10. CLIENTS

Conserver :
- création ;
- modification ;
- suppression ;
- recherche ;
- consultation.

Relation :

```text
CLIENT
 ├── DEVIS
 └── FACTURES
```

---

# 11. PDF

Le projet possède déjà notamment :

`utils/pdfGenerator.ts`

Ne pas le réécrire inutilement.

Préserver :
- logo ;
- signature ;
- header ;
- footer ;
- couleurs ;
- QR code ;
- templates ;
- TVA ;
- totaux ;
- informations client ;
- informations entreprise ;
- annexes ;
- pages scannées.

Le PDF doit correspondre à la prévisualisation affichée dans l'application.

---

# 12. PERSONNALISATION

Conserver :
- logo ;
- nom entreprise ;
- coordonnées ;
- couleurs ;
- informations fiscales ;
- informations de contact ;
- paramètres des documents.

---

# 13. DATA ET REPOSITORIES

Le projet utilise actuellement notamment localStorage avec des clés similaires à :

```text
df_invoices
df_quotes
df_articles
df_clients
df_settings
df_credits
```

Ne pas supprimer immédiatement cette logique.

Introduire progressivement :

```text
InvoiceRepository
QuoteRepository
ArticleRepository
ClientRepository
SettingsRepository
CreditRepository
```

Architecture actuelle :

```text
UI
↓
Repository
↓
localStorage
```

Architecture cible :

```text
UI
↓
Repository
↓
API
↓
Backend
↓
Database
```

Le Repository Pattern doit permettre de remplacer progressivement le stockage local par le backend sans devoir réécrire toute l'interface.

---

# 14. BACKEND

Créer progressivement un véritable backend.

Technologie recommandée :

**Node.js + TypeScript**

NestJS peut être utilisé si cela améliore réellement l'architecture.

Sinon utiliser Express ou Fastify avec une architecture propre.

Le backend doit contenir :
- API ;
- authentification ;
- autorisation ;
- logique métier ;
- IA ;
- crédits ;
- paiements ;
- documents ;
- stockage ;
- validation.

---

# 15. BASE DE DONNÉES

PostgreSQL est recommandé.

Prévoir progressivement des entités similaires à :

```text
users
companies
clients
products
quotes
quote_items
invoices
invoice_items
credits
credit_transactions
payments
documents
photo_generations
voice_generations
```

Adapter les relations au modèle réellement présent dans le projet.

NE PAS créer inutilement des tables sans besoin fonctionnel.

---

# 16. AUTHENTIFICATION

Prévoir :
- inscription ;
- connexion ;
- déconnexion ;
- session ;
- récupération de compte ;
- protection des routes ;
- autorisation.

Un utilisateur ne doit jamais pouvoir accéder aux données d'un autre utilisateur.

Toutes les permissions doivent être vérifiées côté backend.

---

# 17. ROUTING

Le projet utilise actuellement notamment :

```text
activeTab
activeSubScreen
```

dans `App.tsx`.

Faire évoluer progressivement vers un vrai routing, par exemple avec React Router.

Structure cible :

```text
/dashboard

/invoices
/invoices/new
/invoices/:id

/quotes
/quotes/new
/quotes/:id

/articles
/articles/new
/articles/:id

/clients
/clients/new
/clients/:id

/settings
```

Conserver l'expérience mobile existante.

---

# 18. REFACTORING APP.TSX

NE PAS tout réécrire brutalement.

Extraire progressivement :
- routing ;
- navigation ;
- providers ;
- hooks ;
- services ;
- état global ;
- logique métier.

Objectif : réduire progressivement la complexité de `App.tsx` sans casser les fonctionnalités.

---

# 19. STATE MANAGEMENT

Le projet utilise actuellement beaucoup de :
`useState`

et de props drilling.

Améliorer progressivement avec :
- Context ;
- hooks ;
- Zustand lorsque réellement nécessaire.

Séparer :
`UI STATE`
et
`BUSINESS STATE`.

---

# 20. TYPESCRIPT

Corriger progressivement les types critiques.

Éviter notamment :
```typescript
any
```
lorsqu'un type réel peut être défini.

Créer des types explicites pour :
- documents ;
- preview ;
- OCR ;
- voix ;
- crédits ;
- paiements ;
- articles ;
- devis ;
- factures ;
- clients ;
- utilisateurs.

---

# 21. IA — GEMINI

L'IA est une fonctionnalité centrale d'ArchiFact.

Utiliser **Gemini** comme moteur IA principal.

Le projet utilise déjà :
`@google/genai`

La clé Gemini ne doit JAMAIS être exposée dans le frontend.

Architecture :

```text
React
↓
Backend ArchiFact
↓
Gemini API
```

Créer un service centralisé :

```text
AIService
│
├── analyzeImage()
├── analyzeDocument()
├── transcribeAudio()
├── transcribeAudioLive()
└── parseBusinessCommand()
```

Chaque méthode doit retourner des données typées.

---

# 22. PHOTO → DOCUMENT

Flux cible :

```text
PHOTO
↓
UPLOAD
↓
GEMINI
↓
ANALYSE VISUELLE
↓
EXTRACTION
↓
NORMALISATION
↓
JSON STRUCTURÉ
↓
VALIDATION
↓
FORMULAIRE PRÉREMPLI
↓
VÉRIFICATION UTILISATEUR
↓
DOCUMENT
```

Types :
- devis ;
- facture ;
- article.

---

# 23. EXTRACTION STRUCTURÉE

Demander à Gemini une sortie structurée conforme à un schéma.

Exemple :

```json
{
  "documentType": "quote",
  "company": {
    "name": "",
    "phone": "",
    "email": "",
    "address": ""
  },
  "client": {
    "name": "",
    "phone": "",
    "email": "",
    "address": ""
  },
  "items": [
    {
      "description": "",
      "quantity": 0,
      "unit": "",
      "unitPrice": 0,
      "total": 0
    }
  ],
  "discount": 0,
  "tax": 0,
  "subtotal": 0,
  "total": 0
}
```

Adapter ce schéma aux modèles réellement utilisés dans le projet.

---

# 24. VALIDATION IA

Après Gemini :

```text
Gemini
↓
JSON
↓
Validation Zod
↓
Normalisation
↓
Business Rules
↓
UI
```

Vérifier :
- types ;
- quantités ;
- prix ;
- totaux ;
- champs obligatoires ;
- incohérences.

Si une donnée est absente ou illisible :

NE PAS l'inventer.

Utiliser `null` lorsque nécessaire.

L'utilisateur doit pouvoir corriger les données avant validation.

---

# 25. ANTI-HALLUCINATION

L'IA ne doit jamais inventer une information absente de la photo ou du document.

Exemple :

```json
{
  "unitPrice": null
}
```

si le prix n'est pas lisible.

Ne jamais transformer une supposition en donnée certaine.

---

# 26. OCR MULTI-PAGES

Conserver la logique de scan multi-pages.

Prévoir :
- plusieurs photos ;
- validation ;
- compression ;
- traitement ;
- analyse combinée ;
- extraction ;
- fusion.

Éviter les doublons lorsqu'une information apparaît sur plusieurs pages.

---

# 27. VOIX

La voix est une deuxième interface majeure.

L'utilisateur doit pouvoir parler naturellement pour créer ou modifier un document.

Exemple :

> « Ajoute cinq sacs de ciment à six mille cinq cents francs et dix barres de fer à trois mille cinq cents francs. »

Le système doit comprendre :
- produit ;
- quantité ;
- unité ;
- prix ;
- client ;
- catégorie ;
- remise ;
- taxe.

Puis produire des données structurées.

---

# 28. VOIX → TEXTE

Utiliser Gemini pour la transcription lorsque cela est approprié.

Créer :
`transcribeAudio()`
`transcribeAudioLive()`

Le système doit supporter le français et un vocabulaire métier extensible.

---

# 29. VOIX TEMPS RÉEL

Lorsque pertinent :

```text
microphone
↓
streaming
↓
transcription intermédiaire
↓
transcription finale
↓
analyse
↓
résultat
```

Afficher :
- état d'écoute ;
- transcription en cours ;
- transcription finale ;
- état d'analyse ;
- erreur ;
- confirmation.

Ne pas bloquer toute l'interface.

---

# 30. VOCABULAIRE MÉTIER

Prévoir notamment :

```text
ciment
fer à béton
fer 6
fer 8
fer 10
fer 12
fer 14
fer 16
parpaing
aggloméré
sable
gravier
peinture
pot
rouleau
tôle
chevron
bastaing
contreplaqué
carrelage
main-d'œuvre
```

Ce vocabulaire doit rester extensible.

---

# 31. VOIX → COMMANDE STRUCTURÉE

Après transcription :

```text
texte
↓
Gemini
↓
JSON
↓
Zod
↓
Business Rules
↓
Application
```

Exemple :

```json
{
  "action": "add_item",
  "items": [
    {
      "description": "Sac de ciment",
      "quantity": 5,
      "unit": "sac",
      "unitPrice": 6500
    }
  ]
}
```

---

# 32. INTENTIONS VOCALES

Prévoir progressivement :

```text
add_item
remove_item
update_item
create_quote
create_invoice
select_client
set_discount
set_tax
set_due_date
```

---

# 33. PARSER VOCAL EXISTANT

Le projet possède déjà :
`voiceParser.ts`

Ne pas le supprimer immédiatement.

Il doit rester disponible comme :
- fallback ;
- parser local ;
- solution rapide pour les commandes simples.

Architecture cible :

```text
VoiceService
│
├── GeminiTranscriptionService
├── GeminiCommandParser
└── LocalVoiceParserFallback
```

---

# 34. CRÉDITS

Les offres commerciales actuelles sont :

| Offre | Prix | Crédits |
|---|---:|---:|
| Gratuit | 0 FCFA | 5 |
| Starter | 1 000 FCFA | 20 |
| Essentiel | 2 500 FCFA | 60 |
| Pro | 5 000 FCFA | 150 |

Conserver ces valeurs pour le moment.

Le système actuel est local/simulé et doit devenir progressivement backend.

Modèle cible :

```text
credits
credit_transactions
```

---

# 35. CONSOMMATION DES CRÉDITS

Une génération IA doit suivre :

```text
1. vérifier le solde
2. réserver le crédit
3. exécuter l'opération
4. succès → confirmer
5. échec → restituer
```

Le frontend ne doit JAMAIS modifier directement le solde.

---

# 36. COÛT DES OPÉRATIONS IA

Proposition initiale :

| Fonction | Coût |
|---|---:|
| Photo → Article | 1 crédit |
| Photo → Devis | 2 crédits |
| Photo → Facture | 2 crédits |
| Voix → commande simple | 1 crédit |
| Voix → création complète d'un devis | 2 crédits |
| Photo/PDF multipage | 3 à 5 crédits |

Ces valeurs doivent être configurables côté backend.

NE PAS coder ces coûts en dur dans plusieurs composants frontend.

Créer une configuration centrale.

---

# 37. PAIEMENT — GENIUSPAY

Le prestataire de paiement choisi pour ArchiFact est :

**GENIUSPAY**

Créer :
`PaymentService`

avec :
`GeniusPayPaymentService`

et conserver :
`MockPaymentService`

pour le développement et les tests.

Architecture :

```text
Frontend
    ↓
Backend ArchiFact
    ↓
PaymentService
    ↓
GeniusPay
    ↓
Paiement utilisateur
    ↓
GeniusPay Webhook
    ↓
Backend ArchiFact
    ↓
Validation
    ↓
CreditTransaction
    ↓
Ajout des crédits
```

---

# 38. SÉCURITÉ GENIUSPAY

Les credentials GeniusPay doivent être exclusivement côté backend.

JAMAIS dans React/Vite.

Ne jamais exposer :
- API secret ;
- private key ;
- webhook secret ;
- credentials de paiement.

Prévoir des variables d'environnement, par exemple :

```env
GENIUSPAY_API_KEY=
GENIUSPAY_SECRET_KEY=
GENIUSPAY_WEBHOOK_SECRET=
GENIUSPAY_BASE_URL=
```

Adapter les noms exacts aux credentials réellement fournis par GeniusPay.

---

# 39. DOCUMENTATION GENIUSPAY

IMPORTANT :

**NE JAMAIS INVENTER LES ENDPOINTS GENIUSPAY.**

Avant d'implémenter GeniusPay, consulter sa documentation officielle.

Utiliser exactement :
- endpoints officiels ;
- paramètres officiels ;
- headers officiels ;
- authentification officielle ;
- format officiel des webhooks ;
- statuts officiels ;
- mécanisme officiel de vérification.

Si une information manque :

**NE PAS L'INVENTER.**

Isoler la partie concernée derrière :
`GeniusPayPaymentService`

et laisser un TODO explicite si nécessaire.

---

# 40. PROCESSUS D'ACHAT

Lorsqu'un utilisateur sélectionne un pack :

```text
1. récupérer l'offre depuis le backend
2. créer une transaction PENDING
3. générer un identifiant unique
4. demander la création du paiement à GeniusPay
5. récupérer l'URL ou le mécanisme fourni par GeniusPay
6. rediriger l'utilisateur
7. attendre la confirmation officielle
8. recevoir le webhook
9. vérifier son authenticité
10. vérifier la transaction
11. vérifier le montant
12. vérifier l'utilisateur
13. vérifier que la transaction n'a pas déjà été traitée
14. passer à SUCCESS
15. créer une CreditTransaction
16. ajouter les crédits
```

---

# 41. SÉCURITÉ DES CRÉDITS

Le frontend ne doit jamais pouvoir envoyer :

```json
{
  "credits": 150
}
```

pour demander au backend d'ajouter des crédits.

Le backend détermine lui-même les crédits associés au pack.

Exemple :

```text
pack = PRO
price = 5000
credits = 150
```

---

# 42. IDEMPOTENCE

Si GeniusPay envoie deux fois le même webhook, les crédits doivent être ajoutés une seule fois.

Utiliser des identifiants uniques comme :
- payment_id ;
- provider_transaction_id ;
- internal_transaction_id ;

avec contraintes uniques en base de données.

---

# 43. STATUTS DE PAIEMENT

Prévoir au minimum :

```text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REFUNDED
```

Les crédits ne sont ajoutés qu'après confirmation valide du paiement.

---

# 44. HISTORIQUE DES PAIEMENTS

Créer notamment :

```text
payment_id
user_id
pack_id
amount
currency
provider
provider_transaction_id
status
created_at
updated_at
```

Et :

```text
credit_transactions
```

avec :

```text
user_id
type
amount
balance_before
balance_after
reference
created_at
```

Types :

```text
INITIAL_BONUS
PURCHASE
AI_USAGE
REFUND
ADMIN_ADJUSTMENT
```

---

# 45. MONNAIE

La monnaie principale d'ArchiFact est :

**XOF / FCFA**

Manipuler les montants avec précision.

Éviter les calculs financiers dangereux avec des flottants lorsqu'ils peuvent provoquer des erreurs d'arrondi.

---

# 46. TESTS GENIUSPAY

Avec `MockPaymentService`, tester :

1. création d'une transaction ;
2. paiement réussi ;
3. paiement échoué ;
4. paiement annulé ;
5. webhook valide ;
6. webhook invalide ;
7. webhook dupliqué ;
8. mauvais montant ;
9. mauvaise transaction ;
10. crédit ajouté une seule fois ;
11. remboursement ;
12. absence de crédits en cas d'échec.

Lorsque les credentials GeniusPay réels seront disponibles, prévoir des tests d'intégration séparés.

---

# 47. STOCKAGE

Les photos et documents ne doivent pas être stockés inutilement dans localStorage.

Préparer :
`StorageService`

pour :
- photos ;
- PDF ;
- signatures ;
- logos ;
- documents.

Le stockage peut être local/mock en développement puis évoluer vers un stockage objet en production.

---

# 48. SÉCURITÉ GÉNÉRALE

Règles obligatoires :
- aucune clé Gemini dans le frontend ;
- aucune clé paiement secrète dans le frontend ;
- aucune clé database dans le frontend ;
- validation backend ;
- authentification ;
- autorisation ;
- isolation des utilisateurs ;
- validation des fichiers ;
- limitation des requêtes sensibles ;
- protection des endpoints IA ;
- protection des endpoints paiement.

---

# 49. API

Architecture :

```text
React
↓
API Client
↓
Backend
↓
Services
↓
Repositories
↓
Database
```

Les composants React ne doivent pas accéder directement à la base de données.

---

# 50. GESTION DES ERREURS

Chaque opération importante doit gérer :
- loading ;
- success ;
- error ;
- retry.

Messages utilisateur en français.

Ne jamais laisser une erreur réseau casser silencieusement l'application.

---

# 51. OFFLINE

Le mode offline doit être progressif.

Les données locales existantes peuvent continuer à fonctionner.

Préparer IndexedDB si nécessaire.

Ne jamais afficher "synchronisé" si les données ne sont pas réellement envoyées au serveur.

---

# 52. TESTS

Mettre progressivement en place :

```text
Vitest
+
Testing Library
```

Tester en priorité :
- calculations.ts ;
- voiceParser.ts ;
- AI parsing ;
- validation JSON ;
- crédits ;
- conversion devis → facture ;
- TVA ;
- remises ;
- génération PDF ;
- services backend.

---

# 53. TESTS VOCAUX

Créer des tests avec :

```text
"Ajoute cinq sacs de ciment à 6500 francs."
```

```text
"Ajoute dix barres de fer de 3500 francs."
```

```text
"Modifie le ciment à 8 sacs."
```

```text
"Supprime la peinture."
```

```text
"Ajoute 20 mètres de câble à 1500 francs le mètre."
```

Tester également les nombres écrits en toutes lettres.

---

# 54. TESTS IA

L'IA peut être non déterministe.

Tester principalement :
- schéma ;
- types ;
- contraintes ;
- business rules ;
- absence de valeurs inventées ;
- comportement en cas de données manquantes.

Ne pas dépendre uniquement d'une comparaison exacte de texte.

---

# 55. PERFORMANCE

Optimiser progressivement :
- chargement initial ;
- bundle ;
- images ;
- API ;
- requêtes DB ;
- rendu React ;
- PDF ;
- OCR ;
- upload ;
- transcription.

Utiliser lorsque pertinent :
- lazy loading ;
- code splitting ;
- cache ;
- pagination ;
- compression ;
- debouncing.

---

# 56. OBSERVABILITÉ

Préparer :
- logs backend ;
- suivi des erreurs ;
- monitoring ;
- métriques.

Ne jamais mettre de données sensibles dans les logs.

Pour l'IA, suivre notamment :
- nombre de générations ;
- durée ;
- succès ;
- erreurs ;
- crédits consommés.

---

# 57. ENVIRONNEMENTS

Préparer :

```text
development
staging
production
```

Variables possibles :

```env
DATABASE_URL=
GEMINI_API_KEY=
API_URL=
GENIUSPAY_API_KEY=
GENIUSPAY_SECRET_KEY=
GENIUSPAY_WEBHOOK_SECRET=
STORAGE_URL=
```

Ne jamais committer de secrets.

---

# 58. CI/CD

Préparer :

```text
install
↓
lint
↓
typecheck
↓
tests
↓
build
```

Le build ne doit être considéré comme valide que si les tests critiques passent.

---

# 59. DOCUMENTATION

Mettre à jour :

`README.md`

Documenter :
- architecture ;
- frontend ;
- backend ;
- API ;
- database ;
- IA ;
- voix ;
- crédits ;
- paiement GeniusPay ;
- stockage ;
- variables d'environnement ;
- tests ;
- PWA ;
- déploiement.

Ajouter :

`ARCHITECTURE.md`

si nécessaire.

---

# 60. STRATÉGIE DE MIGRATION

NE PAS effectuer toutes les modifications simultanément.

Ordre recommandé :

```text
1. Audit du repository réel
2. Stabilisation du frontend
3. Correction TypeScript
4. Tests des calculs
5. Tests du parser vocal
6. Refactoring progressif d'App.tsx
7. Routing
8. Repository Pattern
9. Backend
10. PostgreSQL
11. Authentification
12. Migration progressive des données
13. AIService backend
14. Gemini Vision/OCR réel
15. Gemini transcription
16. Gemini command parsing
17. Crédits backend
18. GeniusPay
19. Storage
20. PWA
21. Tests E2E
22. Performance
23. CI/CD
24. Production
```

---

# 61. RÈGLE SUR LES MOCKS

Toujours distinguer :

```text
REAL
MOCK
TODO
```

Ne jamais prétendre qu'une fonctionnalité est réellement connectée si elle est simulée.

---

# 62. RÈGLE ANTI-RÉGRESSION

Après chaque modification importante :

1. lancer les tests ;
2. lancer le build ;
3. vérifier les fonctionnalités existantes ;
4. vérifier le responsive ;
5. vérifier les erreurs console ;
6. vérifier les flux critiques.

Ne jamais accumuler plusieurs gros changements non testés.

---

# 63. RÈGLE DE DÉVELOPPEMENT IA

L'IA est un outil du produit et non une source de vérité absolue.

Pour toute donnée générée :

```text
IA
↓
Validation
↓
Business Rules
↓
Utilisateur
↓
Enregistrement
```

L'utilisateur doit pouvoir vérifier et corriger les données avant création définitive d'un devis ou d'une facture.

---

# 64. RÈGLE MÉTIER IMPORTANTE

Ne jamais laisser l'IA calculer aveuglément les totaux comme source de vérité.

Exemple :

```text
quantity = 5
unitPrice = 6500
```

Le backend calcule :

```text
total = 5 × 6500
```

et ne fait pas confiance à un total fourni par l'IA.

Même principe pour :
- TVA ;
- remises ;
- sous-total ;
- total final.

---

# 65. ARCHITECTURE IA FINALE

```text
                         ARCHIFACT
                             │
              ┌──────────────┴──────────────┐
              │                             │
           📷 PHOTO                      🎙️ VOIX
              │                             │
              ▼                             ▼
        Gemini Vision                Gemini Transcribe
              │                             │
              │                         Texte
              │                             │
              └──────────────┬──────────────┘
                             ▼
                       Gemini LLM
                             │
                             ▼
                      JSON STRUCTURÉ
                             │
                             ▼
                           ZOD
                             │
                             ▼
                    BUSINESS RULES
                             │
                             ▼
                    FORMULAIRE / ACTION
                             │
                             ▼
                       UTILISATEUR
                             │
                             ▼
                    DEVIS / FACTURE
```

Cette architecture doit être implémentée côté backend.

---

# 66. PREMIÈRE ACTION

NE COMMENCE PAS PAR UNE RÉÉCRITURE.

Commence par analyser le repository réel.

Produis d'abord un rapport technique court comprenant :

1. architecture actuelle ;
2. fichiers principaux ;
3. fonctionnalités déjà fonctionnelles ;
4. fonctionnalités mockées ;
5. intégration Gemini actuelle ;
6. intégration vocale actuelle ;
7. dépendances ;
8. problèmes critiques ;
9. risques de régression ;
10. plan de migration recommandé.

Ensuite seulement, commence l'implémentation étape par étape.

---

# 67. RÈGLE FINALE

À chaque étape, conserver les fonctionnalités existantes.

Le but n'est PAS de créer une nouvelle application.

Le but est de transformer progressivement le projet Google AI Studio existant en produit professionnel.

Le résultat final doit être une application web full-stack moderne, responsive, PWA, sécurisée, testable et scalable avec :

- génération de devis par photo ;
- génération de factures par photo ;
- création d'articles par photo ;
- commandes vocales ;
- transcription vocale ;
- compréhension IA ;
- crédits IA ;
- paiement GeniusPay ;
- génération PDF ;
- gestion clients ;
- gestion articles ;
- gestion devis ;
- gestion factures ;
- authentification ;
- backend ;
- base PostgreSQL ;
- stockage ;
- monitoring ;
- tests ;
- CI/CD.

**PRIORITÉ ABSOLUE : préserver l'existant, améliorer progressivement l'architecture et éviter les régressions.**

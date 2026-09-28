<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1493d6c9-91e1-470f-a6e4-20650962fe03

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Crédits IA centralisés

Le portefeuille de crédits est piloté par le backend Express et Supabase. Le frontend ne conserve ni ne modifie le solde : il lit `GET /api/me/credits`, réserve une opération via `POST /api/credits/reserve` et utilise le catalogue serveur `GET /api/credits/plans`.

Appliquer `supabase/migrations/202609270001_credit_wallet.sql` avant de démarrer le backend. Cette migration crée les plans, coûts d'opérations, ledger, réservations atomiques, trigger d'initialisation et fonctions RPC protégées.

Le backend exige `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. GeniusPay reste désactivé tant que `GENIUSPAY_API_URL`, `GENIUSPAY_API_KEY` et `GENIUSPAY_WEBHOOK_SECRET` ne sont pas configurés ; les crédits ne sont ajoutés que par le webhook signé et idempotent.

## Authentification OTP et Google

La connexion utilise `supabase.auth.signInWithOtp` puis `verifyOtp`, et crée automatiquement les nouveaux comptes. Le bouton Google utilise le fournisseur OAuth Google de Supabase. Configure dans Supabase Auth :

1. un domaine de redirection autorisé correspondant à `http://localhost:3000` en développement et à l’URL de production ;
2. le fournisseur Google avec son Client ID et son Client Secret ;
3. un **Send Email Hook** pointant vers `POST /auth/hooks/send-email`, avec un secret partagé `AUTH_HOOK_SECRET`.

Le frontend utilise `VITE_AUTH_REDIRECT_URL` lorsqu’elle est définie, sinon l’origine courante du navigateur. Cette URL doit être ajoutée aux redirections autorisées Supabase et aux origines JavaScript autorisées dans Google Cloud.

Le hook envoie les codes OTP à Resend avec `RESEND_API_KEY`, `RESEND_FROM_EMAIL` et `RESEND_FROM_NAME`. Le sujet et le contenu distinguent les actions `signup` et `signin` sans exposer l’existence d’un compte au navigateur. Le domaine d’envoi doit être vérifié dans Resend. À défaut du hook, configure le SMTP personnalisé Supabase avec les identifiants SMTP Resend et personnalise le template OTP Supabase.

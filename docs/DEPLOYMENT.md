# Guide de Déploiement

Ce document détaille les étapes pour déployer l'application **Pop Placard** en production.

## Prérequis

*   Un compte **GitHub** (pour héberger le code).
*   Un compte **Vercel** ou **Netlify** (pour l'hébergement frontend).
*   Un projet **Supabase** (pour la base de données et l'authentification).
*   Un compte **Sentry** (optionnel, pour le monitoring).

## Variables d'Environnement

Les variables suivantes sont nécessaires pour que l'application fonctionne. Elles doivent être configurées dans l'interface de votre hébergeur (Vercel/Netlify), et **JAMAIS** dans le code source commité.

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL de votre projet Supabase (ex: `https://xyz.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme de Supabase. |
| `VITE_SENTRY_DSN` | (Optionnel) DSN Sentry pour le tracking des erreurs. |

*Un fichier `.env.example` est disponible à la racine pour référence locale.*

## Déploiement sur Vercel (Recommandé)

1.  Poussez votre code sur GitHub.
2.  Connectez-vous à Vercel et cliquez sur "Add New Project".
3.  Importez votre dépôt GitHub `pop-placard`.
4.  Dans la section **Environment Variables**, ajoutez les variables listées ci-dessus.
5.  Laissez les paramètres de build par défaut :
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Install Command**: `npm install`
6.  Cliquez sur **Deploy**.

## Optimisations de Production

*   **Compression** : Vercel active automatiquement la compression Gzip/Brotli.
*   **Cache** : Les fichiers statiques dans `assets/` sont hashés pour un cache long terme.
*   **Sécurité** : Assurez-vous que vos règles RLS Supabase sont actives et testées.

## Vérification Post-Déploiement

1.  Accédez à l'URL fournie par Vercel.
2.  Ouvrez la console développeur (F12).
3.  Vérifiez qu'il n'y a pas d'erreurs de connexion Supabase (401/403).
4.  Testez le login et une fonctionnalité de base (ex: liste des produits).

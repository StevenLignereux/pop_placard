# Pop Placard - Gestion de Stocks Secours Populaire

Application de gestion de stocks pour le Secours Populaire Français, développée avec React, TypeScript, Vite, Supabase et TanStack Query.

## 🚀 Fonctionnalités Clés
- **Gestion des Produits** : Création, modification, archivage, alertes de stock.
- **Mouvements de Stock** : Entrées (réceptions) et Sorties (distributions) tracées.
- **Rapports** : Génération de PDF mensuels, statistiques en temps réel.
- **Sécurité** : Authentification, RLS (Row Level Security), Audit Logs.
- **Performance** : Pagination serveur, mise en cache, chargement optimisé.
- **Robustesse** : Gestion des erreurs globale (Error Boundary) et monitoring.

## 🛠️ Stack Technique
- **Frontend** : React 18, TypeScript, Tailwind CSS
- **State Management** : Zustand (Auth), TanStack Query (Server State)
- **Backend** : Supabase (PostgreSQL, Auth, Edge Functions)
- **Testing** : Vitest, React Testing Library
- **Monitoring** : Sentry

## 🚦 Prérequis
- Node.js >= 18
- Compte Supabase
- Compte Sentry (pour le monitoring en production)

## 📦 Installation

1. Cloner le projet :
   ```bash
   git clone https://github.com/votre-org/pop-placard.git
   cd pop-placard
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer les variables d'environnement :
   Créer un fichier `.env` à la racine (voir `.env.example` s'il existe) :
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anon
   VITE_SENTRY_DSN=votre_dsn_sentry
   ```

4. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

## 🧪 Tests
L'application dispose d'une suite de tests unitaires et d'intégration.

- Lancer tous les tests : `npm run test`
- Lancer avec rapport de couverture : `npm run test:coverage`

## 🚨 Monitoring & Crash Reporting (Sentry)
L'application intègre **Sentry** pour le suivi des erreurs en production.

### En cas de crash utilisateur (Écran rouge) :
1. L'utilisateur voit un écran "Une erreur est survenue" avec un **Code erreur support** (ex: `CRASH-L4K2J5`).
2. Ce code correspond à un événement dans Sentry, mais l'erreur est surtout identifiable par le contexte et la stack trace envoyée automatiquement.
3. Pour retrouver l'erreur dans Sentry :
   - Allez dans le projet `pop-placard`.
   - Filtrez par `error.type` ou recherchez les erreurs récentes.
   - Les erreurs interceptées par l'Error Boundary ont le tag `mechanism: error_boundary`.

### Configuration Sentry :
- Le DSN est défini dans `src/sentry.ts` via `import.meta.env.VITE_SENTRY_DSN`.
- En développement (`npm run dev`), le taux d'échantillonnage (`tracesSampleRate`) est de 100%.
- En production (`npm run build`), il est réduit à 10% pour les performances.
- Les données personnelles (IP) sont anonymisées avant envoi.

## 📚 Documentation Technique
- [Migration Performance & TanStack Query](./docs/MIGRATION_PERFORMANCE.md)
- [Gestion Sécurisée des Administrateurs](./docs/ADMIN_MANAGEMENT.md)

## 🔐 Sécurité
- **Authentification** : Gérée par Supabase Auth.
- **Rôles** : L'attribution automatique du rôle `admin` est désactivée. Voir la [procédure de gestion](./docs/ADMIN_MANAGEMENT.md).
- **Audit** : Toutes les modifications de rôles sont tracées dans `audit_logs`.

## 🤝 Contribution
1. Créer une branche pour votre fonctionnalité (`git checkout -b feat/ma-feature`).
2. Commiter vos changements (`git commit -m 'feat: ajout de ma feature'`).
3. Pousser vers la branche (`git push origin feat/ma-feature`).
4. Ouvrir une Pull Request.

# Plan de préparation à la mise en production - Pop Placard

**Date de création :** 24 Février 2026  
**Version :** 1.0  
**Statut du document :** Ébauche initiale

Ce document détaille l'ensemble des tâches critiques et importantes à réaliser avant le déploiement final de l'application **Pop Placard** en production. Il sert de référence pour le suivi de l'avancement et la validation de la qualité.

---

## 1. Sécurité & Conformité

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| SEC-01 | **Audit des politiques RLS Supabase** | Vérifier manuellement que l'accès anonyme est bloqué et que les règles d'écriture sont strictes (admin only). | 🔴 Critique | Tech Lead | 0.5 | À faire | J+1 |
| SEC-02 | **Sécurisation du Trigger d'inscription** | Désactiver ou sécuriser la fonction `handle_new_user` qui promeut automatiquement le premier inscrit en Admin. | 🟠 Majeur | Backend Dev | 0.5 | À faire | J+2 |
| SEC-03 | **Revue des dépendances (Audit npm)** | Lancer `npm audit` et corriger les vulnérabilités critiques dans les paquets tiers. | 🟡 Mineur | Dev Team | 0.2 | À faire | J+3 |
| SEC-04 | **Conformité RGPD** | Vérifier que les données utilisateurs (email, nom) sont traitées conformément au RGPD (droit à l'oubli, export). Ajouter une politique de confidentialité accessible. | 🟠 Majeur | PO / Legal | 1.0 | À faire | J+5 |
| SEC-05 | **Gestion des Secrets** | Vérifier que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont injectés via les variables d'environnement de l'hébergeur et absents du code source. | 🔴 Critique | DevOps | 0.2 | À faire | J+1 |

## 2. Qualité & Tests

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| QAL-01 | **Mise en place de l'environnement de test** | Installer et configurer **Vitest** et **React Testing Library**. | 🔴 Critique | Lead Dev | 0.5 | À faire | J+2 |
| QAL-02 | **Tests Unitaires (Logique Métier)** | Écrire les tests pour `src/lib/utils.ts` (calculs de stocks, formatage) et les hooks personnalisés. | 🔴 Critique | Dev Team | 1.0 | À faire | J+3 |
| QAL-03 | **Tests d'Intégration (Auth)** | Tester le flux complet de connexion/déconnexion et la persistance de session dans `authStore.ts`. | 🟠 Majeur | Dev Team | 1.0 | À faire | J+4 |
| QAL-04 | **Tests de Composants Critiques** | Tester les formulaires `StockEntry` et `StockDistribution` (validation, soumission). | 🟠 Majeur | Dev Team | 1.5 | À faire | J+5 |
| QAL-05 | **Revue de Code Complète** | Relire l'intégralité du code pour éliminer les `any`, `@ts-ignore` et code mort. | 🟡 Mineur | Tech Lead | 1.0 | À faire | J+4 |

## 3. Performance & Optimisation

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| PERF-01 | **Filtrage & Pagination Serveur** | Remplacer le chargement de *tous* les produits (`.select('*')`) par une pagination et recherche via Supabase (`.range()`, `.ilike()`). | 🔴 Critique | Backend Dev | 1.5 | À faire | J+3 |
| PERF-02 | **Mise en cache (React Query)** | Implémenter **TanStack Query** pour gérer le cache des produits et éviter les re-téléchargements inutiles. | 🟠 Majeur | Frontend Dev | 1.5 | À faire | J+4 |
| PERF-03 | **Optimisation du Build** | Analyser le bundle (`vite-bundle-visualizer`) et activer la compression Gzip/Brotli. | 🟡 Mineur | DevOps | 0.5 | À faire | J+6 |
| PERF-04 | **Lazy Loading** | Mettre en place le `React.lazy` pour les pages administratives peu fréquentées (`AuditLogs`, `Users`). | 🟡 Mineur | Frontend Dev | 0.5 | À faire | J+6 |

## 4. Robustesse & Monitoring

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| ROB-01 | **Error Boundary Globale** | Installer `react-error-boundary` pour capturer les crashs React et afficher une page d'erreur conviviale au lieu d'un écran blanc. | 🟠 Majeur | Frontend Dev | 0.5 | À faire | J+2 |
| ROB-02 | **Monitoring & Alerting** | Intégrer **Sentry** (ou équivalent) pour tracker les erreurs JS et les problèmes de performance en production. | 🟠 Majeur | DevOps | 0.5 | À faire | J+5 |
| ROB-03 | **Logging des Erreurs Critiques** | S'assurer que les erreurs critiques (échec auth, perte de données) sont remontées et non juste affichées en console. | 🟡 Mineur | Dev Team | 0.5 | À faire | J+5 |

## 5. DevOps & Déploiement

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| OPS-01 | **Configuration CI/CD** | Créer un workflow GitHub Actions pour lancer le Lint, Typecheck et les Tests à chaque Push/PR. | 🟠 Majeur | DevOps | 0.5 | À faire | J+3 |
| OPS-02 | **Environnements (Staging/Prod)** | Séparer clairement les projets Supabase pour le développement (Staging) et la Production. | 🔴 Critique | DevOps | 0.5 | À faire | J+4 |
| OPS-03 | **Playbook de Déploiement** | Rédiger la procédure pas-à-pas pour déployer une nouvelle version (migration DB, build front, invalidation cache). | 🟡 Mineur | Tech Lead | 0.5 | À faire | J+7 |
| OPS-04 | **Plan de Rollback** | Définir la procédure pour revenir à la version précédente en cas d'incident critique post-déploiement. | 🟡 Mineur | DevOps | 0.2 | À faire | J+7 |
| OPS-05 | **Stratégie de Backup** | Activer et vérifier les sauvegardes automatiques (PITR) de la base de données Supabase. | 🔴 Critique | DevOps | 0.2 | À faire | J+1 |

## 6. Documentation

| ID | Tâche | Description | Priorité | Responsable | Est. (j) | Statut | Échéance |
|:---|:---|:---|:---|:---|:---|:---|:---|
| DOC-01 | **Guide d'Administration** | Rédiger un guide pour les admins : gestion des utilisateurs, correction des stocks, lecture des logs. | 🟡 Mineur | PO | 1.0 | À faire | J+8 |
| DOC-02 | **Guide de Maintenance** | Documenter l'architecture technique, les dépendances clés et les procédures de mise à jour. | 🟡 Mineur | Lead Dev | 0.5 | À faire | J+8 |

---

**Légende des priorités :**
*   🔴 **Critique** : Bloque la mise en production.
*   🟠 **Majeur** : Risque important, workaround nécessaire si non corrigé.
*   🟡 **Mineur** : Peut être traité après la mise en production initiale (dette technique).

**Approbation pour mise en production :**
*   [ ] Tech Lead
*   [ ] Product Owner
*   [ ] Responsable Sécurité

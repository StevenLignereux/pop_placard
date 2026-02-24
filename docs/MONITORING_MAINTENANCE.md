# Guide de Monitoring et Maintenance

Ce document décrit les procédures de surveillance, de gestion des erreurs et de sauvegarde pour l'application **Pop Placard**.

## 1. Monitoring & Logging (Sentry)

L'application utilise **Sentry** pour le suivi des erreurs et des performances.

### Configuration Actuelle
L'intégration est configurée dans `src/sentry.ts` avec les fonctionnalités suivantes :
*   **Error Tracking** : Capture automatique des exceptions non gérées et des erreurs React (via Error Boundary).
*   **Performance Monitoring** : Tracage des transactions (navigation, requêtes XHR) avec un taux d'échantillonnage de 10% en production (`tracesSampleRate: 0.1`).
*   **Session Replay** : Enregistrement vidéo des sessions utilisateur en cas d'erreur (`replaysOnErrorSampleRate: 1.0`).
*   **Confidentialité (RGPD)** : Les adresses IP des utilisateurs sont supprimées des logs via le hook `beforeSend`.

### Actions Requises sur le Dashboard Sentry

1.  **Alertes Automatisées** :
    *   Allez dans **Alerts** > **Create Alert**.
    *   Créez une règle pour les "High Impact Issues" (ex: plus de 10 événements en 5 minutes).
    *   Configurez les notifications (Email, Slack, etc.) pour l'équipe technique.

2.  **Tableaux de Bord (Performance)** :
    *   Utilisez la vue **Performance** pour suivre :
        *   **LCP (Largest Contentful Paint)** : Temps de chargement visuel.
        *   **FID (First Input Delay)** : Réactivité de l'interface.
        *   **Failure Rate** : Taux d'échec des requêtes API.

3.  **Filtrage du Bruit** :
    *   Dans **Project Settings** > **Inbound Filters**, activez les filtres pour les erreurs connues des navigateurs (ex: extensions, erreurs réseau génériques).

## 2. Sauvegardes et Récupération (Supabase)

Pour garantir la sécurité des données critiques de stock, la configuration suivante est recommandée sur Supabase.

### Activation du Point-in-Time Recovery (PITR)
*Cette fonctionnalité nécessite l'offre Pro de Supabase.*

1.  Allez dans le **Dashboard Supabase** > **Project Settings** > **Database** > **Backups**.
2.  Activez **Point in Time Recovery (PITR)**.
3.  Vérifiez que la rétention est définie sur au moins **30 jours**.

### Procédure de Restauration d'Urgence (Disaster Recovery)

En cas de corruption de données ou de suppression accidentelle :

1.  **Identifier l'incident** : Notez l'heure exacte de l'incident (UTC).
2.  **Arrêter l'application** : Si possible, mettez l'application en mode maintenance pour éviter de nouvelles écritures.
3.  **Restaurer** :
    *   Dans le Dashboard Supabase > **Backups**.
    *   Sélectionnez une date et une heure juste avant l'incident.
    *   Cliquez sur **Restore**.
    *   *Attention : Cela écrasera la base de données actuelle.*
4.  **Vérifier** : Une fois la restauration terminée, vérifiez l'intégrité des données via l'interface ou des requêtes SQL.
5.  **Relancer** : Réactivez l'accès à l'application.

### Tests de Restauration
Il est recommandé de tester la procédure de restauration une fois par trimestre sur un **projet clone** (ne jamais tester sur la production).

1.  Clonez votre projet de production.
2.  Effectuez une restauration PITR sur le clone.
3.  Vérifiez que les données sont cohérentes.

## 3. Maintenance Régulière

*   **Mises à jour de sécurité** : Vérifiez mensuellement les vulnérabilités des dépendances npm (`npm audit`).
*   **Rotation des clés** : Changez les clés API (Supabase, Sentry) tous les 6 mois ou en cas de départ d'un membre de l'équipe admin.

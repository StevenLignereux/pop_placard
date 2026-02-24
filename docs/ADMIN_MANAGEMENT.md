# Gestion des Administrateurs et Sécurité des Rôles

## ⚠️ Avertissement de Sécurité
**L'attribution automatique du rôle `admin` a été désactivée** pour des raisons de sécurité. Aucun nouvel utilisateur ne peut obtenir les privilèges d'administration sans une intervention manuelle explicite.

## Procédure de Création d'un Administrateur

### 1. Via l'Interface Application (Recommandé)
Seuls les administrateurs existants peuvent promouvoir d'autres utilisateurs.

1. Connectez-vous avec un compte administrateur existant.
2. Accédez à la page **Gestion des Utilisateurs**.
3. Identifiez l'utilisateur à promouvoir (il doit s'être inscrit au préalable).
4. Cliquez sur l'icône **Bouclier** (Promouvoir admin).
5. Confirmez l'action dans la modale de sécurité.

### 2. Via le Dashboard Supabase (Accès Urgence / Premier Admin)
Si aucun administrateur n'existe (ex: nouvelle installation) ou en cas de perte d'accès, utilisez le dashboard Supabase.

1. Accédez à votre projet sur [Supabase Dashboard](https://supabase.com/dashboard).
2. Allez dans **Table Editor** > Table `users`.
3. Trouvez l'utilisateur concerné (filtrez par email).
4. Modifiez la colonne `role` de `volunteer` à `admin`.
5. Sauvegardez les changements.

**Note :** Cette action est tracée dans les logs de Supabase mais pas dans les `audit_logs` de l'application.

## Politique de Sécurité

### Authentification à Deux Facteurs (2FA)
Il est **fortement recommandé** d'activer la 2FA pour tous les comptes administrateurs via le dashboard Supabase (Auth > Providers > Phone/MFA).

### Monitoring
Toute modification de rôle via l'application génère une entrée dans la table `audit_logs` avec l'action `update_role`.
*   **Qui** a fait la modification (admin connecté).
*   **Cible** de la modification.
*   **Ancien et Nouveau** rôle.

### Désactivation d'Urgence
En cas de compromission suspectée d'un compte admin :
1. Un autre administrateur doit immédiatement désactiver le compte via la page Utilisateurs (Bouton "Désactiver").
2. Si impossible, passez par le Dashboard Supabase > Auth > Users > Ban User.

## Vérification Technique
Le trigger `handle_new_user` (fichier `supabase/migrations/20250224000000_secure_user_creation.sql`) force désormais le rôle `volunteer` pour toute nouvelle inscription, quel que soit le payload envoyé par le client.

-- Migration pour sécuriser la création des utilisateurs
-- Objectif : Supprimer l'attribution automatique du rôle 'admin' au premier utilisateur
-- Cela prévient la prise de contrôle du système si la table des utilisateurs est vide

-- Redéfinition de la fonction handle_new_user sans la logique "premier utilisateur = admin"
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insertion sécurisée : tout nouvel utilisateur est 'volunteer' par défaut
  -- Le rôle 'admin' ne peut plus être attribué automatiquement
  -- Le statut is_active est true par défaut pour les bénévoles (à modifier si modération souhaitée)
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.email), 
    'volunteer', -- Force le rôle volunteer, ignore les métadonnées ou la position
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérification : Le trigger existe déjà et utilise cette fonction, 
-- donc la mise à jour de la fonction prend effet immédiatement pour les prochains inserts.

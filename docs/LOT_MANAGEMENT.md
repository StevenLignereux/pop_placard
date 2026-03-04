# Gestion des Numéros de Lots

Cette fonctionnalité permet de suivre les numéros de lots associés à chaque produit pour une meilleure traçabilité.

## Accès à la fonctionnalité

1.  Connectez-vous à l'application.
2.  Accédez à l'onglet **Produits** via le menu latéral.
3.  Dans la liste des produits, une nouvelle colonne **Lots** est disponible.

## Ajouter un numéro de lot

1.  Repérez le produit pour lequel vous souhaitez ajouter un lot.
2.  Cliquez sur le bouton **Gérer les lots** (icône de couches) dans la colonne "Lots".
3.  Une fenêtre modale s'ouvre.
4.  Dans le champ "Nouveau numéro de lot", saisissez le numéro.
    *   **Format** : Alphanumérique uniquement (lettres et chiffres).
    *   **Longueur** : Maximum 20 caractères.
5.  Cliquez sur le bouton **Ajouter**.
6.  Si le numéro est valide et n'existe pas déjà pour ce produit, il s'ajoute à la liste en dessous.

## Visualiser les lots existants

Dans la fenêtre "Gérer les lots", la liste des lots actifs pour le produit est affichée avec leur numéro.

## Supprimer un numéro de lot

1.  Ouvrez la fenêtre de gestion des lots pour le produit concerné.
2.  Dans la liste des lots existants, cliquez sur l'icône de **corbeille** à côté du lot à supprimer.
3.  Le lot est immédiatement retiré de la liste.

## Impact sur les Rapports

Les rapports mensuels (PDF et CSV) ont été mis à jour pour refléter cette nouvelle gestion :

*   **Colonne "N° Lot"** : Cette colonne liste désormais l'ensemble des lots **actifs** définis dans la fiche produit (via l'onglet Produits), au lieu de reprendre la référence saisie lors de l'entrée de stock.
*   **Colonne "Référence" (CSV)** : Continue d'afficher la référence saisie lors de l'entrée de stock (ex: numéro de Bon de Livraison).

## Transition et Bonnes Pratiques

*   **Saisie des Entrées** : Le champ "Référence" dans le formulaire d'entrée de stock doit désormais être utilisé préférentiellement pour le numéro de Bon de Livraison (BL) ou une référence fournisseur, et non plus pour le numéro de lot.
*   **Création de Lots** : Pensez à créer les nouveaux numéros de lots dans l'onglet **Produits** dès leur réception physique, afin qu'ils apparaissent correctement dans les rapports.

## Règles de gestion

*   **Unicité** : Un même numéro de lot ne peut pas être ajouté deux fois pour le même produit.
*   **Format** : Les caractères spéciaux et les espaces ne sont pas autorisés.

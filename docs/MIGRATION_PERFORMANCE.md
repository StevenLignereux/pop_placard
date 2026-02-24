# Optimisation des Performances et Migration vers TanStack Query

Ce document détaille la refonte technique effectuée pour résoudre les problèmes de scalabilité dans la gestion des produits et des stocks.

## Problème Initial
L'application chargeait l'intégralité de la base de données produits côté client (`.select('*')`) pour effectuer le filtrage et la pagination en JavaScript.
*   **Impact** : Temps de chargement exponentiel avec le volume de données, consommation mémoire excessive, UX dégradée.
*   **Risque** : Crash du navigateur au-delà de 5000 produits.

## Solution Implémentée

### 1. Architecture Technique
*   **Bibliothèque** : @tanstack/react-query (v5)
*   **Stratégie** : Server-Side Pagination & Filtering
*   **Cache** : Stale-while-revalidate (5 minutes par défaut)

### 2. Nouveaux Hooks (`src/hooks/useProducts.ts`)

#### `useProducts`
Hook principal pour la liste des produits (utilisé dans `Products.tsx`).
*   **Fonctionnalités** :
    *   Pagination (`page`, `pageSize`)
    *   Recherche textuelle (`search` -> `.ilike()`)
    *   Tri (`sortBy`, `sortOrder`)
*   **Optimisations** :
    *   `keepPreviousData: true` : Évite le clignotement lors du changement de page.
    *   `count: 'exact'` : Récupère le nombre total d'éléments pour la pagination.

#### `useInfiniteProducts`
Hook léger pour les sélecteurs (utilisé dans `StockDistribution.tsx`).
*   **Fonctionnalités** :
    *   Recherche en temps réel
    *   Limite à 20 résultats pour la performance
    *   Sélection uniquement des champs nécessaires (`id`, `name`, `stock`, `unit`)

### 3. Migration des Composants

#### `Products.tsx` (Liste)
*   Remplacement de `useEffect` + `useState` par `useProducts`.
*   Implémentation de la pagination UI (Boutons Précédent/Suivant).
*   La recherche déclenche maintenant une nouvelle requête API optimisée au lieu de filtrer un tableau local.

#### `StockDistribution.tsx` (Formulaire)
*   Remplacement du chargement massif par `useInfiniteProducts`.
*   La liste déroulante filtre dynamiquement via l'API lors de la saisie.
*   `invalidateQueries` est appelé après une distribution pour mettre à jour le stock instantanément dans toute l'app.

## Guide d'Utilisation

### Ajouter une nouvelle requête
1.  Créer une fonction de fetch dans `src/lib/api.ts` ou directement dans le hook.
2.  Utiliser `useQuery` avec une clé unique.

```typescript
export const useProductDetails = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
  });
};
```

### Invalider le cache (Rafraîchir les données)
Après une mutation (création, modification, suppression), invalider la clé correspondante :

```typescript
const queryClient = useQueryClient();
// ...
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['products'] });
}
```

## Résultats Attendus
*   **Temps de chargement** : Constant (< 200ms) quel que soit le volume de données total.
*   **Bande passante** : Réduite de 90% (ne charge que 10 items à la fois).
*   **Expérience Utilisateur** : Navigation fluide, recherche réactive, pas de freeze.


import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import LotManagerModal from '../components/LotManagerModal';
import { useToast } from '../components/Toast';
import { formatStockDisplay } from '../lib/utils';

const Products = () => {
  const { addToast } = useToast();
  
  // Pagination and Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  // Note: 'low_stock' filtering would require more complex backend logic or a specific RPC/view
  // For now, we'll focus on search and pagination as per requirements
  // const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  // React Query Hooks
  const { data: productsData, isLoading, isError, error } = useProducts({
    search: searchTerm,
    page,
    pageSize,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const deleteProductMutation = useDeleteProduct();

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Lot Manager modal state
  const [selectedProductForLots, setSelectedProductForLots] = useState<Product | null>(null);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProductMutation.mutateAsync(productToDelete);
      setProductToDelete(null);
      addToast('Produit supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      addToast('Erreur lors de la suppression du produit', 'error');
    }
  };

  // Pagination Logic
  const totalCount = productsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const products = productsData?.data || [];

  if (isError) {
    return (
      <div className="text-center py-10 text-red-600">
        Erreur lors du chargement des produits: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Produits</h1>
        
        <Link
          to="/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Nouveau Produit
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conditionnement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actuel
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lots
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.current_stock <= product.alert_threshold && (
                            <AlertTriangle className="ml-2 h-4 w-4 text-red-500" />
                          )}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.boxes_per_carton} {product.unit}(s) / carton
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          product.current_stock <= product.alert_threshold
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {formatStockDisplay(product.current_stock, product.boxes_per_carton, product.unit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col gap-1">
                          {product.lots && product.lots.length > 0 ? (
                            <span className="text-gray-700 font-medium">
                              {product.lots.length} lot(s)
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Aucun</span>
                          )}
                          <button
                            onClick={() => setSelectedProductForLots(product)}
                            className="text-primary hover:text-blue-900 text-xs font-medium flex items-center mt-1"
                          >
                            <Layers className="h-3 w-3 mr-1" />
                            Gérer les lots
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`/products/edit/${product.id}`}
                            className="text-primary hover:text-blue-900 mr-4"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{(page - 1) * pageSize + 1}</span> à <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> sur <span className="font-medium">{totalCount}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Précédent</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {/* Simple pagination logic: show current page */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {page} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Suivant</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ? Il sera archivé et ne sera plus visible dans la liste."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
      />

      <LotManagerModal
        isOpen={!!selectedProductForLots}
        onClose={() => setSelectedProductForLots(null)}
        product={selectedProductForLots}
      />
    </div>
  );
};

export default Products;

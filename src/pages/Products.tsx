
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { useAuthStore } from '../store/authStore';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
import { formatStockDisplay } from '../lib/utils';

const Products = () => {
  const { user } = useAuthStore();
  // const isAdmin = user?.role === 'admin'; // Removed admin restriction
  const { addToast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('Erreur lors du chargement des produits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false } as never)
        .eq('id', productToDelete);

      if (error) throw error;
      
      // Optimistic update
      setProducts(products.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      addToast('Produit supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      addToast('Erreur lors de la suppression du produit', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'low_stock' && product.current_stock <= product.alert_threshold);
    return matchesSearch && matchesFilter;
  });

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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filtrer par:
          </label>
          <select
            id="filter"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
          >
            <option value="all">Tous les produits</option>
            <option value="low_stock">Stock faible</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Aucun produit trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
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
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ? Il sera archivé et ne sera plus visible dans la liste."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Products;

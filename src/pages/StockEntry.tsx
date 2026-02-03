import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { Search, Package, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const StockEntry = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    product_id: '',
    cartons: 1,
    reference: '',
    notes: '',
  });

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const totalUnits = selectedProduct ? formData.cartons * selectedProduct.boxes_per_carton : 0;

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
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (id: string) => {
    setFormData(prev => ({ ...prev, product_id: id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) return;

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase.rpc('record_stock_movement', {
        p_product_id: formData.product_id,
        p_movement_type: 'entree',
        p_quantity: totalUnits,
        p_reference: formData.reference || null,
        p_notes: formData.notes || null,
      });

      if (error) throw error;

      addToast(`Entrée de ${totalUnits} ${selectedProduct?.unit}(s) enregistrée avec succès.`, 'success');
      
      // Reset form
      setFormData({
        product_id: '',
        cartons: 1,
        reference: '',
        notes: '',
      });
      setSearchTerm('');
      
      // Refresh products to get updated stock
      fetchProducts();
    } catch (error: any) {
      console.error('Error recording entry:', error);
      addToast('Erreur: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Saisie des Entrées de Stock</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            1. Sélectionner un produit
          </h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-md max-h-96 overflow-y-auto divide-y">
            {loading ? (
              <div className="p-4 text-center">Chargement...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Aucun produit trouvé.</div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    formData.product_id === product.id ? 'bg-blue-50 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    Stock actuel: {product.current_stock} {product.unit}(s) | 
                    Conditionnement: {product.boxes_per_carton} / carton
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Entry Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <Package className="h-5 w-5 mr-2 text-primary" />
            2. Détails de la réception
          </h2>

          {!selectedProduct ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <AlertCircle className="h-12 w-12 opacity-20" />
              <p>Veuillez sélectionner un produit</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Produit sélectionné:</p>
                <p className="text-lg font-bold text-primary">{selectedProduct.name}</p>
              </div>

              <div>
                <label htmlFor="cartons" className="block text-sm font-medium text-gray-700">
                  Nombre de cartons reçus
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="number"
                    id="cartons"
                    min="1"
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                    value={formData.cartons}
                    onChange={(e) => setFormData(prev => ({ ...prev, cartons: parseInt(e.target.value) || 1 }))}
                  />
                  <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                    = {totalUnits} {selectedProduct.unit}(s)
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                  Référence / Bon de livraison
                </label>
                <input
                  type="text"
                  id="reference"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes / Observations
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-success hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success transition-colors ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                {submitting ? 'Enregistrement...' : 'Valider la réception'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockEntry;

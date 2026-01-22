import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { Search, ShoppingBag, CheckCircle, AlertTriangle } from 'lucide-react';

const StockDistribution = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    beneficiary: '', // Stored in reference
    notes: '',
  });

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const remainingStock = selectedProduct ? selectedProduct.current_stock - formData.quantity : 0;
  const isStockInsufficient = remainingStock < 0;

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
        .gt('current_stock', 0) // Only show products with stock
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
    if (!formData.product_id || isStockInsufficient) return;

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase.rpc('record_stock_movement', {
        p_product_id: formData.product_id,
        p_movement_type: 'sortie',
        p_quantity: formData.quantity,
        p_reference: formData.beneficiary || null,
        p_notes: formData.notes || null,
      });

      if (error) throw error;

      alert(`Distribution de ${formData.quantity} ${selectedProduct?.unit}(s) enregistrée avec succès.`);
      
      // Reset form
      setFormData({
        product_id: '',
        quantity: 1,
        beneficiary: '',
        notes: '',
      });
      setSearchTerm('');
      
      // Refresh products
      fetchProducts();
    } catch (error: any) {
      console.error('Error recording distribution:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Enregistrement des Distributions</h1>

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
              <div className="p-4 text-center text-gray-500">Aucun produit disponible en stock.</div>
            ) : (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductSelect(product.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    formData.product_id === product.id ? 'bg-orange-50 border-l-4 border-secondary' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                      Stock: {product.current_stock}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {product.unit} | {product.boxes_per_carton} / carton
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Distribution Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-secondary" />
            2. Détails de la distribution
          </h2>

          {!selectedProduct ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingBag className="h-12 w-12 opacity-20" />
              <p>Veuillez sélectionner un produit</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-md border border-orange-100">
                <p className="text-sm text-orange-800 font-medium">Produit sélectionné:</p>
                <div className="flex justify-between items-end mt-1">
                  <p className="text-lg font-bold text-secondary">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock disponible: <span className="font-bold">{selectedProduct.current_stock}</span>
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantité distribuée ({selectedProduct.unit}s)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={selectedProduct.current_stock}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm py-2 border px-3"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                {isStockInsufficient ? (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Stock insuffisant ! (Manque: {Math.abs(remainingStock)})
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-green-600">
                    Stock restant après distribution: {remainingStock}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700">
                  Bénéficiaire / Famille (Optionnel)
                </label>
                <input
                  type="text"
                  id="beneficiary"
                  placeholder="Nom ou Numéro de dossier"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm py-2 border px-3"
                  value={formData.beneficiary}
                  onChange={(e) => setFormData(prev => ({ ...prev, beneficiary: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes / Observations
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-secondary focus:ring-secondary sm:text-sm py-2 border px-3"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isStockInsufficient}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-secondary hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors ${
                  (submitting || isStockInsufficient) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                {submitting ? 'Enregistrement...' : 'Valider la sortie'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDistribution;

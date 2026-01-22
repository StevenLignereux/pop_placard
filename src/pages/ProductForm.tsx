import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProductUnit } from '../lib/types';
import { ArrowLeft, Save } from 'lucide-react';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'boîte' as ProductUnit,
    boxes_per_carton: 1,
    current_stock: 0,
    alert_threshold: 10,
  });

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          description: data.description || '',
          unit: data.unit,
          boxes_per_carton: data.boxes_per_carton,
          current_stock: data.current_stock,
          alert_threshold: data.alert_threshold,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'boxes_per_carton' || name === 'current_stock' || name === 'alert_threshold' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            unit: formData.unit,
            boxes_per_carton: formData.boxes_per_carton,
            current_stock: formData.current_stock,
            alert_threshold: formData.alert_threshold,
          })
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            description: formData.description,
            unit: formData.unit,
            boxes_per_carton: formData.boxes_per_carton,
            current_stock: formData.current_stock,
            alert_threshold: formData.alert_threshold,
          }]);
        
        if (error) throw error;
      }
      
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de l\'enregistrement du produit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Modifier le Produit' : 'Nouveau Produit'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom du produit
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                Unité de base
              </label>
              <select
                id="unit"
                name="unit"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="boîte">Boîte</option>
                <option value="carton">Carton</option>
                <option value="kg">Kg</option>
                <option value="litre">Litre</option>
              </select>
            </div>

            <div>
              <label htmlFor="boxes_per_carton" className="block text-sm font-medium text-gray-700">
                Unités par carton
              </label>
              <input
                type="number"
                id="boxes_per_carton"
                name="boxes_per_carton"
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                value={formData.boxes_per_carton}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="current_stock" className="block text-sm font-medium text-gray-700">
                Stock Actuel (unités)
              </label>
              <input
                type="number"
                id="current_stock"
                name="current_stock"
                min="0"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                value={formData.current_stock}
                onChange={handleChange}
              />
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500">
                  Note: Pour les mouvements réguliers, utilisez les fonctions Entrées/Distributions.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="alert_threshold" className="block text-sm font-medium text-gray-700">
                Seuil d'alerte
              </label>
              <input
                type="number"
                id="alert_threshold"
                name="alert_threshold"
                min="0"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
                value={formData.alert_threshold}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

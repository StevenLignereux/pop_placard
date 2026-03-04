import React, { useState } from 'react';
import { Product, ProductLot } from '../lib/types';
import Modal from './Modal';
import { useCreateProductLot, useDeleteProductLot } from '../hooks/useProducts';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';

interface LotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const LotManagerModal: React.FC<LotManagerModalProps> = ({ isOpen, onClose, product }) => {
  const [newLotNumber, setNewLotNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();
  
  const createLotMutation = useCreateProductLot();
  const deleteLotMutation = useDeleteProductLot();

  const validateLotNumber = (lot: string) => {
    if (!lot) return 'Le numéro de lot est requis.';
    if (lot.length > 20) return 'Le numéro de lot ne doit pas dépasser 20 caractères.';
    if (!/^[a-zA-Z0-9]+$/.test(lot)) return 'Le numéro de lot doit être alphanumérique.';
    return null;
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const validationError = validateLotNumber(newLotNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await createLotMutation.mutateAsync({
        product_id: product.id,
        lot_number: newLotNumber,
      });
      setNewLotNumber('');
      setError(null);
      addToast('Numéro de lot ajouté avec succès', 'success');
    } catch (err: any) {
      if (err.message.includes('unique constraint')) {
        setError('Ce numéro de lot existe déjà pour ce produit.');
      } else {
        setError(err.message || "Une erreur est survenue lors de l'ajout du lot.");
      }
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    try {
      await deleteLotMutation.mutateAsync(lotId);
      addToast('Numéro de lot supprimé', 'success');
    } catch (err: any) {
      addToast("Erreur lors de la suppression du lot", 'error');
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gérer les lots - ${product.name}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Add Lot Form */}
        <form onSubmit={handleAddLot} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label htmlFor="lot_number" className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau numéro de lot
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="lot_number"
              value={newLotNumber}
              onChange={(e) => {
                setNewLotNumber(e.target.value);
                setError(null);
              }}
              placeholder="Ex: LOT123"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border px-3 py-2"
            />
            <button
              type="submit"
              disabled={createLotMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </button>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </form>

        {/* List of Lots */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Lots existants</h3>
          {(!product.lots || product.lots.length === 0) ? (
            <p className="text-sm text-gray-500 italic">Aucun numéro de lot enregistré.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border rounded-md overflow-hidden">
              {product.lots.map((lot: ProductLot) => (
                <li key={lot.id} className="px-4 py-3 flex justify-between items-center bg-white hover:bg-gray-50">
                  <span className="text-sm font-mono text-gray-900">{lot.lot_number}</span>
                  <button
                    onClick={() => handleDeleteLot(lot.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer ce lot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LotManagerModal;

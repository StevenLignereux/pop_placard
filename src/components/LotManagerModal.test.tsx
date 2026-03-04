import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LotManagerModal from './LotManagerModal';
import { Product } from '../lib/types';

// Mock hooks
const mockCreateLot = vi.fn();
const mockDeleteLot = vi.fn();
const mockAddToast = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useCreateProductLot: () => ({
    mutateAsync: mockCreateLot,
    isPending: false,
  }),
  useDeleteProductLot: () => ({
    mutateAsync: mockDeleteLot,
    isPending: false,
  }),
}));

vi.mock('./Toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

// Mock Modal since it uses portals and might be complex to test in isolation without setup
vi.mock('./Modal', () => ({
  default: ({ isOpen, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </div>
    );
  },
}));

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Produit Test',
  description: null,
  unit: 'boîte',
  boxes_per_carton: 1,
  current_stock: 10,
  alert_threshold: 5,
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  lots: [
    { id: 'lot-1', product_id: 'prod-1', lot_number: 'LOT001', created_at: '2023-01-01' },
    { id: 'lot-2', product_id: 'prod-1', lot_number: 'LOT002', created_at: '2023-01-01' },
  ],
};

describe('LotManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with existing lots', () => {
    render(<LotManagerModal isOpen={true} onClose={() => {}} product={mockProduct} />);
    
    expect(screen.getByRole('dialog', { name: /Gérer les lots - Produit Test/i })).toBeInTheDocument();
    expect(screen.getByText('LOT001')).toBeInTheDocument();
    expect(screen.getByText('LOT002')).toBeInTheDocument();
  });

  it('validates lot number input', async () => {
    const user = userEvent.setup();
    render(<LotManagerModal isOpen={true} onClose={() => {}} product={mockProduct} />);
    
    const input = screen.getByLabelText(/Nouveau numéro de lot/i);
    const submitBtn = screen.getByRole('button', { name: /Ajouter/i });

    // Empty
    await user.click(submitBtn);
    expect(screen.getByText(/Le numéro de lot est requis/i)).toBeInTheDocument();

    // Invalid chars
    await user.type(input, 'LOT-123'); // Hyphen not allowed in alphanumeric regex usually, let's check regex in component
    await user.click(submitBtn);
    expect(screen.getByText(/alphanumérique/i)).toBeInTheDocument();

    // Too long
    await user.clear(input);
    await user.type(input, 'A'.repeat(21));
    await user.click(submitBtn);
    expect(screen.getByText(/ne doit pas dépasser 20 caractères/i)).toBeInTheDocument();
  });

  it('adds a valid lot', async () => {
    const user = userEvent.setup();
    mockCreateLot.mockResolvedValue({});
    
    render(<LotManagerModal isOpen={true} onClose={() => {}} product={mockProduct} />);
    
    const input = screen.getByLabelText(/Nouveau numéro de lot/i);
    const submitBtn = screen.getByRole('button', { name: /Ajouter/i });

    await user.type(input, 'LOT003');
    await user.click(submitBtn);

    expect(mockCreateLot).toHaveBeenCalledWith({
      product_id: 'prod-1',
      lot_number: 'LOT003',
    });
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('succès'), 'success');
    expect(input).toHaveValue(''); // Should clear input
  });

  it('handles duplicate error', async () => {
    const user = userEvent.setup();
    mockCreateLot.mockRejectedValue(new Error('unique constraint violation'));
    
    render(<LotManagerModal isOpen={true} onClose={() => {}} product={mockProduct} />);
    
    const input = screen.getByLabelText(/Nouveau numéro de lot/i);
    await user.type(input, 'LOT001');
    await user.click(screen.getByRole('button', { name: /Ajouter/i }));

    expect(screen.getByText(/Ce numéro de lot existe déjà/i)).toBeInTheDocument();
  });

  it('deletes a lot', async () => {
    const user = userEvent.setup();
    mockDeleteLot.mockResolvedValue({});
    
    render(<LotManagerModal isOpen={true} onClose={() => {}} product={mockProduct} />);
    
    // Find delete button for first lot
    const deleteBtns = screen.getAllByTitle('Supprimer ce lot');
    await user.click(deleteBtns[0]);

    expect(mockDeleteLot).toHaveBeenCalledWith('lot-1');
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('supprimé'), 'success');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockEntry from './StockEntry';
import { supabase } from '../lib/supabase';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../components/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Pâtes',
    unit: 'kg',
    boxes_per_carton: 10,
    current_stock: 50,
    is_active: true,
  },
  {
    id: 'prod-2',
    name: 'Riz',
    unit: 'kg',
    boxes_per_carton: 5,
    current_stock: 20,
    is_active: true,
  },
];

describe('StockEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock response for products
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });
  });

  it('renders correctly and loads products', async () => {
    render(<StockEntry />);
    
    expect(screen.getByText('Saisie des Entrées de Stock')).toBeInTheDocument();
    expect(screen.getByText('1. Sélectionner un produit')).toBeInTheDocument();
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Pâtes')).toBeInTheDocument();
      expect(screen.getByText('Riz')).toBeInTheDocument();
    });
  });

  it('allows selecting a product and shows details form', async () => {
    render(<StockEntry />);
    
    await waitFor(() => {
      expect(screen.getByText('Pâtes')).toBeInTheDocument();
    });

    // Click on Pâtes
    fireEvent.click(screen.getByText('Pâtes'));

    // Check if details form appears
    expect(screen.getByText('2. Détails de la réception')).toBeInTheDocument();
    expect(screen.getByText('Produit sélectionné:')).toBeInTheDocument();
    // Use getAllByText because "Pâtes" appears in the list and in the selected details
    expect(screen.getAllByText('Pâtes').length).toBeGreaterThan(1);
    expect(screen.getByLabelText(/Nombre de cartons reçus/i)).toBeInTheDocument();
  });

  it('calculates total units correctly', async () => {
    const user = userEvent.setup();
    render(<StockEntry />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Pâtes'));
    });

    const cartonsInput = screen.getByLabelText(/Nombre de cartons reçus/i);
    
    // Default is 1 carton * 10 units = 10 units
    expect(screen.getByText(/=\s*10\s*kg\(s\)/)).toBeInTheDocument();

    // Clear input first
    await user.clear(cartonsInput);
    // Type new value
    await user.type(cartonsInput, '5');

    // 5 cartons * 10 units = 50 units
    expect(cartonsInput).toHaveValue(5);
    
    await waitFor(() => {
        expect(screen.getByText(/=\s*50\s*kg\(s\)/)).toBeInTheDocument();
    });
  });

  it('submits form correctly', async () => {
    const user = userEvent.setup();
    // Mock successful RPC call
    (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

    render(<StockEntry />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Pâtes'));
    });

    // Fill form
    const cartonsInput = screen.getByLabelText(/Nombre de cartons reçus/i);
    await user.clear(cartonsInput);
    await user.type(cartonsInput, '2');

    const refInput = screen.getByLabelText(/Référence/i);
    await user.type(refInput, 'REF-123');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Valider la réception/i });
    await user.click(submitBtn);

    // Verify RPC call
    expect(supabase.rpc).toHaveBeenCalledWith('record_stock_movement', {
      p_product_id: 'prod-1',
      p_movement_type: 'entree',
      p_quantity: 20, // 2 cartons * 10 units
      p_reference: 'REF-123',
      p_notes: null,
    });
  });

  it('filters products correctly', async () => {
    const user = userEvent.setup();
    render(<StockEntry />);
    
    await waitFor(() => {
      expect(screen.getByText('Pâtes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await user.type(searchInput, 'Riz');

    expect(screen.queryByText('Pâtes')).not.toBeInTheDocument();
    expect(screen.getByText('Riz')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockDistribution from './StockDistribution';
import { supabase } from '../lib/supabase';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
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

describe('StockDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock response for products
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProducts, error: null });
    const mockGt = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEq = vi.fn().mockReturnValue({ gt: mockGt });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });
  });

  it('renders correctly and loads products', async () => {
    render(<StockDistribution />);
    
    expect(screen.getByText('Enregistrement des Distributions')).toBeInTheDocument();
    expect(screen.getByText('1. Sélectionner un produit')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Pâtes')).toBeInTheDocument();
      expect(screen.getByText('Riz')).toBeInTheDocument();
    });
  });

  it('validates stock availability', async () => {
    const user = userEvent.setup();
    render(<StockDistribution />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Pâtes'));
    });

    const quantityInput = screen.getByLabelText(/Quantité distribuée/i);
    
    // Current stock is 50. Try to distribute 60.
    await user.clear(quantityInput);
    await user.type(quantityInput, '60');

    expect(screen.getByText(/Stock insuffisant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Valider la sortie/i })).toBeDisabled();

    // Try valid amount
    await user.clear(quantityInput);
    await user.type(quantityInput, '10');

    expect(screen.queryByText(/Stock insuffisant/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Valider la sortie/i })).not.toBeDisabled();
  });

  it('submits distribution correctly', async () => {
    const user = userEvent.setup();
    (supabase.rpc as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });

    render(<StockDistribution />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Pâtes'));
    });

    const quantityInput = screen.getByLabelText(/Quantité distribuée/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');

    const notesInput = screen.getByLabelText(/Notes/i);
    await user.type(notesInput, 'Distribution famille X');

    const submitBtn = screen.getByRole('button', { name: /Valider la sortie/i });
    await user.click(submitBtn);

    expect(supabase.rpc).toHaveBeenCalledWith('record_stock_movement', {
      p_product_id: 'prod-1',
      p_movement_type: 'sortie',
      p_quantity: 5,
      p_reference: null,
      p_notes: 'Distribution famille X',
    });
  });
});

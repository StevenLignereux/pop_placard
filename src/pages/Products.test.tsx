import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Products from './Products';
import { Product } from '../lib/types';

// Mock hooks
const mockUseProducts = vi.fn();
const mockDeleteProduct = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => mockUseProducts(),
  useDeleteProduct: () => ({
    mutateAsync: mockDeleteProduct,
    isPending: false,
  }),
  useCreateProductLot: () => ({ mutateAsync: vi.fn() }),
  useDeleteProductLot: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../components/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { role: 'admin' },
  }),
}));

// Mock LotManagerModal to check if it opens
vi.mock('../components/LotManagerModal', () => ({
  default: ({ isOpen, product, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label="Mock Lot Modal">
        <h1>Gérer les lots - {product?.name}</h1>
        <button onClick={onClose}>Fermer</button>
      </div>
    );
  },
}));

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Pâtes',
    description: null,
    unit: 'kg',
    boxes_per_carton: 10,
    current_stock: 50,
    alert_threshold: 10,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    lots: [
      { id: 'l1', product_id: 'prod-1', lot_number: 'L1', created_at: '2023' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Riz',
    description: null,
    unit: 'kg',
    boxes_per_carton: 5,
    current_stock: 20,
    alert_threshold: 5,
    is_active: true,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    lots: []
  },
];

describe('Products Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product list with lots column', () => {
    mockUseProducts.mockReturnValue({
      data: { data: mockProducts, count: 2 },
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(screen.getByText('Gestion des Produits')).toBeInTheDocument();
    expect(screen.getByText('Lots')).toBeInTheDocument(); // Column header
    expect(screen.getByText('1 lot(s)')).toBeInTheDocument(); // First product
    expect(screen.getByText('Aucun')).toBeInTheDocument(); // Second product
  });

  it('opens lot manager modal on click', () => {
    mockUseProducts.mockReturnValue({
      data: { data: mockProducts, count: 2 },
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    const manageBtns = screen.getAllByText('Gérer les lots');
    fireEvent.click(manageBtns[0]);

    expect(screen.getByRole('dialog', { name: 'Mock Lot Modal' })).toBeInTheDocument();
    expect(screen.getByText('Gérer les lots - Pâtes')).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByText('Fermer'));
    expect(screen.queryByRole('dialog', { name: 'Mock Lot Modal' })).not.toBeInTheDocument();
  });
});

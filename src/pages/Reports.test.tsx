import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Reports from './Reports';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock jsPDF with hoisted mocks to avoid reference errors
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  line: vi.fn(),
  setLineWidth: vi.fn(),
  autoTable: vi.fn(),
}));

vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      save = mocks.save;
      text = mocks.text;
      rect = mocks.rect;
      setFillColor = mocks.setFillColor;
      setTextColor = mocks.setTextColor;
      setFontSize = mocks.setFontSize;
      setFont = mocks.setFont;
      line = mocks.line;
      setLineWidth = mocks.setLineWidth;
      lastAutoTable = { finalY: 100 };
      internal = {
         pageSize: {
           width: 210,
           height: 297,
           getWidth: () => 210,
           getHeight: () => 297,
         },
       };
    }
  };
});

vi.mock('jspdf-autotable', () => ({
  default: mocks.autoTable,
}));

const mockMovements = [
  {
    id: 'mov-1',
    created_at: '2023-10-01T10:00:00Z',
    quantity: 10,
    movement_type: 'entree',
    reference: 'REF123', // Should be ignored for lot column now
    notes: 'Note 1',
    product: {
      name: 'Pâtes',
      unit: 'kg',
      boxes_per_carton: 10,
      lots: [
        { lot_number: 'LOT_A' },
        { lot_number: 'LOT_B' }
      ]
    },
  },
  {
    id: 'mov-2',
    created_at: '2023-10-02T10:00:00Z',
    quantity: 5,
    movement_type: 'sortie',
    product: {
      name: 'Pâtes',
      unit: 'kg',
      boxes_per_carton: 10,
      lots: [
        { lot_number: 'LOT_A' },
        { lot_number: 'LOT_B' }
      ]
    },
  },
];

const mockCurrentStock = [
  {
    name: 'Pâtes',
    current_stock: 50,
    unit: 'kg',
    boxes_per_carton: 10,
  }
];

describe('Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase mocks
    const mockOrder = vi.fn().mockResolvedValue({ data: mockMovements, error: null });
    const mockLte = vi.fn().mockReturnValue({ order: mockOrder });
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });
    (supabase.from as any).mockReturnValue({ select: mockSelect });
  });

  it('renders correctly', async () => {
    render(<Reports />);
    expect(screen.getByText('Rapports et Statistiques')).toBeInTheDocument();
    
    await waitFor(() => {
      // Use getByRole which handles nested elements better
      expect(screen.getByRole('button', { name: /Générer rapport PDF/i })).toBeInTheDocument();
      
      // Check data loading
      // Logic: entries = 10, distributions = 5.
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Pâtes')).toBeInTheDocument(); // Most active
    });
  });

  it('generates PDF with correct lots from product definition', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup stock fetch for PDF generation
    const mockStockOrder = vi.fn().mockResolvedValue({ data: mockCurrentStock, error: null });
    const mockStockEq = vi.fn().mockReturnValue({ order: mockStockOrder });
    const mockStockSelect = vi.fn().mockReturnValue({ eq: mockStockEq });
    
    // We need to handle multiple calls to supabase.from
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'stock_movements') {
        // Return a new mock chain for each call to avoid state pollution
        const order = vi.fn().mockResolvedValue({ data: mockMovements, error: null });
        const lte = vi.fn().mockReturnValue({ order });
        const gte = vi.fn().mockReturnValue({ lte });
        const select = vi.fn().mockReturnValue({ gte });
        return { select };
      }
      if (table === 'products') {
        return { select: mockStockSelect };
      }
      return { select: vi.fn() };
    });

    render(<Reports />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Générer rapport PDF/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Générer rapport PDF/i }));

    await waitFor(() => {
      if (consoleSpy.mock.calls.length > 0) {
        console.log('Console Error:', consoleSpy.mock.calls);
      }
      expect(mocks.save).toHaveBeenCalled();
      expect(mocks.autoTable).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Check arguments passed to autoTable to verify "LOT_A, LOT_B" is present
    const autoTableCall = mocks.autoTable.mock.calls[0];
    const tableData = autoTableCall[1].body;
    
    // tableData[0] should be the row for 'Pâtes'
    // Column 1 (index 1) is "N° Lot"
    const patesRow = tableData.find((row: string[]) => row[0] === 'Pâtes');
    expect(patesRow).toBeDefined();
    expect(patesRow[1]).toContain('LOT_A');
    expect(patesRow[1]).toContain('LOT_B');
    // Ensure REF123 is NOT present if we want to strictly follow "lots from products"
    expect(patesRow[1]).not.toContain('REF123');
  });
});

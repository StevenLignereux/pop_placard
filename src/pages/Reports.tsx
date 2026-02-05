import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [movements, setMovements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    entries: 0,
    distributions: 0,
    mostActiveProduct: '',
  });

  useEffect(() => {
    fetchReportData();
  }, [currentDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, product:products(name, unit, boxes_per_carton)')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMovements(data || []);

      // Calculate stats
      let entries = 0;
      let distributions = 0;
      const productCounts: Record<string, number> = {};

      data?.forEach((m: any) => {
        if (m.movement_type === 'entree') entries += m.quantity;
        else distributions += m.quantity;

        const productName = m.product?.name || 'Inconnu';
        productCounts[productName] = (productCounts[productName] || 0) + m.quantity;
      });

      const mostActive = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

      setStats({
        entries,
        distributions,
        mostActiveProduct: mostActive ? mostActive[0] : '-',
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      // Fetch current stock snapshot
      const { data: currentStock, error: stockError } = await supabase
        .from('products')
        .select('name, current_stock, unit, boxes_per_carton')
        .eq('is_active', true)
        .order('name');

      if (stockError) throw stockError;

      const doc = new jsPDF();
      const monthStr = format(currentDate, 'MMMM yyyy', { locale: fr });
      const generationDate = new Date();

      // ... rest of PDF generation

      // Group movements by Product
      const productStats: Record<string, {
        name: string;
        lots: Set<string>;
        cartonsReceived: number;
        boxesDistributed: number;
      }> = {};

      movements.forEach(m => {
        const pName = m.product?.name || 'Inconnu';
        if (!productStats[pName]) {
          productStats[pName] = {
            name: pName,
            lots: new Set(),
            cartonsReceived: 0,
            boxesDistributed: 0,
          };
        }

        if (m.movement_type === 'entree') {
          const bpc = m.product?.boxes_per_carton || 1;
          // Convert units to cartons for entries
          productStats[pName].cartonsReceived += (m.quantity / bpc);
          if (m.reference) productStats[pName].lots.add(m.reference);
        } else {
          // Keep units (boxes) for distributions
          productStats[pName].boxesDistributed += m.quantity;
        }
      });

      // Header
      doc.setFillColor(227, 0, 27); // Red Secours Populaire
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text(`Rapport Mensuel de Stock`, 14, 20);
      
      doc.setFontSize(14);
      doc.text(monthStr.charAt(0).toUpperCase() + monthStr.slice(1), 14, 30);
      
      doc.setFontSize(10);
      doc.text(`Secours Populaire Français`, 200, 20, { align: 'right' });
      doc.text(`Généré le ${format(generationDate, 'dd/MM/yyyy')}`, 200, 30, { align: 'right' });

      doc.setTextColor(0, 0, 0);

      // Summary Text
      doc.setFontSize(11);
      doc.text(`Ce rapport synthétise les mouvements de stock (Entrées et Sorties) pour la période sélectionnée.`, 14, 50);
      doc.text(`Les entrées sont comptabilisées en cartons, les sorties en boîtes/unités.`, 14, 56);

      // Main Table
      const tableData = Object.values(productStats)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => {
          // Find current stock for this product
          const stockInfo = currentStock?.find((s: any) => s.name === p.name);
          let stockDisplay = '-';
          
          if (stockInfo) {
            const cartons = Math.floor((stockInfo as any).current_stock / (stockInfo as any).boxes_per_carton);
            const loose = (stockInfo as any).current_stock % (stockInfo as any).boxes_per_carton;
            stockDisplay = `${cartons} ctn${cartons > 1 ? 's' : ''} + ${loose} ${(stockInfo as any).unit}${loose > 1 ? 's' : ''}`;
          }

          return [
            p.name,
            Array.from(p.lots).join(', ') || '-',
            Number.isInteger(p.cartonsReceived) ? p.cartonsReceived.toString() : p.cartonsReceived.toFixed(1),
            p.boxesDistributed,
            stockDisplay,
            '' // Empty column for handwritten notes
          ];
        });

      autoTable(doc, {
        startY: 65,
        head: [['Désignation Produit', 'N° Lot', 'Entrées (Cartons)', 'Sorties (Boîtes)', 'Stock Actuel', 'Corrections ou remarques']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [227, 0, 27],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold' }, // Désignation
          1: { cellWidth: 30 }, // Lot
          2: { cellWidth: 20, halign: 'center', textColor: [0, 0, 0] }, // Entrées (Black)
          3: { cellWidth: 20, halign: 'center', textColor: [227, 0, 27] }, // Sorties (Red)
          4: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }, // Stock Actuel
          5: { cellWidth: 45 } // Corrections (Wide for handwriting)
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          valign: 'middle',
          minCellHeight: 12
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { top: 60 }
      });

      // Footer with Totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Calculate global totals
      const totalCartons = Object.values(productStats).reduce((sum, p) => sum + p.cartonsReceived, 0);
      const totalBoxes = Object.values(productStats).reduce((sum, p) => sum + p.boxesDistributed, 0);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Cartons Réceptionnés: ${Number.isInteger(totalCartons) ? totalCartons : totalCartons.toFixed(1)}`, 14, finalY);
      doc.text(`Total Boîtes Distribuées: ${totalBoxes}`, 100, finalY);

      doc.save(`rapport_spf_${format(currentDate, 'yyyy_MM')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Produit', 'Type', 'Quantité', 'Référence', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...movements.map(m => [
        m.created_at,
        `"${m.product?.name}"`,
        m.movement_type,
        m.quantity,
        `"${m.reference || ''}"`,
        `"${m.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_spf_${format(currentDate, 'yyyy_MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(new Date(e.target.value));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Rapports et Statistiques</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="month"
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 border px-3"
              value={format(currentDate, 'yyyy-MM')}
              onChange={handleMonthChange}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4">
        <button
          onClick={generatePDF}
          disabled={movements.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          <FileText className="-ml-1 mr-2 h-5 w-5" />
          Générer rapport PDF
        </button>
        <button
          onClick={exportCSV}
          disabled={movements.length === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <Download className="-ml-1 mr-2 h-5 w-5" />
          Exporter CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-gray-800">
          <p className="text-sm text-gray-500">Total Entrées</p>
          <p className="text-3xl font-bold text-gray-900">{stats.entries}</p>
          <p className="text-xs text-gray-400 mt-1">unités ce mois-ci</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-600">
          <p className="text-sm text-gray-500">Total Distributions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.distributions}</p>
          <p className="text-xs text-gray-400 mt-1">unités ce mois-ci</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-gray-400">
          <p className="text-sm text-gray-500">Produit le plus actif</p>
          <p className="text-xl font-bold text-gray-900 truncate" title={stats.mostActiveProduct}>
            {stats.mostActiveProduct}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;

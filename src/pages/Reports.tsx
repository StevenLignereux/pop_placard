import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthStr = format(currentDate, 'MMMM yyyy', { locale: fr });

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
    doc.setFillColor(0, 102, 204); // Primary color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(`Rapport Mensuel de Stock`, 14, 20);
    
    doc.setFontSize(14);
    doc.text(monthStr.charAt(0).toUpperCase() + monthStr.slice(1), 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Secours Populaire Français`, 200, 20, { align: 'right' });
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy')}`, 200, 30, { align: 'right' });

    doc.setTextColor(0, 0, 0);

    // Summary Text
    doc.setFontSize(11);
    doc.text(`Ce rapport synthétise les mouvements de stock (Entrées et Sorties) pour la période sélectionnée.`, 14, 50);
    doc.text(`Les entrées sont comptabilisées en cartons, les sorties en boîtes/unités.`, 14, 56);

      // Main Table
    const tableData = Object.values(productStats)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => [
        p.name,
        Array.from(p.lots).join(', ') || '-',
        Number.isInteger(p.cartonsReceived) ? p.cartonsReceived.toString() : p.cartonsReceived.toFixed(1),
        p.boxesDistributed,
        '' // Empty column for handwritten notes
      ]);

    autoTable(doc, {
      startY: 65,
      head: [['Désignation Produit', 'N° Lot', 'Entrées (Cartons)', 'Sorties (Boîtes)', 'Corrections ou remarques']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' }, // Désignation
        1: { cellWidth: 35 }, // Lot
        2: { cellWidth: 25, halign: 'center', textColor: [40, 167, 69] }, // Entrées (Green)
        3: { cellWidth: 25, halign: 'center', textColor: [255, 102, 0] }, // Sorties (Orange)
        4: { cellWidth: 55 } // Corrections (Wide for handwriting)
      },
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
        minCellHeight: 12 // Increased height (~3cm visually on paper depending on print scale, but good for handwriting)
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
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
          <p className="text-sm text-gray-500">Total Entrées</p>
          <p className="text-3xl font-bold text-gray-900">{stats.entries}</p>
          <p className="text-xs text-gray-400 mt-1">unités ce mois-ci</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-orange-500">
          <p className="text-sm text-gray-500">Total Distributions</p>
          <p className="text-3xl font-bold text-gray-900">{stats.distributions}</p>
          <p className="text-xs text-gray-400 mt-1">unités ce mois-ci</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
          <p className="text-sm text-gray-500">Produit le plus actif</p>
          <p className="text-xl font-bold text-gray-900 truncate" title={stats.mostActiveProduct}>
            {stats.mostActiveProduct}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Évolution journalière</h2>
        {movements.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            Aucune donnée pour ce mois.
          </div>
        ) : (
          <div className="h-80" style={{ minWidth: 0, minHeight: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.values(movements.reduce((acc: any, m: any) => {
                  const date = format(parseISO(m.created_at), 'dd/MM');
                  if (!acc[date]) acc[date] = { date, entrées: 0, distributions: 0 };
                  if (m.movement_type === 'entree') acc[date].entrées += m.quantity;
                  else acc[date].distributions += m.quantity;
                  return acc;
                }, {}))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrées" fill="#28A745" name="Entrées" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distributions" fill="#FF6600" name="Distributions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

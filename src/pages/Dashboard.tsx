import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product, StockMovement } from '../lib/types';
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
import { AlertTriangle, Package, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    entriesMonth: 0,
    distributionsMonth: 0,
  });
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (productsError) throw productsError;

      // Calculate product stats
      const totalProducts = products.length;
      const lowStock = products.filter(p => p.current_stock <= p.alert_threshold);
      
      setLowStockProducts(lowStock);

      // Fetch movements for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*, product:products(name)')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (movementsError) throw movementsError;

      // Calculate movement stats
      let entries = 0;
      let distributions = 0;
      
      // Prepare chart data
      const chartDataMap = new Map();
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'dd/MM', { locale: fr });
        chartDataMap.set(date, { date, entrées: 0, distributions: 0 });
      }

      movements.forEach((m: any) => {
        if (m.movement_type === 'entree') entries += m.quantity;
        if (m.movement_type === 'sortie') distributions += m.quantity;

        const date = format(new Date(m.created_at), 'dd/MM', { locale: fr });
        if (chartDataMap.has(date)) {
          const dayData = chartDataMap.get(date);
          if (m.movement_type === 'entree') {
            dayData.entrées += m.quantity;
          } else {
            dayData.distributions += m.quantity;
          }
        }
      });

      setStats({
        totalProducts,
        lowStockCount: lowStock.length,
        entriesMonth: entries,
        distributionsMonth: distributions,
      });

      setRecentMovements(Array.from(chartDataMap.values()));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Alertes Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Entrées (30j)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.entriesMonth}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ArrowDownCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Distributions (30j)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.distributionsMonth}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <ArrowUpCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mouvements de stock (7 derniers jours)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentMovements}>
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
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Alertes de stock critique
          </h2>
          <div className="space-y-4 overflow-y-auto max-h-80">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun produit en alerte.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-red-600">Seuil: {product.alert_threshold}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-700">{product.current_stock}</p>
                    <p className="text-xs text-gray-500">{product.unit}(s)</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

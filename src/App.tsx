import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import StockEntry from './pages/StockEntry';
import StockDistribution from './pages/StockDistribution';
import Reports from './pages/Reports';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import { useAuthStore } from './store/authStore';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Products */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />
            
            {/* Stock Operations */}
            <Route path="/stock/entries" element={<StockEntry />} />
            <Route path="/stock/distributions" element={<StockDistribution />} />
            
            {/* Reports */}
            <Route path="/reports" element={<Reports />} />
            
            {/* Admin */}
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileBarChart, 
  Users, 
  LogOut,
  Heart,
  ClipboardList
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, signOut } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/products', icon: Package, label: 'Produits' },
    { to: '/stock/entries', icon: ArrowDownCircle, label: 'Entrées de stock' },
    { to: '/stock/distributions', icon: ArrowUpCircle, label: 'Distributions' },
    { to: '/reports', icon: FileBarChart, label: 'Rapports' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin/users', icon: Users, label: 'Utilisateurs' });
    navItems.push({ to: '/admin/audit', icon: ClipboardList, label: 'Journal d\'audit' });
  }

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={clsx(
          "fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg lg:shadow-none border-r border-gray-200",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-primary text-white px-4">
            <Heart className="h-6 w-6 mr-2 fill-current" />
            <span className="text-lg font-bold">Secours Populaire</span>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role === 'admin' ? 'Administrateur' : 'Bénévole'}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) => clsx(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-50 text-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => signOut()}
              className="flex w-full items-center px-4 py-2 text-sm font-medium text-primary rounded-md hover:bg-blue-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

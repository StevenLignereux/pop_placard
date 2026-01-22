import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header = ({ onMenuClick, title }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 lg:hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary rounded-md"
      >
        <span className="sr-only">Ouvrir le menu</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <h1 className="text-xl font-semibold text-gray-800 truncate">
        {title || 'Gestion de Stock'}
      </h1>
    </header>
  );
};

export default Header;

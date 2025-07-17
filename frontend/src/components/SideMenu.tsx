import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/invoices', label: 'Invoices', icon: <FileText size={20} /> },
  { path: '/clients', label: 'Clients', icon: <Users size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const SideMenu: React.FC = () => {
  const location = useLocation();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  return (
    <aside className="w-60 sidebar px-6 py-8 flex flex-col gap-8 border-neutral-800">
      <nav className="flex flex-col gap-2">
        {menuItems.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center menu-item gap-3 px-4 py-3 font-medium transition-colors duration-150 text-xl hover:text-green-50 ${
              location.pathname === path ? 'active' : 'text-gray-800'
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SideMenu;

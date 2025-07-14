import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/invoices', label: 'Invoices', icon: <FileText size={20} /> },
  { path: '/clients', label: 'Clients', icon: <Users size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

const SideMenu = () => {
  const location = useLocation();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  return (
    <aside className="w-64 bg-neutral-800 text-white p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">MyApp</h2>
      {menuItems.map(({ path, label, icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-4 py-2 rounded hover:bg-neutral-700 transition ${
            location.pathname === path ? 'bg-neutral-700' : ''
          }`}
        >
          {icon}
          {label}
        </Link>
      ))}
      <div className="mt-8">
        <label htmlFor="currency-select" className="block text-sm mb-2">Currency</label>
        <select
          id="currency-select"
          value={currency.code}
          onChange={e => {
            const selected = currencyOptions.find(opt => opt.code === e.target.value);
            setCurrency(selected);
          }}
          className="w-full p-2 rounded-md bg-neutral-700 text-neutral-100 border border-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {currencyOptions.map(opt => (
            <option key={opt.code} value={opt.code}>
              {opt.symbol} {opt.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
};

export default SideMenu;

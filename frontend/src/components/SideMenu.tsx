import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  User,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { label: string; path: string}[];
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: <FileText size={22} />,
    submenu: [
      { label: 'All Invoices', path: '/invoices/all', icon: <FileText size={20} /> },
      { label: 'Create Invoice', path: '/invoices', icon: <FileText size={22} /> },
    ],
  },
  { path: '/clients',
      label: 'Clients',
      icon: <Users size={22} />,
    submenu: [
        { label: 'All Clients', path: '/clients/all', icon: <Users size={20} />},
        { label: 'Create Client', path: '/clients/create', icon: <Users size={22} /> },
    ],
  },

  { path: '/settings', label: 'Settings', icon: <Settings size={22} /> },
  { path: '/profile', label: 'Profile', icon: <User size={22} /> },
];


const ICON_SIZE = 20;
const SideMenu: React.FC = () => {
  const location = useLocation();
  const { currency, setCurrency, currencyOptions } = useCurrency();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleClick = (item: MenuItem) => {
    if (item.submenu) {
      setCollapsed(true);
      setExpandedItem(prev => (prev === item.label ? null : item.label));
    }
  };

  return (
    <div className="relative flex">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-400 ${
          collapsed ? 'w-55' : 'w-60'
        } sidebar px-4 py-8 flex flex-col font-medium gap-8 border-neutral-800`}
      >
        <nav className="flex flex-col gap-2">
          {menuItems.map(({ path, label, icon, submenu }) =>
            submenu ? (
              <a
                key={label}
                onClick={() => handleClick({ path, label, icon, submenu })}
                className={`flex menu-item text-gray-700 items-center gap-3 px-4 py-3 h-[3.2rem] max-h-[3.2rem] font-medium transition-colors
                    duration-150 text-left text-xl  ${
                  expandedItem === label ? 'text-black/100 bg-[#f6e9df]' : ''
                }`}
              >
                {icon}
                {!collapsed && label}
              </a>
            ) : (
              <Link
                key={label}
                to={path}
                onClick={() => {
                  handleClick({ path, label, icon, submenu });
                  setCollapsed(false);
                  setExpandedItem(null);
                }}
                className={`flex menu-item items-center gap-3 h-[3.2rem] max-h-[3.2rem] px-4 py-3 font-medium
                    transition-colors duration-150 text-xl  ${
                  location.pathname === path ? 'active ' : 'text-gray-800'
                }`}
              >
                {icon}
                {!collapsed && label}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Submenu Panel */}
      {collapsed && expandedItem && (
        <div className="w-48 bg-[#f6e9df] pt-10 border-neutral-300 shadow-sm">
          {menuItems
              .find(item => item.label === expandedItem)
              ?.submenu?.map(({ label, path, icon }) => (
                <div className=" border-neutral-300" key={path}>
                <Link
                  key={path}
                  to={path}
                  className="flex font-medium cursor-pointer items-center text-lg gap-2 py-3 hover:bg-[#e8dacf] px-4
                  text-gray-700 hover:text-black/100"
                >
                  {label}

                </Link>
                </div>
              ))}

        </div>

      )}
    </div>
  );
};

export default SideMenu;
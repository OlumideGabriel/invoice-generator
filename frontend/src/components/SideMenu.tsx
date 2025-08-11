import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  User,
  SquarePlus
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import Tooltip from './Tooltip';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { label: string; path: string}[];
}

const menuItems: MenuItem[] = [
  { path: '/Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} /> },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: <FileText size={22} />,

  },
  { path: '/clients', label: 'Clients', icon: <Users size={22} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={22} />,

  },

  { path: '/', label: 'Create', icon: <SquarePlus size={22} /> },
];


{/* Mobile menu items */}

const mobileMenuItems: MenuItem[] = [
  { path: '/Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={30} /> },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: <FileText size={30} />,
  },
  { path: '/', label: 'Create', icon: <SquarePlus size={30} /> },
  { path: '/settings', label: 'SettingsPage', icon: <Settings size={30} /> },
];

const ICON_SIZE = 20;
const SideMenu: React.FC = () => {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleClick = (item: MenuItem) => {
    if (item.submenu) {
      setCollapsed(true);
      setExpandedItem(prev => (prev === item.label ? null : item.label));
    }
  };

        useEffect(() => {
          const handleResize = () => {
            if (window.innerWidth < 1120) {
              setCollapsed(true);
            } else {
                setCollapsed(false);
                }

          };

          // Set initial state
          handleResize();

          // Add event listener
          window.addEventListener('resize', handleResize);

          // Cleanup event listener on component unmount
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }, []);

  return (
      <div className="bg-neutral-900 border-r border-gray-200">
    <div className="hidden md:flex relative items-stretch">
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
                  expandedItem === label ? 'text-black/100 bg-neutral-900' : ''
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
                  if (path === '/' && window.innerWidth < 1000) {
                    setCollapsed(!collapsed); // Toggle collapse state
                  } else {
                    handleClick({ path, label, icon, submenu });
                    setCollapsed(false);
                    setExpandedItem(null);
                  }
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

    {/* Mobile Sidebar */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f6e9df] border-gray-200 z-50">
      <nav className="flex justify-around items-center py-3">
        {mobileMenuItems.map(({ path, label, icon }) => (
          <Link
            key={label}
            to={path}
            className={`flex flex-col py-3 px-6 items-center cursor-pointer rounded-lg text-gray-700 hover:text-black/100 ${
              location.pathname === path ? 'bg-black/90 text-neutral-100 hover:text-neutral-100' : 'text-gray-800'
            }`}
          >
            {icon}
          </Link>
        ))}
      </nav>
      </div>
    </div>

  );
};

export default SideMenu;
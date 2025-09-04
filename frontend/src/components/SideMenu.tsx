import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  User,
  SquarePlus,
  CirclePlus,
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
  { path: '/Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={27} /> },
  {
    path: '/invoices',
    label: 'Invoices',
    icon: <FileText size={27} />,
  },
  { path: '/', icon: <CirclePlus size={32} /> },
  { path: '/clients', label: 'Clients', icon: <Users size={27} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={27} /> },
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
        <nav className="flex flex-col gap-1.5">

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
                className={`flex menu-item items-center gap-3 h-[3 rem] max-h-[3.2rem] px-4 py-3 font-medium
                    transition-colors duration-150 text-xl  ${
                  location.pathname === path ? 'active' : 'text-gray-700'
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-50 border-t border-t-1 border-t-gray-200 border-t-dashed z-40">
      <nav className="flex justify-around items-center mt-1">
        {mobileMenuItems.map(({ path, label, icon }) => (
          <Link
            key={label}
            to={path}
            className={`flex flex-col gap-1 w-1/6 py-2 px-3 text-xs items-center cursor-pointer rounded-lg text-gray-700 hover:text-black/100 ${
              location.pathname === path ? 'text-green-900 hover:text-green-800' : 'text-gray-800'
            }`}
          >
            {icon}
            {label}
          </Link>
        ))}
      </nav>
      </div>

{/* Lightweight Upgrade to Pro Card */}
<div className="absolute bottom-10 left-4 z-10 hidden">
  <div className="bg-white border-2 border-dotted border-green-400 rounded-lg shadow-lg p-4 w-48 hover:shadow-xl transition-shadow">
    {/* Header with icon */}
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900">Upgrade to Pro</h3>
    </div>

    {/* Single benefit */}
    <p className="text-sm text-gray-600 text-center mb-4">
      Unlock all features and get priority support
    </p>

    {/* CTA Button */}
    <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-all duration-200 shadow-lg hover:shadow-green-500/25 ring-1 ring-green-400/20">
      Get Pro
    </button>

    {/* Price */}
    <p className="text-center text-xs text-gray-500 mt-2">
      From $2.99/mo
    </p>
  </div>
</div>

    </div>


  );
};


export default SideMenu;
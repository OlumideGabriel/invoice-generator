import React, { useState } from 'react';
import { Menu, Settings, LogOut, User } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

const MainMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="top-0 z-50 w-full bg-neutral-800 shadow-md">
      <div className="flex items-center justify-between main-menu px-4 py-3">
        {/* Logo and dark mode toggle */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Menu size={28} className="text-green-400" />
            <span className="text-2xl font-bold tracking-tight text-white">InvoiceGen</span>
          </div>
          <DarkModeToggle />
        </div>
        {/* User avatar with dropdown */}
        <div className="relative z-100">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 text-white focus:outline-none"
          >
            <User className="w-5 h-5" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50">
              <a
                href="#profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </a>
              <a
                href="#settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </a>
              <a
                href="#logout"
                className="flex items-center px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainMenu;

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, User } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Helper for avatar initials
const getInitials = (u: any) => {
  if (!u) return '';
  const first = u.first_name ? u.first_name[0].toUpperCase() : '';
  const last = u.last_name ? u.last_name[0].toUpperCase() : '';
  if (first || last) return `${first}${last}`;
  if (u.email) return u.email[0].toUpperCase();
  return '';
};

  return (
    <header className="top-0 z-50 w-full bg-neutral-800 shadow-md" onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center justify-between main-menu mr-10 ml-10 px-4 py-3">
        {/* Logo and dark mode toggle */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Menu size={28} className="text-green-400" />
            <span className="text-2xl font-bold tracking-tight text-white">InvoiceGen</span>
          </div>
          <DarkModeToggle />
        </div>
        {/* Right side: Sign In or Avatar */}
        {user ? (
          <div className="relative z-100" ref={menuRef}>
            <a
              onClick={() => setOpen(!open)}
              className="flex items-center justify-center w-5 h-5 px-5 py-5 rounded-full bg-black/80 hover:bg-black/75
              text-white hover:text-white cursor-pointer transition-colors duration-150
              focus:outline-none text-xl font-bold"
            >
              {getInitials(user) || <User className="w-5 h-5 rounded-full" />}

            </a>
            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-xl overflow-hidden z-50">
                <span className="block px-5 py-4 text-md text-gray-900 font-medium border-b ">{user.first_name ? `${user.first_name} ${user.last_name}` : user.email}</span>

                <a
                  href="#profile"
                  className="flex items-center px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-5 h-5 mr-2" />
                  Profile
                </a>
                <a
                  href="#settings"
                  className="flex items-center px-5 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </a>
                <a
                  type="button"
                  onClick={() => { logout(); setOpen(false); navigate('/auth?mode=login'); }}
                  className="flex items-center w-full px-5 py-2 mb-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </a>
              </div>
            )}
          </div>
        ) : (
          <button
            className="ml-4 px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors duration-150"
            onClick={() => navigate('/auth?mode=login') }
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default MainMenu;

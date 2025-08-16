import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, User, Bell, Receipt, Shredder } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Tooltip from './Tooltip';


const MainMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [count, setCount] = useState(3);

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
  if (first || last) return `${first}`;
  if (u.email) return u.email[0].toUpperCase();
  return '';
};

  return (
    <header className="top-0 z-50 w-full bg-neutral-800 shadow-sm" onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center justify-between main-menu mx-3 px-4 py-4">
        {/* Logo and dark mode toggle */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
              <img
                src="/envoyce.svg"
                alt="Envoyce Logo"
                className="h-10 w-10"
              />
              <span className="text-2xl hidden font-semibold tracking-tight text-gray-800 font-[Open Sauce Sans]">
                envoyce
              </span>
            </div>
        </div>

        {/* Right side: Sign In or Avatar */}
        {user ? (
          <div className="flex relative z-100" ref={menuRef}>


          <span className="flex hidden items-center justify-center mr-7"> {/* Notification bell */}

           <span className=" absolute top-0 left-4 bg-red-500 text-white text-sm font-bold px-1 py-1 rounded-full
           min-w-[20px] h-4 flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>

          <Bell className="self-center w-9 h-9 p-1.5 rounded-full text-gray-400
          hover:text-gray-200 hover:bg-neutral-200 cursor-pointer transition-colors duration-150" />
           </span>

            <a
              onClick={() => setOpen(!open)}
              className="flex items-center justify-center w-5 h-5 px-5 py-5 rounded-full bg-blue-300 hover:bg-blue-200
              text-gray-900 cursor-pointer transition-colors duration-150
              focus:outline-none text-xl font-bold"
            >
              {getInitials(user) || <User className="w-5 h-5 rounded-full" />}
            </a>

            {open && (
              <div className="absolute right-0 top-10 mt-2 bg-white rounded-md overflow-hidden z-50
                shadow-lg shadow-gray-400/40 ring-2 ring-gray-300 ring-opacity-40
                [box-shadow:0_0_16px_4px_rgba(156,163,175,0.18)]">
                <Link
                  to="/profile"
                  className="flex mr-2 ml-2 mt-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex flex-row items-center text-lg block px-4 py-3 text-md text-gray-900 font-medium">
                    <span className="flex text-xl font-bold mr-2 w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200
                     rounded-full justify-center items-center">
                      {getInitials(user) || <User className="w-6 h-6" />}
                    </span>
                    <div className="flex flex-col min-w-0">
                      {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                  </span>
                </Link>
                <hr className="border-gray-200 mt-2 mr-2 ml-2" />

                <Link
                  to="/settings"
                  className="flex items-center mr-2 ml-2 mt-2 rounded-md px-3 py-3 text-md text-gray-700
                  hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <User className="w-5 h-5 mr-2" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center mr-2 ml-2 rounded-md px-3 py-3 text-md text-gray-700
                  hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </Link>
                <Link
                  to="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    setOpen(false);
                    const success = await logout();
                    if (success) {
                      // Only navigate after successful logout
                      navigate('/auth?mode=login', { replace: true });
                    } else {
                      // Handle logout failure if needed
                      console.error('Logout failed');
                    }
                  }}
                  className="flex items-center mr-2 ml-2 rounded-md px-3 py-3 mb-2 text-md text-gray-700
                  hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/auth?mode=login"
            className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-colors duration-150"
          >
            Sign In
          </Link>

        )}
      </div>


    </header>
  );
};

export default MainMenu;

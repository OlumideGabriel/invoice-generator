import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, User, Bell, Receipt, Shredder, X, Shield, Scale } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Tooltip from './Tooltip';

const MainMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [count, setCount] = useState(3);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, mobileMenuOpen]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Helper for avatar initials
  const getInitials = (u: any) => {
    if (!u) return '';
    const first = u.first_name ? u.first_name[0].toUpperCase() : '';
    const last = u.last_name ? u.last_name[0].toUpperCase() : '';
    if (first || last) return `${first}`;
    if (u.email) return u.email[0].toUpperCase();
    return '';
  };

  const handleMobileLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const success = await logout();
    if (success) {
      navigate('/auth?mode=login', { replace: true });
    } else {
      console.error('Logout failed');
    }
  };

  return (
    <>
      <header className="top-0 z-50 w-full bg-neutral-800 shadow-sm" onMouseLeave={() => setOpen(false)}>
        <div className="flex items-center justify-between main-menu mx-3 px-4 py-4">
          {/* Logo and hamburger menu for mobile */}
          <div className="flex items-center space-x-6">
            <a href="/" className="flex items-center gap-1 hover:contrast-125">
              <img
                src="/envoyce.svg"
                alt="Envoyce Logo"
                className="h-8 w-8"
              />
              <span className="text-2xl hidden sm:block tracking-tight text-[#0e423e] font-[Open Sauce Sans]">
                envoyce
              </span>
            </a>
          </div>

          {/* Mobile hamburger menu - only show when user is logged in */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-400
                hover:text-gray-200 hover:bg-neutral-100 transition-colors duration-150"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* Desktop: Right side: Sign In or Avatar */}
          {user ? (
            <div className="hidden md:flex relative z-100" ref={menuRef}>
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
                className="flex items-center justify-center  rounded-full bg-blue-300 hover:bg-blue-200
                text-gray-900 cursor-pointer transition-colors duration-150
                focus:outline-none text-xl font-bold"
              >
                <span className="flex flex-row items-center text-lg block text-md text-gray-900 font-medium">
                      {/* Avatar if available, otherwise show initials/fallback */}
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="User Avatar"
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="flex text-xl font-bold w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200 rounded-full justify-center items-center">
                          {getInitials(user) || <User className="w-6 h-6" />}
                        </span>
                      )}
                  </span>


              </a>

              {open && (
                <div className="absolute min-w-80 right-0 top-10 mt-2 bg-white rounded-md overflow-hidden z-50
                  shadow-lg shadow-gray-400/40 ring-2 ring-gray-300 ring-opacity-40
                  [box-shadow:0_0_16px_4px_rgba(156,163,175,0.18)]">
                  <Link
                    to="/settings"
                    className="flex mr-2 ml-2 mt-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex flex-row items-center text-lg block px-4 py-3 text-md text-gray-900 font-medium">
                      {/* Avatar if available, otherwise show initials/fallback */}
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="User Avatar"
                          className="h-12 w-12 mr-2 rounded-full"
                        />
                      ) : (
                        <span className="flex text-xl font-bold mr-2 w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200 rounded-full justify-center items-center">
                          {getInitials(user) || <User className="w-6 h-6" />}
                        </span>
                      )}



                      <div className="flex flex-col min-w-0">

                        {/* Fixed username/email display */}
                <div class="font-medium text-gray-900">
                    {user?.first_name ?
                        `${user.first_name} ${user.last_name || ''}`.trim() :
                        (user?.user_metadata?.name || user?.email || 'Unknown User')
                    }
                </div>

                {/* Always show email if available */}
                {user?.email && (
                    <div class="text-sm text-gray-500 mt-1">
                        {user.email}
                    </div>
                )}
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
                    to="/privacy-policy"
                    className="flex items-center mr-2 ml-2 rounded-md px-3 py-3 text-md text-gray-700
                    hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setOpen(false)}
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms-of-service"
                    className="flex items-center mr-2 ml-2 rounded-md px-3 py-3 text-md text-gray-700
                    hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setOpen(false)}
                  >
                    <Scale className="w-5 h-5 mr-2" />
                    Terms of Service
                  </Link>
                  <Link
                    to="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      setOpen(false);
                      const success = await logout();
                      if (success) {
                        navigate('/auth?mode=login', { replace: true });
                      } else {
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
              className="ml-4 px-4 py-2.5 hover:bg-[#0e423e]/90 text-[#8eda91] hover:text-[#8eda91] bg-[#0e423e] font-semibold
              rounded-lg shadow transition-colors ease-in-out duration-300"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Off-Canvas Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Off-canvas menu */}
          <div
            ref={mobileMenuRef}
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header with Logo */}
            <div className="flex items-center justify-between py-4 px-7 border-b border-gray-200">
              <div className="flex items-center gap-1">
                <img
                  src="/envoyce.svg"
                  alt="Envoyce Logo"
                  className="h-8 w-8"
                />
                <span className="text-2xl tracking-tight text-[#0e423e] font-[Open Sauce Sans]">
                  envoyce
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-md text-gray-400
                  hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="flex absolute bottom-0 w-full items-center py-7 px-7 bg-gray-50 border-t border-gray-200">
              <span className="flex flex-row items-center text-lg block text-md text-gray-900 font-medium">
                      {/* Avatar if available, otherwise show initials/fallback */}
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="User Avatar"
                          className="h-12 w-12 mr-4 rounded-full"
                        />
                      ) : (
                        <span className="flex text-xl font-bold w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200 rounded-full justify-center items-center">
                          {getInitials(user) || <User className="w-6 h-6" />}
                        </span>
                      )}
                  </span>

              <div className="flex flex-col min-w-0">
                <span className="font-medium text-gray-900">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                </span>
                <span className="text-sm text-gray-500">{user?.email}</span>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                to="/settings"
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Link>

              <Link
                to="/settings"
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Link>

              <Link
                to="/privacy-policy"
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="w-5 h-5 mr-3" />
                Privacy Policy
              </Link>

              <Link
                to="/terms-of-service"
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Scale className="w-5 h-5 mr-3" />
                Terms of Service
              </Link>

              <button
                onClick={handleMobileLogout}
                className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 w-full text-left"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default MainMenu;
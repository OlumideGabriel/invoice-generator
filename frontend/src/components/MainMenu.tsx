import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, User, Bell, X, Shield, Scale } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

interface MainMenuProps {
  background?: string;
  showLogo?: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({
  background = 'bg-white',
  showLogo = true
}) => {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLHeadElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [alert, setAlert] = useState(3);
  const lastScrollY = useRef(0);

  // Scroll behavior for mobile
  useEffect(() => {
    const controlHeader = () => {
      if (window.innerWidth >= 768) return; // Only apply to mobile

      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlHeader, { passive: true });

    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, []);

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
      navigate('/', { replace: true });
    } else {
      console.error('Logout failed');
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`top-0 z-50 min-h-[4.6rem] w-full ${background} shadow-sm transition-transform duration-300 ease-in-out md:transform-none ${
          isHeaderVisible ? 'transform translate-y-0' : 'transform -translate-y-full'
        }`}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="flex items-center justify-between main-menu mx-2 px-4 py-3">
          <div className="flex items-center space-x-6">
            {showLogo && (
              <Link to="/" className="flex items-start gap-1 hover:contrast-125">
                <img
                  src="/envoyce.svg"
                  alt="Envoyce Logo"
                  className="h-8 md:h-8 w-auto "
                />
                <span className="md:text-2xl text-2xl sm:block -mt-[0.1rem] tracking-tight text-[#0e423e] font-[Open Sauce Sans]">
                  envoyce
                </span>
              </Link>
            )}
          </div>

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

          {user ? (
            <div className="hidden md:flex relative z-50" ref={menuRef}>
              <Link to='/notifications'
              className="flex items-center justify-center mr-2">
                <span className=" absolute top-[0.3rem] hidden left-[1.2rem] bg-red-500 text-white text-sm font-bold border rounded-full
                 h-3 w-3 flex items-center justify-center">
                  {alert > 99 ? '99+' : setAlert}
                </span>

                <Bell className="self-center w-11 h-11 p-3 rounded-full text-gray-400
                hover:text-gray-200 hover:bg-neutral-100 cursor-pointer transition-colors duration-150" />
              </Link>

              <a
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center  rounded-full h-11 w-11 hover:bg-blue-50
                text-gray-900 cursor-pointer transition-colors duration-150
                focus:outline-none text-xl font-bold"
              >
                <span className="flex flex-row items-center text-lg block text-md text-gray-900 font-medium">
                  {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt="User Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <span className="flex text-xl font-bold w-8 h-8 text-gray-800 bg-blue-200 rounded-full justify-center items-center">
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
                      {user?.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="User Avatar"
                          className="h-8 w-8 mr-2 rounded-full"
                        />
                      ) : (
                        <span className="flex text-xl font-bold mr-2 w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200 rounded-full justify-center items-center">
                          {getInitials(user) || <User className="w-6 h-6" />}
                        </span>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="font-medium text-gray-900">
                          {user?.first_name ?
                            `${user.first_name} ${user.last_name || ''}`.trim() :
                            (user?.user_metadata?.name || user?.email || 'Unknown User')
                          }
                        </div>

                        {user?.email && (
                          <div className="text-sm text-gray-500">
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
                  <hr className="border-gray-200 mt-1 mb-1 mr-2 ml-2" />
                  <Link
                    to="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      setOpen(false);
                      const success = await logout();
                      if (success) {
                        navigate('/', { replace: true });
                      } else {
                        console.error('Logout failed');
                      }
                    }}
                    className="flex items-center mr-2 ml-2 rounded-md px-3 py-3 mb-2 text-md text-gray-700 hover:text-red-600
                    hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => openAuthModal('login')}
                className="px-2 py-2 text-[#0e423e] hover:text-[#0e423e] font-medium
                rounded-lg transition-colors ease-in-out duration-300 text-lg"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-3 hover:bg-[#0e423e]/90 text-[#D2FEE1] hover:text-[#D2FEE1] bg-[#0e423e] font-medium
                rounded-lg shadow transition-colors ease-in-out duration-300"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Off-Canvas Menu Overlay */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop with fade transition */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Off-canvas menu with slide transition */}
        <div
          ref={mobileMenuRef}
          className={`fixed top-0 right-0 h-full z-50 w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex flex-col h-full justify-between">
            {/* Header with Logo */}
            <div>
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

              <div className="pt-2 flex flex-col p-4 relative">
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
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-4 relative">
              {/* Bottom Section with Sign Out and User Info */}
              <div className="">

                <Link
                  to="/support"
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ChatBubbleLeftIcon className="w-5 h-5 mr-3" />
                  Support
                </Link>
                <button
                  onClick={handleMobileLogout}
                  className="flex items-center hidden px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 hover:text-gray-900
                  transition-colors w-full duration-150"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                   Sign Out
                </button>
                <hr className="border-gray-300 my-2" />

                {/* User Profile Section */}
                <div className="flex w-full rounded-lg items-center py-6 mt-4 px-2 justify-between">
                <div className="flex items-center">
                  <span className="flex flex-row items-center text-lg block text-md text-gray-900 font-medium">
                    {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt="User Avatar"
                      className="h-12 w-12 mr-2 rounded-full"
                    />
                    ) : (
                      <span className="flex text-xl font-bold w-10 h-10 px-0 py-0 text-gray-900 bg-blue-200 mr-2 rounded-full justify-center items-center">
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
                  {/* Sign Out Button */}
                  <button
                  onClick={handleMobileLogout}
                  className="flex items-center p-4 text-gray-500 rounded-lg bg-gray-100 hover:bg-gray-200 hover:text-gray-900
                  transition-colors duration-150"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        onModeChange={handleAuthModeChange}
      />
    </>
  );
};

export default MainMenu;
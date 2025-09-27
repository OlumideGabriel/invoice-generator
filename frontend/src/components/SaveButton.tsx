// components/SaveButton.tsx (enhanced with auth modal pattern)
import React, { useState } from 'react';
import { Save, Check, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';
import AuthModal from './AuthModal';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSaved?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'mobile';
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onClick,
  disabled = false,
  isSaved = false,
  loading = false,
  size = 'lg',
  variant = 'default',
  className = '',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  // Auth modal state - following the same pattern as SideMenu
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
  };

  const handleClick = () => {
    // Following the same pattern as SideMenu: if user is not authenticated, open auth modal
    if (!user) {
      openAuthModal('login');
      return;
    }

    // User is authenticated, proceed with the save action
    onClick();
  };

  const handleMouseEnter = () => {
    if (!user) setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Size configurations
  const sizeConfig = {
    sm: { padding: 'px-6 py-2.5', text: 'text-sm', icon: 14, spinner: 'sm' as const },
    md: { padding: 'px-4 py-2', text: 'text-sm', icon: 16, spinner: 'md' as const },
    lg: { padding: 'px-8 py-4', text: 'text-md', icon: 16, spinner: 'md' as const },
  };

  const currentSize = sizeConfig[size];
  const isUserLoggedIn = !!user;

  const baseStyles = `font-medium rounded-lg flex items-center justify-center gap-2  border-2 transition ${currentSize.padding} ${currentSize.text} ${className} relative`;

  const variantStyles = {
    default: isSaved
      ? 'bg-green-100 text-green-700 border-green-300 cursor-default'
      : isUserLoggedIn
      ? 'bg-white text-black border-gray-900 hover:bg-gray-100 hover:scale-[1.02] hover:shadow-md'
      : 'bg-white text-gray-700 border-gray-400 cursor-pointer',
    mobile: isSaved
      ? 'bg-green-100 text-green-700 border-green-300'
      : isUserLoggedIn
      ? 'bg-white text-black border-gray-900'
      : 'bg-white text-gray-700 border-gray-400 cursor-pointer',
  };

  const buttonStyles = `${baseStyles} ${variantStyles[variant]}`;

  return (
    <>
    {/* Auth Modal - following the exact same pattern as SideMenu */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        onModeChange={handleAuthModeChange}
      />
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isSaved || loading}
          className={buttonStyles}
        >
          {loading ? (
            <Spinner size={currentSize.spinner} color="current" />
          ) : isSaved ? (
            <>
              <Check size={currentSize.icon} />
              {variant === 'mobile' ? 'Saved' : 'Saved Invoice'}
            </>
          ) : !isUserLoggedIn ? (
            <>
              <Save size={currentSize.icon} />
              {variant === 'mobile' ? 'Save ' : 'Save Invoice'}
            </>
          ) : (
            <>
              <Save size={currentSize.icon} />
              {variant === 'mobile' ? 'Save' : 'Save Invoice'}
            </>
          )}
        </button>

        {/* Tooltip for non-logged in users */}
        {showTooltip && !isUserLoggedIn && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm rounded py-1 px-2 whitespace-nowrap z-50">
            Sign in to save your invoice
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>


    </>
  );
};

export default SaveButton;
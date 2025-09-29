// components/SaveButton.tsx (updated with navigation functionality)
import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from './Spinner';

interface SaveButtonProps {
  onClick: () => Promise<string | void> | void; // Updated to handle async and return invoice ID
  disabled?: boolean;
  isSaved?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'mobile';
  className?: string;
  onAuthRequired?: (mode: 'login' | 'signup') => void;
  redirectAfterSave?: boolean; // New prop to control redirect behavior
  onSaveSuccess?: (invoiceId?: string) => void; // Optional callback for custom handling
}

const SaveButton: React.FC<SaveButtonProps> = ({
  onClick,
  disabled = false,
  isSaved = false,
  loading = false,
  size = 'lg',
  variant = 'default',
  className = '',
  onAuthRequired,
  redirectAfterSave = false,
  onSaveSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    // If user is not authenticated, call the auth required callback
    if (!user && onAuthRequired) {
      onAuthRequired('login');
      return;
    }

    try {
      setIsProcessing(true);

      // Execute the onClick function and await if it's a promise
      const result = await onClick();

      // If redirectAfterSave is true and we got an invoice ID, navigate to invoice page
      if (redirectAfterSave && typeof result === 'string') {
        navigate(`/invoice/${result}`);
      }

      // Call the success callback if provided
      if (onSaveSuccess) {
        onSaveSuccess(typeof result === 'string' ? result : undefined);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false);
    }
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
  const isLoading = loading || isProcessing;

  const baseStyles = `font-medium rounded-lg flex items-center whitespace-nowrap justify-center gap-2 border-2 transition ${currentSize.padding} ${currentSize.text} ${className} relative`;

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
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isSaved || isLoading}
        className={buttonStyles}
      >
        {isLoading ? (
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
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-md py-0.5 px-2 whitespace-nowrap z-50">
          Sign in to save your invoice
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default SaveButton;
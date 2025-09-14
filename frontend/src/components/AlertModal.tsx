import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  actions?: React.ReactNode;
  autoClose?: boolean;
  autoCloseDelay?: number;
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  type = 'info',
  actions,
  autoClose = false,
  autoCloseDelay = 5000,
  dismissible = true,
  size = 'md',
  showIcon = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen && autoClose && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    if (!dismissible) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 200);
  };

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500',
      accent: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      accent: 'bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      accent: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
      accent: 'bg-blue-500'
    },
    neutral: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: 'text-gray-500',
      accent: 'bg-gray-500'
    }
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    neutral: Bell
  };

  const sizeStyles = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-2xl'
  };

  const IconComponent = icons[type];
  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div
        className={`
          fixed inset-0 transition-all duration-300
          ${isAnimating ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-50'}
        `}
        onClick={handleClose}
      />

      {/* Modal container */}
      <div className="flex items-center justify-center p-4 min-h-full p-0 h-full items-center sm:p-4">
        {/* Modal panel */}
        <div className={`
          relative w-full h-auto sm:p-6 sm:w-full p-4 bg-white shadow-xl rounded-xl overflow-hidden
          transition-all duration-200 ease-out
          ${sizeStyles[size]}
          ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        `}>

          {/* Alert accent bar */}
          <div className={`h-1 w-full `} />

          {/* Close button - desktop */}
          {dismissible && (
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 z-10  rounded-full  transition-colors"
              aria-label="Close modal"
            >
              <X size={18} className="text-neutral-400 hover:text-neutral-600" />
            </button>
          )}

          {/* Content container */}
          <div className={` ${styles.text} sm:border-l-0 sm:border-0`}>

            {/* Header with icon and title */}
            <div className="flex items-center gap-4 mb-6">
              {showIcon && (
                <div className="flex-shrink-0">
                  <IconComponent size={32} className={styles.icon} />
                </div>
              )}

              {title && (
                <h2 className="text-xl sm:text-2xl font-semibold text-center sm:text-left flex-1">
                  {title}
                </h2>
              )}
            </div>

            {/* Alert content */}
            <div className="mb-6 leading-relaxed">
              {children}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                {actions}
              </div>
            )}

            {/* Auto-close indicator */}
            {autoClose && autoCloseDelay > 0 && (
              <div className="mt-4 text-sm opacity-75">
                This alert will close automatically in {Math.ceil(autoCloseDelay / 1000)} seconds
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
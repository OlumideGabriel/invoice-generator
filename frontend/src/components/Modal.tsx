// Components/Modal.tsx
import React from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div
        className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal container - responsive positioning */}
      <div className="flex items-center justify-center min-h-full p-0 h-full items-center sm:p-4">
        {/* Modal panel - full screen on mobile, centered card on desktop */}
        <div className="relative w-full h-full sm:h-auto p-0 sm:p-6 sm:max-w-xl sm:w-full bg-white shadow-xl sm:rounded-xl overflow-hidden">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 hidden md:block right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>

           {/* Back button */}
           <div className="flex md:hidden items-center space-x-3 mb-2 mt-6 ml-4 gap-6">
                <button
              onClick={onClose}
              className="inline-flex items-center px-3 py-3 bg-transparent hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            </div>

          {/* Content container with proper padding */}
          <div className="p-6 sm:p-8 pt-16 sm:pt-12">

            {title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {title}
              </h2>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
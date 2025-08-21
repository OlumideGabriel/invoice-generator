import React from 'react';
import Tooltip from './Tooltip';
import { ArrowDownToLine } from 'lucide-react';

// Loading dots component with snake animation
const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

interface InvoiceButtonProps {
  loading: boolean;
  onClick: () => void;
}

const InvoiceButton: React.FC<InvoiceButtonProps> = ({ loading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-4 button py-4 text-lg whitespace-nowrap font-medium rounded-xl flex items-center h-[3.5rem] justify-center gap-2 relative ${
        loading ? 'bg-gray-500 cursor-not-allowed' : 'download-button'
      }`}
    >
      {/* Default content */}
      <span className={`${loading ? 'opacity-0' : 'flex items-center gap-2'}`}>
        <ArrowDownToLine size={20} />
        Download
      </span>

      {/* Loading overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingDots />
        </span>
      )}
    </button>


  );
};

export default InvoiceButton;

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
      className={`w-full px-8 py-4 text-md bg-[#0f131a] hover:bg-black/85 h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-white transition ease-in-out duration-200 hover:scale-[1.02] hover:shadow-md ${
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

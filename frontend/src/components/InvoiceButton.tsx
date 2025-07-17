import React from 'react';
import Tooltip from './Tooltip';
import { ArrowDownToLine } from 'lucide-react';

interface InvoiceButtonProps {
  loading: boolean;
  onClick: () => void;
}

const InvoiceButton: React.FC<InvoiceButtonProps> = ({ loading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-4 py-4 text-lg whitespace-nowrap font-medium rounded-xl flex items-center justify-center gap-2 ${
        loading ? 'bg-gray-500 cursor-not-allowed' : 'download-button'
      }`}
    >
      {loading ? (
        'Generating Invoice...'
      ) : (
        <>
          <ArrowDownToLine size={20} />
          Download
        </>
      )}
    </button>
  );
};

export default InvoiceButton;

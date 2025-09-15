import React from 'react';
import { ArrowDownToLine } from 'lucide-react';
import Spinner from './Spinner';

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
        loading ? 'opacity-80 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <Spinner size="md" color="white" />
      ) : (
        <div className="flex items-center gap-2">
          <ArrowDownToLine size={20} />
          Download
        </div>
      )}
    </button>
  );
};

export default InvoiceButton;
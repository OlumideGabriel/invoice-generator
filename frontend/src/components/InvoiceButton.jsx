// components/InvoiceButton.jsx
import React from 'react';

const InvoiceButton = ({ loading, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full py-3 font-semibold rounded-md ${
        loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
      }`}
    >
      {loading ? 'Generating Invoice...' : 'Generate Invoice'}
    </button>
  );
};

export default InvoiceButton;

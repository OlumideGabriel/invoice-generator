// components/InvoiceForm.jsx
import React from 'react';

const InvoiceForm = ({ children }) => {
  return (
    <div className="max-w-4xl w-1/2 bg-neutral-800 shadow-xl rounded-2xl p-8 overflow-auto">
      {children}
    </div>
  );
};

export default InvoiceForm;

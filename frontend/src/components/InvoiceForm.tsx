import React, { ReactNode } from 'react';

type InvoiceFormProps = {
  children: ReactNode;
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ children }) => {
  return (
    <div className="max-w-4xl w-1/2 bg-neutral-800 shadow-xl rounded-2xl p-8 overflow-auto">
      {children}
    </div>
  );
};

export default InvoiceForm;

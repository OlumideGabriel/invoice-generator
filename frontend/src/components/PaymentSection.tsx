import React from 'react';

interface PaymentSectionProps {
  paymentDetails: string;
  setPaymentDetails: (val: string) => void;
  terms: string;
  setTerms: (val: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ paymentDetails, setPaymentDetails, terms, setTerms }) => {
  return (
    <>
      <div className="mb-6">
        <label className="block text-neutral-500 text-sm font-medium">Payment Details</label>
        <textarea
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          rows={3}
          placeholder={`Bank: [Your Bank]
Account: [Your Account Number]`}
          className="md:w-2/3 md:max-w-[22rem] w-full min-h-20 max-h-20 p-3 rounded-md
          bg-neutral-700 border !border-gray-300 focus:outline-none focus:ring-2"
        />
      </div>
      <div className="mb-6">
        <label className="block text-neutral-500 text-sm font-medium">Terms</label>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={3}
          placeholder={`Please submit payment within 15 days of receipt of this invoice.`}
          className="md:w-2/3 md:max-w-[22rem] w-full min-h-20 max-h-20 p-3 rounded-md bg-neutral-700 border !border-gray-300
          focus:outline-none focus:ring-2"
        />
      </div>
    </>
  );
};

export default PaymentSection;

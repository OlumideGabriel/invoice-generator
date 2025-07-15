import React from 'react';
import InvoiceButton from './InvoiceButton';
import { X, Eye, Send } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';

const InvoiceSidebar = ({
  loading,
  onSubmit,
  onPreview,
  previewPdfUrl,
  setPreviewPdfUrl,
  previewInvoiceImage,
}) => {
  return (
    <div className="w-full max-w-48 hidden md:flex flex-col sticky top-0 z-50 self-start ">
      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-2 mb-8">
        <InvoiceButton loading={loading} onClick={onSubmit} />
        <button
          onClick={onPreview}
          disabled={loading}
          className="w-full px-4 py-4 text-lg btn-secondary whitespace-nowrap font-medium rounded-xl flex items-center justify-center gap-2
           text-black transition"
        >
        <Send size={20} />
          Send Invoice
        </button>
        <button
          onClick={onPreview}
          disabled={loading}
          className="w-full px-4 py-4 text-lg btn-secondary whitespace-nowrap font-medium rounded-xl flex items-center justify-center gap-2
           text-black transition"
        >
          Preview
          <Eye size={20} />
        </button>
      </div>
      {/* Divider */}
      <hr className="my-3 border-gray-900" />
      {/* Currency Selector below divider */}
      <div className="mt-0">
        {(() => {
          const { currency, setCurrency, currencyOptions } = useCurrency();
          return <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />;
        })()}
      </div>

        {/* Preview PDF */}
      {previewPdfUrl && (
        <div className="mt-10 border border-neutral-700 rounded-md overflow-hidden bg-white">
          <div className="flex justify-between items-center p-4 bg-neutral-900">
            <h3 className="text-lg font-semibold text-indigo-300">Preview</h3>
            <button
              onClick={() => {
                URL.revokeObjectURL(previewPdfUrl);
                setPreviewPdfUrl(null);
              }}
              className="text-sm text-red-400 hover:underline"
            >
              <X size={18} />
            </button>
          </div>
          <object
            data={previewPdfUrl}
            type="application/pdf"
            className="w-full h-[90vh]"
          >
            <p className="text-sm text-neutral-800 p-4">
              Your browser doesn't support PDF preview.{' '}
              <a
                href={previewPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 underline"
              >
                Download instead
              </a>
            </p>
          </object>
        </div>
      )}
    </div>
  );
};

export default InvoiceSidebar;

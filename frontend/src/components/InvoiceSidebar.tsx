import React from 'react';
import InvoiceButton from './InvoiceButton';
import { X, Eye, Send, Save, Download, Trash2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';
import Spinner from './Spinner';


interface InvoiceSidebarProps {
  loading: boolean;
  previewLoading: boolean;
  onSubmit: () => void;
  onPreview: () => void;
  previewPdfUrl?: string | null;
  setPreviewPdfUrl: (url: string | null) => void;
  previewInvoice: () => Promise<string | null>;
  getTotal: () => number;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getShippingAmount: () => number;
  dueDate: string;
  showTax: boolean;
  showDiscount: boolean;
  showShipping: boolean;
  taxPercent: number;
  discountPercent: number;
  shippingAmount: number;
  taxType: string;
  discountType: string;
  onSaveToLocalStorage?: () => void;
  onLoadFromLocalStorage?: () => void;
  onClearLocalStorage?: () => void;
  lastSavedTime?: string | null;
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  loading,
  previewLoading,
  onSubmit,
  onPreview,
  previewPdfUrl,
  setPreviewPdfUrl,
  onSaveToLocalStorage,
  onLoadFromLocalStorage,
  onClearLocalStorage,
  lastSavedTime,
}) => {
  return (
      <>
      {previewPdfUrl !== null && (
  <div
    className="fixed inset-0 bg-black bg-blur-50 bg-opacity-60 flex items-center justify-center z-50 px-2"
    onClick={() => {
      // Click on backdrop closes the preview
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }}
  >
    <div
      className="bg-white rounded-xl shadow-lg md:min-w-[600px] sm:min-w-[500px] min-w-full h-auto relative flex flex-col transition-all ease-in-out delay-500"
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing
    >
      {/* Close Button */}
      <button
        onClick={() => {
          if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }}
        className="absolute top-2 right-2 md:top-3 md:right-3 text-black/60 hover:text-black/90 bg-black/5 p-1 hover:bg-black/10 rounded-lg z-10"
      >
        <X size={18} />
      </button>

      {/* Render preview or spinner */}
      <div className="flex justify-center items-center w-full overflow-hidden  min-h-[400px]">
        {previewPdfUrl === '' ? (
          <div className="transition-opacity duration-500 ease-in-out opacity-100">
            <Spinner size="xl" color="current" />
          </div>
        ) : (
          <img
            src={previewPdfUrl}
            alt="Invoice Preview"
            className="aspect-[85/110] w-full max-w-2xl rounded-lg bg-neutral-800 p-2 object-contain transition-opacity duration-500 ease-in-out opacity-100"
          />
        )}
      </div>
    </div>
  </div>
)}





    <div className="w-full min-w-40 hidden md:flex flex-col sticky top-[6.75rem] z-10 self-start">
      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mb-8">
        <InvoiceButton loading={loading} onClick={onSubmit} />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => {
            const mailtoUrl = `mailto:talktoolumide@gmail.com?subject=Invoice Preview&body=Hello, here is your invoice preview.`;
            const newWindow = window.open(mailtoUrl, '_blank');
            if (!newWindow) {
              // Fallback if popup is blocked
              window.location.href = mailtoUrl;
            }
          }}
          disabled={loading}
          className="w-full px-8 py-4 text-md hidden bg-[white] hover:bg-gray-100 h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black border-2 border-gray-900 transition ease-in-out duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          <Send size={16} />
          Send
        </button>

        {/* Preview Button */}
      <button
          type="button"
          onClick={onPreview}
          disabled={previewLoading}
          className="w-40 px-8 py-4 text-lg bg-transparent border-2 hover:bg-[#0f131a] h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black hover:border-gray-900 hover:text-white transition ease-in-out duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          {previewLoading ? (
            <Spinner size="md" color="current" />
          ) : (
            <>
              Preview
              <Eye size={20} />
            </>
          )}
        </button>


        {/* Browser Storage Section */}
        {(onSaveToLocalStorage || onLoadFromLocalStorage || onClearLocalStorage) && (
          <div className="mt-6 p-4 hidden border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
              <Save size={16} />
              Browser Storage
            </h3>
            {lastSavedTime && (
              <div className="text-xs text-gray-500 mb-3">
                Last saved: {lastSavedTime}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {onSaveToLocalStorage && (
                <button
                  onClick={onSaveToLocalStorage}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors"
                >
                  <Save size={14} />
                  Save to Browser
                </button>
              )}
              {onLoadFromLocalStorage && (
                <button
                  onClick={onLoadFromLocalStorage}
                  disabled={loading}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm flex items-center justify-center gap-2 hover:bg-green-200 transition-colors"
                >
                  <Download size={14} />
                  Load from Browser
                </button>
              )}
              {onClearLocalStorage && (
                <button
                  onClick={onClearLocalStorage}
                  disabled={loading}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                  Clear Storage
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your invoice is automatically saved to your browser
            </p>
          </div>
        )}

      </div>
      {/* Divider */}
      <hr className="my-3 border-gray-400" />
      {/* Currency Selector below divider */}
      <div className="mt-0">
        {(() => {
          const { currency, setCurrency, currencyOptions } = useCurrency();
          return <CurrencySelector currency={currency} setCurrency={setCurrency} currencyOptions={currencyOptions} />;
        })()}
      </div>
    </div>

    {/* Mobile Action Buttons */}
    <div className="md:hidden flex w-full max-w-125 items-center fixed bottom-0 lef-0 p-4 bg-white justify-between gap-3 pb-20">
      {/* Mobile download Button */}
      <div className="w-5/6">
        <InvoiceButton loading={loading} onClick={onSubmit} />
      </div>

      {/* Mobile Preview Button */}
      <button
        type="button"
        onClick={onPreview}
        disabled={previewLoading}
        className="w-20 px-0 py-4 text-lg border-2 border-black/90 whitespace-nowrap font-medium rounded-xl
        flex items-center justify-center gap-2 text-black transition"
      >
      {previewLoading ? (
            <Spinner size="md" color="current" />
          ) : (
            <>
              <Eye size={20} />
            </>
          )}
      </button>



    </div>

    {/* Mobile Browser Storage Buttons */}
    {(onSaveToLocalStorage || onLoadFromLocalStorage || onClearLocalStorage) && (
      <div className="hidden fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">Browser Storage</h3>
          {lastSavedTime && (
            <span className="text-xs text-gray-500">Saved: {new Date(lastSavedTime).toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {onSaveToLocalStorage && (
            <button
              onClick={onSaveToLocalStorage}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors"
            >
              <Save size={14} />
              <span className="text-xs">Save</span>
            </button>
          )}
          {onLoadFromLocalStorage && (
            <button
              onClick={onLoadFromLocalStorage}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded text-sm flex items-center justify-center gap-1 hover:bg-green-200 transition-colors"
            >
              <Download size={14} />
              <span className="text-xs">Load</span>
            </button>
          )}
          {onClearLocalStorage && (
            <button
              onClick={onClearLocalStorage}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded text-sm flex items-center justify-center gap-1 hover:bg-red-200 transition-colors"
            >
              <Trash2 size={14} />
              <span className="text-xs">Clear</span>
            </button>
          )}
        </div>
      </div>
    )}
    </>
  );
};

export default InvoiceSidebar;
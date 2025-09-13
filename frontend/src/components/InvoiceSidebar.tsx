import React from 'react';
import InvoiceButton from './InvoiceButton';
import { X, Eye, Send } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';

interface InvoiceSidebarProps {
  loading: boolean;
  onSubmit: () => void;
  onPreview: () => void;
  previewPdfUrl?: string | null;
  setPreviewPdfUrl: (url: string | null) => void;
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  loading,
  onSubmit,
  onPreview,
  previewPdfUrl,
  setPreviewPdfUrl,
}) => {
  return (
      <>
    <div className="w-full min-w-40 hidden md:flex flex-col sticky top-8 z-10 self-start ">
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
          className="w-full px-8 py-4 text-md bg-[white] hover:bg-gray-100 h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black border-2 border-gray-300 transition ease-in-out duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          <Send size={16} />
          Send
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          disabled={loading}
          className="w-full px-8 py-4 text-lg bg-[#CCF1D3] hidden hover:bg-[#6CDD82] h-[3.5rem] whitespace-nowrap font-medium rounded-xl
          flex items-center justify-center gap-2 text-black transition ease-in-out duration-200 hover:scale-[1.02] hover:shadow-md"
        >
          Preview
          <Eye size={20} />
        </button>

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
              <X size={16} /> Close
            </button>
          </div>
          <div className="p-4">
            <iframe src={previewPdfUrl} title="Invoice Preview" className="w-full h-72 border-none rounded-md" />
          </div>
        </div>
      )}
    </div>

    {/* Mobile Action Buttons */}
<div className="md:hidden flex w-full max-w-125 items-center fixed bottom-0 lef-0 p-4 bg-white justify-between gap-3 pb-20">
  {/* Mobile download Button */}
  <div className="w-5/6">
    <InvoiceButton loading={loading} onClick={onSubmit} />
  </div>

  {/* Mobile Send Button */}
  <button
    type="button"
    disabled={loading}
    onClick={() => {
    window.location.href = `mailto:talktoolumide@gmail.com?subject=Invoice Preview&body=Hello, here is your invoice preview.`;
  }}
    className="w-20 px-0 py-4 text-lg border-2 border-black/90 whitespace-nowrap font-medium rounded-xl
    flex items-center justify-center gap-2 text-black transition"
  >
    <Send size={20} />
  </button>
</div>


    </>
  );
};

export default InvoiceSidebar;

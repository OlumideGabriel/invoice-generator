import React, { useState } from 'react';
import { X, Eye, Send, Download, Menu } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from './CurrencySelector';
import Spinner from './Spinner';
import SaveButton from './SaveButton';
import AuthModal from './AuthModal';

interface InvoiceSidebarProps {
  loading: boolean;
  previewLoading: boolean;
  onSave: () => Promise<string | void> | void;
  onDownload: () => void;
  onPreview: () => void;
  isSaved: boolean;
  previewPdfUrl?: string | null;
  setPreviewPdfUrl: (url: string | null) => void;
  previewInvoice: () => Promise<string | null>;
  onSaveToLocalStorage?: () => void;
  onLoadFromLocalStorage?: () => void;
  onClearLocalStorage?: () => void;
  lastSavedTime?: string | null;
  redirectAfterSave?: boolean;
  onSaveSuccess?: (invoiceId?: string) => void;
}

const InvoiceSidebar: React.FC<InvoiceSidebarProps> = ({
  loading,
  previewLoading,
  onSave,
  onDownload,
  onPreview,
  isSaved,
  previewPdfUrl,
  setPreviewPdfUrl,
  onSaveToLocalStorage,
  onLoadFromLocalStorage,
  onClearLocalStorage,
  lastSavedTime,
}) => {
  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  // iPad sidebar state
  const [ipadSidebarOpen, setIpadSidebarOpen] = useState(false);

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthModeChange = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
  };

  return (
      <>
      <div>
      {/* Preview Modal - Keep z-50 (highest) */}
      {previewPdfUrl !== null && (
        <div
          className="fixed inset-0 bg-black bg-blur-50 bg-opacity-60 flex z-50 items-center justify-center px-2"
          onClick={() => {
            if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
            setPreviewPdfUrl(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-lg md:min-w-[600px] sm:min-w-[500px] min-w-full h-auto relative flex flex-col transition-all ease-in-out delay-500"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                setPreviewPdfUrl(null);
              }}
              className="absolute top-2 right-2 md:top-3 md:right-3 text-black/60 hover:text-black/90 bg-black/5 p-1 hover:bg-black/10 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex justify-center items-center w-full overflow-hidden min-h-[400px]">
              {previewPdfUrl === '' ? (
                <Spinner size="xl" color="current" />
              ) : (
                <img
                  src={previewPdfUrl}
                  alt="Invoice Preview"
                  className="aspect-[85/110] w-full max-w-2xl rounded-lg bg-neutral-800 p-2 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
   {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        onModeChange={handleAuthModeChange}
      />

  </div>
    <div className="flex flex-col sticky top-[6.7rem] items-center md:items-stretch">

      {/* Desktop Sidebar - z-30 */}
      <div className="w-full min-w-40 hidden xl:flex flex-col z-30 self-start">
        <div className="flex flex-col gap-4 mb-8">
          <SaveButton
            onClick={onSave}
            disabled={loading}
            isSaved={isSaved}
            loading={loading}
            size="lg"
            variant="default"
            onAuthRequired={openAuthModal}
            redirectAfterSave={true}
            onSaveSuccess={(invoiceId) => {
              console.log('Invoice saved successfully, ID:', invoiceId);
            }}
          />

          {/* Download PDF */}
          <button
            type="button"
            onClick={onDownload}
            disabled={loading}
            className="w-full px-8 py-4 text-md bg-black text-white font-medium rounded-lg flex items-center
            justify-center gap-2 transition hover:bg-black/90 active:scale-[0.98]"
          >
            <Download size={16} />
            Download
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => {
              const mailtoUrl = `mailto:talktoolumide@gmail.com?subject=Invoice Preview&body=Hello, here is your invoice preview.`;
              const newWindow = window.open(mailtoUrl, '_blank');
              if (!newWindow) window.location.href = mailtoUrl;
            }}
            disabled={loading}
            className="w-full px-8 py-2.5 hidden text-md bg-white hover:bg-gray-100 font-medium rounded-lg flex items-center justify-center gap-2 text-black border-2 border-gray-900 transition"
          >
            <Send size={16} />
            Send
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={onPreview}
            disabled={previewLoading}
            className="w-full px-8 py-3 text-md bg-white border-2 border-gray-200 active:scale-[0.98] hover:bg-[#0f131a]
            font-medium rounded-lg flex items-center justify-center gap-2 text-black hover:border-gray-900 hover:text-white transition"
          >
            {previewLoading ? (
              <Spinner size="md" color="current" />
            ) : (
              <>
                  Preview
              </>
            )}
          </button>
        </div>

        {/* Last Saved Time Indicator */}
        {lastSavedTime && isSaved && (
          <div className="mb-4 text-xs text-gray-500 text-center">
            Last saved: {lastSavedTime}
          </div>
        )}

        {/* Local Storage Actions */}
        {(onSaveToLocalStorage || onLoadFromLocalStorage || onClearLocalStorage) && (
          <div className="mb-6 p-4 hidden bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Local Storage</h3>
            <div className="flex flex-col gap-2">
              {onSaveToLocalStorage && (
                <button
                  type="button"
                  onClick={onSaveToLocalStorage}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                >
                  Save to Browser
                </button>
              )}
              {onLoadFromLocalStorage && (
                <button
                  type="button"
                  onClick={onLoadFromLocalStorage}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                >
                  Load from Browser
                </button>
              )}
              {onClearLocalStorage && (
                <button
                  type="button"
                  onClick={onClearLocalStorage}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  Clear Storage
                </button>
              )}
            </div>
          </div>
        )}

        {/* Divider + Currency Selector */}
        <hr className="my-3 border-gray-400" />
        <div className="mt-0">
          {(() => {
            const { currency, setCurrency, currencyOptions } = useCurrency();
            return (
              <CurrencySelector
                currency={currency}
                setCurrency={setCurrency}
                currencyOptions={currencyOptions}
              />
            );
          })()}
        </div>
      </div>

      {/* Ipad sidebar - z-30 */}
      <div className="w-full min-w-40 hidden md:flex xl:hidden justify-between z-30 items-center">
      {/* Divider + Currency Selector */}
        <div className="mt-0">
          {(() => {
            const { currency, setCurrency, currencyOptions } = useCurrency();
            return (
              <CurrencySelector
                currency={currency}
                setCurrency={setCurrency}
                currencyOptions={currencyOptions}
              />
            );
          })()}
        </div>

        <div className="flex flex-row gap-2">
          <SaveButton
            onClick={onSave}
            disabled={loading}
            isSaved={isSaved}
            loading={loading}
            size="md"
            variant="default"
            onAuthRequired={openAuthModal}
            redirectAfterSave={true}
            onSaveSuccess={(invoiceId) => {
              console.log('Invoice saved successfully, ID:', invoiceId);
            }}
          />

          {/* Download PDF */}
          <button
            type="button"
            onClick={onDownload}
            disabled={loading}
            className="w-full px-8 py-[1.35rem] text-md bg-black h-10 text-white font-medium rounded-lg flex items-center
            justify-center gap-2 transition hover:bg-gray-900 hover:shadow-md"
          >
            <Download size={16} />
            Download
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => {
              const mailtoUrl = `mailto:talktoolumide@gmail.com?subject=Invoice Preview&body=Hello, here is your invoice preview.`;
              const newWindow = window.open(mailtoUrl, '_blank');
              if (!newWindow) window.location.href = mailtoUrl;
            }}
            disabled={loading}
            className="w-full px-8 py-2.5 hidden text-md bg-white hover:bg-gray-100 font-medium rounded-lg flex items-center justify-center gap-2 text-black border-2 border-gray-900 transition"
          >
            <Send size={16} />
            Send
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={onPreview}
            disabled={previewLoading}
            className="w-full px-10 py-3 text-md bg-white border-2 border-neutral-200 hover:bg-[#0f131a] font-medium rounded-lg flex h-11
            items-center justify-center gap-2 text-black hover:border-gray-900 hover:text-white transition"
          >
            {previewLoading ? (
              <Spinner size="md" color="current" />
            ) : (
              <>
               Preview
              </>
            )}
          </button>
        </div>

        {/* Last Saved Time Indicator */}
        {lastSavedTime && isSaved && (
          <div className="mb-4 text-xs text-gray-500 text-center">
            Last saved: {lastSavedTime}
          </div>
        )}

        {/* Local Storage Actions */}
        {(onSaveToLocalStorage || onLoadFromLocalStorage || onClearLocalStorage) && (
          <div className="mb-6 p-4 hidden bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Local Storage</h3>
            <div className="flex flex-col gap-2">
              {onSaveToLocalStorage && (
                <button
                  type="button"
                  onClick={onSaveToLocalStorage}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                >
                  Save to Browser
                </button>
              )}
              {onLoadFromLocalStorage && (
                <button
                  type="button"
                  onClick={onLoadFromLocalStorage}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                >
                  Load from Browser
                </button>
              )}
              {onClearLocalStorage && (
                <button
                  type="button"
                  onClick={onClearLocalStorage}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  Clear Storage
                </button>
              )}
            </div>
          </div>
        )}

      </div>



      {/* Mobile Action Bar - z-40 */}
<div className="md:hidden flex w-full items-center fixed bottom-0 left-0 p-4 bg-white justify-between gap-3 pb-20 border-t border-gray-200 shadow-lg z-40">


  {/* Save Button */}
  <SaveButton
    onClick={onSave}
    disabled={loading}
    isSaved={isSaved}
    loading={loading}
    size="sm"
    variant="mobile"
    className="flex-1 w-full"
    onAuthRequired={openAuthModal}
    redirectAfterSave={true}
    onSaveSuccess={(invoiceId) => {
      console.log('Invoice saved successfully, ID:', invoiceId);
    }}
  />

  {/* Download Button */}
  <button
    type="button"
    onClick={onDownload}
    disabled={loading}
    className="flex-1 px-4 min-w-40 w-full py-3 rounded-lg text-sm font-medium bg-gray-900 text-white flex items-center justify-center gap-2 hover:bg-gray-900 transition"
  >
    <Download size={16} />
    Download
  </button>

  {/* Preview Button */}
  <button
    type="button"
    onClick={onPreview}
    disabled={previewLoading}
    className="flex px-6 py-3 rounded-lg text-sm font-medium bg-gray-900 text-white flex items-center justify-center gap-2 transition"
  >
    {previewLoading ? (
      <Spinner size="sm" color="current" />
    ) : (
      <>
        <Eye size={20} />
      </>
    )}
  </button>

</div>

      {/* Mobile Last Saved Time Indicator */}
      {lastSavedTime && isSaved && (
        <div className="md:hidden fixed bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border z-30">
          Saved: {lastSavedTime}
        </div>
      )}
    </div>
    </>
  );
};

export default InvoiceSidebar;
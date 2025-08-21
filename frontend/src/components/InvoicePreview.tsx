import React from 'react';

interface InvoicePreviewProps {
  from: string;
  to: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  items: any[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  currency: any;
  logoUrl?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  from,
  to,
  invoiceNumber,
  issuedDate,
  dueDate,
  items,
  subtotal,
  taxAmount,
  discountAmount,
  shippingAmount,
  total,
  currency,
  logoUrl
}) => {
  const currencySymbol = typeof currency === 'string' ? currency : currency?.symbol || '$';
  const currencyCode = typeof currency === 'string' ? currency : currency?.code || 'USD';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-sm text-gray-600">#{invoiceNumber || 'INV-001'}</p>
          </div>
        </div>
      </div>

      {/* From/To Section */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">From:</h3>
          <div className="text-sm text-gray-600 whitespace-pre-line">
            {from || 'Your Business Name'}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">To:</h3>
          <div className="text-sm text-gray-600 whitespace-pre-line">
            {to || 'Client Name'}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Issued Date:</h3>
          <p className="text-sm text-gray-600">{issuedDate || 'Not set'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Due Date:</h3>
          <p className="text-sm text-gray-600">{dueDate || 'Not set'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Items:</h3>
        <div className="space-y-2">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name || 'Item Name'}</div>
                  {item.description && (
                    <div className="text-gray-600 text-xs">{item.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-gray-900">
                    {item.quantity || 1} × {currencySymbol}{(item.unit_cost || 0).toFixed(2)}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {currencySymbol}{((item.quantity || 1) * (item.unit_cost || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic">No items added</div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-900">{currencySymbol}{subtotal.toFixed(2)}</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">{currencySymbol}{taxAmount.toFixed(2)}</span>
          </div>
        )}
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="text-gray-900">-{currencySymbol}{discountAmount.toFixed(2)}</span>
          </div>
        )}
        {shippingAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping:</span>
            <span className="text-gray-900">{currencySymbol}{shippingAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;

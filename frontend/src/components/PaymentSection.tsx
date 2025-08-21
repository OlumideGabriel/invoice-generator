import React, { useState, useRef, useEffect } from 'react';
import { Plus, CreditCard, Building2 } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface PaymentSectionProps {
  paymentDetails: string;
  setPaymentDetails: (val: string) => void;
  terms: string;
  setTerms: (val: string) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ paymentDetails, setPaymentDetails, terms, setTerms }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { businesses, loading } = useBusiness();

  const handleClick = () => {
    setIsClicked(true);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsClicked(false);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPaymentDropdown(!showPaymentDropdown);
  };

  const handleBusinessSelect = (business: any) => {
    console.log('Selected business:', business);
    console.log('Payment info:', business.payment_info);
    if (business.payment_info) {
      setPaymentDetails(business.payment_info);
    }
    setShowPaymentDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPaymentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Payment Details</label>
        <div
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          ref={dropdownRef}
        >
          <textarea
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            onClick={handleClick}
            rows={3}
            className="md:w-2/3 md:max-w-80 w-full p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handlePlusClick}
            className={`absolute bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900
                rounded-full p-0.5 right-2 top-2 ease-in-ease-out transition-opacity duration-300
            ${isClicked ? "opacity-0" : isHovering ? "opacity-60" : "opacity-60 md:opacity-0"}`}
          >
            <Plus size={18} />
          </button>

          {/* Business Payment Info Dropdown */}
          {showPaymentDropdown && (
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Select Business Payment Info</h3>
                <p className="text-xs text-gray-500 mt-1">Choose from your business payment details</p>
              </div>
              
              {loading ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-500">Loading businesses...</div>
                </div>
              ) : businesses.length === 0 ? (
                <div className="p-4 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm text-gray-500 mb-2">No businesses found</div>
                  <div className="text-xs text-gray-400">Create a business profile in Settings</div>
                </div>
              ) : (
                <div className="p-2">
                  {console.log('Businesses in dropdown:', businesses)}
                  {businesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => handleBusinessSelect(business)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      disabled={!business.payment_info}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {business.logo_url ? (
                            <img
                              src={business.logo_url}
                              alt={`${business.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {business.name}
                          </div>
                          {business.payment_info ? (
                            <div className="mt-1 text-xs text-gray-600 truncate">
                              {business.payment_info}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-gray-400">
                              No payment info available
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Terms</label>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={3}
          className="md:w-2/3 md:max-w-80 w-full p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </>
  );
};

export default PaymentSection;

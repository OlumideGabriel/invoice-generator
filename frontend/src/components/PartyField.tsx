import React, { useState, useRef, useEffect } from 'react';
import { Plus, Building2, Mail, MapPin, Phone, Globe, FileText, User } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useClient } from '../context/ClientContext';

interface PartyFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PartyField: React.FC<PartyFieldProps> = ({ label, value, onChange }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showClientsDropdown, setShowClientsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { businesses, loading: businessesLoading } = useBusiness();
  const { clients, loading: clientsLoading } = useClient();

  const handleClick = () => {
    setIsClicked(true);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsClicked(false); // Reset on mouse leave
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (label === 'From') {
      setShowBusinessDropdown(!showBusinessDropdown);
      setShowClientsDropdown(false); // Close clients dropdown if open
    } else if (label === 'To') {
      setShowClientsDropdown(!showClientsDropdown);
      setShowBusinessDropdown(false); // Close business dropdown if open
    }
  };

  const handleBusinessSelect = (business: any) => {
    // Only insert the business name
    const syntheticEvent = {
      target: {
        value: business.name
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(syntheticEvent);
    setShowBusinessDropdown(false);
    
    // Trigger a custom event to notify parent about business selection
    const businessSelectEvent = new CustomEvent('businessSelected', {
      detail: business
    });
    window.dispatchEvent(businessSelectEvent);
  };

  const handleClientSelect = (client: any) => {
    // Only insert the client name
    const syntheticEvent = {
      target: {
        value: client.name
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(syntheticEvent);
    setShowClientsDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
        setShowClientsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="mb-6 w-full">
      <span className="block text-sm font-medium mb-2">{label}</span>
      <div
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={dropdownRef}
      >
        <textarea
          value={value}
          onChange={onChange}
          onClick={handleClick}
          rows={3}
          className="flex lg:w-64 w-full min-h-[80px] p-3 rounded-md bg-neutral-700 border
          !border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {(label === 'From' || label === 'To') && (
          <button
            onClick={handlePlusClick}
            className={`absolute bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900
                rounded-full p-0.5 right-2 top-2 ease-in-ease-out transition-opacity duration-300
            ${isClicked ? "opacity-0" : isHovering ? "opacity-60" : "opacity-60 md:opacity-0"}`}
          >
            <Plus size={18} />
          </button>
        )}

        {/* Business Selection Dropdown */}
        {showBusinessDropdown && label === 'From' && (
          <div className="absolute bottom-full right-0 mb-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Select Business</h3>
              <p className="text-xs text-gray-500 mt-1">Choose from your business profiles</p>
            </div>
            
                         {businessesLoading ? (
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
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    onClick={() => handleBusinessSelect(business)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
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
                        <div className="mt-1 space-y-1">
                          {business.email && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{business.email}</span>
                            </div>
                          )}
                          {business.address && (
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{business.address}</span>
                            </div>
                          )}
                          {business.phone && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{business.phone}</span>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center text-xs text-gray-600">
                              <Globe className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{business.website}</span>
                            </div>
                          )}
                          {business.tax_id && (
                            <div className="flex items-center text-xs text-gray-600">
                              <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Tax ID: {business.tax_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
                         )}
           </div>
         )}

         {/* Clients Selection Dropdown */}
         {showClientsDropdown && label === 'To' && (
           <div className="absolute bottom-full right-0 mb-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
             <div className="p-3 border-b border-gray-200">
               <h3 className="text-sm font-semibold text-gray-900">Select Client</h3>
               <p className="text-xs text-gray-500 mt-1">Choose from your client list</p>
             </div>
             
                           {clientsLoading ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-500">Loading clients...</div>
                </div>
              ) : clients.length === 0 ? (
                <div className="p-4 text-center">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm text-gray-500 mb-2">No clients found</div>
                  <div className="text-xs text-gray-400">Add clients in the Clients section</div>
                </div>
              ) : (
               <div className="p-2">
                 {clients.map((client) => (
                   <button
                     key={client.id}
                     onClick={() => handleClientSelect(client)}
                     className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                   >
                     <div className="flex items-start space-x-3">
                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                         <User className="w-4 h-4 text-blue-600" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="font-medium text-gray-900 text-sm truncate">
                           {client.name}
                         </div>
                         <div className="mt-1 space-y-1">
                           {client.email && (
                             <div className="flex items-center text-xs text-gray-600">
                               <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                               <span className="truncate">{client.email}</span>
                             </div>
                           )}
                           {client.address && (
                             <div className="flex items-center text-xs text-gray-600">
                               <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                               <span className="truncate">{client.address}</span>
                             </div>
                           )}
                           {client.phone && (
                             <div className="flex items-center text-xs text-gray-600">
                               <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                               <span className="truncate">{client.phone}</span>
                             </div>
                           )}
                         </div>
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
   );
 };

export default PartyField;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

interface PartyFieldProps {
  label: string;
  value: string;
  addLabel?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelect?: (item: PartyItem) => void;
  searchFunction?: (query: string, type: string) => Promise<PartyItem[]>;
  placeholder?: string;
  noResultsText?: string;
  type?: string; // Made more generic - can be 'client', 'business', 'vendor', etc.
  apiConfig?: {
    endpoint?: string;
    userId?: string;
    additionalParams?: Record<string, any>;
  };
  // React Router modal integration
  modalLink?: {
    create: string;
    edit: (id: string) => string;
  };
  // Generic modal component support
  ModalComponent?: React.ComponentType<any>;
  modalProps?: Record<string, any>; // Additional props to pass to the modal
}

interface PartyItem {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  logo?: string;
  description?: string;
  type?: string;
  tax_id?: string;
  invoice_count?: number;
  [key: string]: any; // Allow additional properties
}

const PartyField: React.FC<PartyFieldProps> = ({
  label,
  addLabel,
  value,
  onChange,
  onSelect,
  searchFunction,
  placeholder = "Type to search",
  noResultsText = "No results found",
  type = 'item',
  apiConfig,
  modalLink,
  ModalComponent, // Generic modal component
  modalProps = {} // Additional props for the modal
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<PartyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [allParties, setAllParties] = useState<PartyItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedItem, setSelectedItem] = useState<PartyItem | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = (message: string, successType = 'success') => {
    console.log(`${successType}: ${message}`);
    setIsModalOpen(false);
    // Refresh data
    if (apiConfig?.endpoint && apiConfig.userId) {
      fetchParties().then(parties => {
        setAllParties(parties);
      });
    }
    // If using React Router, navigate back
    if (modalLink) {
      navigate(-1);
    }
  };

  const openCreateModal = () => {
    if (modalLink) {
      // Use React Router navigation
      navigate(modalLink.create);
    } else if (ModalComponent) {
      // Use provided modal component
      setModalType('create');
      setSelectedItem(null);
      setIsModalOpen(true);
    } else {
      console.warn('No modal link or modal component provided');
    }
  };

  const openEditModal = (item: PartyItem) => {
    if (modalLink && item.id) {
      // Use React Router navigation
      navigate(modalLink.edit(item.id));
    } else if (ModalComponent) {
      // Use provided modal component
      setModalType('edit');
      setSelectedItem(item);
      setIsModalOpen(true);
    } else {
      console.warn('No modal link or modal component provided');
    }
  };

  // Check if we should show modal based on URL (for React Router integration)
  useEffect(() => {
    if (modalLink) {
      const currentPath = window.location.pathname;

      // Check if current path matches create pattern
      if (currentPath === modalLink.create) {
        setModalType('create');
        setSelectedItem(null);
        setIsModalOpen(true);
      }

      // Check if current path matches edit pattern
      // This assumes edit URLs follow a pattern like /{type}/edit/:id
      const editPattern = new RegExp(`/${type}/edit/(.+)`);
      const match = currentPath.match(editPattern);
      if (match && match[1]) {
        const itemId = match[1];
        // Find the item in search results or allParties
        const itemToEdit = [...searchResults, ...allParties].find(
          party => party.id.toString() === itemId
        );
        if (itemToEdit) {
          setModalType('edit');
          setSelectedItem(itemToEdit);
          setIsModalOpen(true);
        }
      }
    }
  }, [modalLink, searchResults, allParties, type]);

  // Fetch parties from API
  const fetchParties = useCallback(async (query?: string): Promise<PartyItem[]> => {
    try {
      // If a custom search function is provided, use it
      if (searchFunction) {
        return await searchFunction(query || '', type);
      }

      // If API config is provided, fetch from API
      if (apiConfig?.endpoint) {
        const params = new URLSearchParams({
          ...apiConfig.additionalParams,
          ...(apiConfig.userId && { user_id: apiConfig.userId }),
          ...(query && { search: query })
        });

        const response = await fetch(`${apiConfig.endpoint}?${params}`);
        const data = await response.json();

        // Handle different response structures
        if (data.success) {
          // Check for different possible response structures
          let items: any[] = [];

          if (Array.isArray(data.businesses)) {
            items = data.businesses;
          } else if (Array.isArray(data.clients)) {
            items = data.clients;
          } else if (Array.isArray(data.vendors)) {
            items = data.vendors;
          } else if (Array.isArray(data.data)) {
            items = data.data;
          } else if (Array.isArray(data)) {
            items = data;
          } else if (data[type + 's']) {
            // Dynamic key based on type (e.g., 'vendors', 'suppliers')
            items = data[type + 's'];
          }

          // Transform data to match PartyItem interface
          return items.map((item: any) => ({
            id: item.id || item._id || '',
            name: item.name || item.business_name || item.client_name || item.vendor_name || '',
            email: item.email || item.contact_email || '',
            address: item.address || item.business_address || '',
            phone: item.phone || item.contact_phone || '',
            tax_id: item.tax_id || item.tax_number || '',
            invoice_count: item.invoice_count || item.total_invoices || 0,
            logo: item.logo || item.name?.charAt(0).toUpperCase() || '?',
            description: `${item.email ? `Email: ${item.email}` : ''}${item.phone ? ` | Phone: ${item.phone}` : ''}${item.address ? ` | ${item.address}` : ''}${item.tax_id ? ` | Tax ID: ${item.tax_id}` : ''}`,
            type: type,
            ...item // Spread original item to preserve any additional properties
          }));
        } else {
          console.error(`Error fetching ${type}s:`, data.error);
          return [];
        }
      }

      // If no API config or search function, return empty array
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${type}s:`, error);
      return [];
    }
  }, [apiConfig, searchFunction, type]);

  // Memoize the default search function
  const defaultSearchFunction = useCallback(async (query: string): Promise<PartyItem[]> => {
    // If we have all parties data, filter locally
    if (allParties.length > 0 && !query.trim()) {
      return allParties;
    }

    if (allParties.length > 0 && query.trim()) {
      return allParties.filter(party =>
        party.name.toLowerCase().includes(query.toLowerCase()) ||
        party.email?.toLowerCase().includes(query.toLowerCase()) ||
        party.description?.toLowerCase().includes(query.toLowerCase()) ||
        party.tax_id?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Otherwise fetch from API
    return await fetchParties(query);
  }, [allParties, fetchParties]);

  // Initial data fetch if API config is provided
  useEffect(() => {
    if (apiConfig?.endpoint && apiConfig.userId) {
      setIsLoading(true);
      fetchParties().then(parties => {
        setAllParties(parties);
        setIsLoading(false);
      }).catch(error => {
        console.error('Failed to fetch parties:', error);
        setIsLoading(false);
      });
    }
  }, [apiConfig, fetchParties, type]);

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
    setShowDropdown(!showDropdown);
    if (!showDropdown && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTextareaFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleTextareaBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  const handlePartySelect = (party: PartyItem) => {
    const newValue = party.name;
    onChange({
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>);

    if (onSelect) {
      onSelect(party);
    }

    setShowDropdown(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Search effect based on input value
  useEffect(() => {
    if (!showDropdown) return;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const searchFn = searchFunction ?
          (query: string) => searchFunction(query, type) :
          defaultSearchFunction;

        const lastLine = value.split('\n').pop() || '';
        const results = await searchFn(lastLine);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 100);
    return () => clearTimeout(debounceTimer);
  }, [value, showDropdown, searchFunction, defaultSearchFunction, type]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <>
      {/* Generic Modal Component */}
      {isModalOpen && !modalLink && ModalComponent && (
        <ModalComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          data={modalType === 'edit' ? selectedItem : null}
          {...modalProps} // Spread additional props
        />
      )}

      <div className="w-full" ref={containerRef}>
        <span className="block md:w-64 text-xs text-neutral-500 font-medium">{label}</span>
        <div
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onClick={handleClick}
            autoComplete="off"
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            rows={3}
            className="flex w-full min-h-[80px] p-3 rounded-md bg-neutral-700 border
            !border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white
            transition-all duration-300 ease-in-out"
            placeholder={placeholder}
            aria-label={label}
          />
          {/* button that shows dropdown*/}
          <button
            type="button"
            onClick={openCreateModal}
            className={`absolute bg-gray-0 text-gray-700 hover:bg-gray-100 hover:text-gray-700
                rounded-full p-0.5 right-2 top-2 transition-all duration-300 ease-in-out
            ${isClicked ? "opacity-30 scale-95" : isHovering || isFocused ? "opacity-80 scale-105" : "opacity-80 md:opacity-0 scale-100"}
            ${showDropdown ? 'rotate-0' : 'rotate-0'}`}
            aria-label={`Add ${type}`}
          >
            <Plus size={18} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && user && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-60 overflow-y-auto
              transition-all duration-300 ease-in-out origin-top
              opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
              role="listbox"
              aria-label={`${type} suggestions`}
            >
              <div className="py-2">
                {searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((party) => (
                      <button
                        key={party.id}
                        onClick={() => handlePartySelect(party)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200 ease-in-out group flex items-center justify-between"
                        role="option"
                      >
                        <div className="flex items-center">
                          <div className="text-left">
                            <span className="font-medium text-gray-900 text-base transition-colors duration-200 ease-in-out group-hover:text-blue-600">
                              {party.name}
                            </span>
                            {party.description && (
                              <p className="text-sm hidden text-gray-500 mt-1">{party.description}</p>
                            )}
                          </div>
                        </div>
                        {party.logo && (
                          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0 ">
                            <span className="text-white text-sm font-medium">{party.logo}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-1.5 py-0 text-center">
                    {modalLink ? (
                      // Use React Router Link for navigation
                      <Link
                        to={modalLink.create}
                        className="flex hover:bg-gray-100 items-center w-full justify-center gap-2 py-3 px-3 text-md text-gray-600
                        rounded-md transition-colors cursor-pointer"
                      >
                        <Plus size={20} />
                        {addLabel || `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                      </Link>
                    ) : (
                      // Fallback to button with local state
                      <button
                        onClick={openCreateModal}
                        className="flex bg-gray-50 hover:bg-gray-100 items-center w-full justify-center gap-2 py-2.5 px-3 text-md text-gray-600
                        rounded-md transition-colors cursor-pointer"
                      >
                        <Plus size={20} />
                        {addLabel || `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PartyField;
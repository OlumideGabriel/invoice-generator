import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';

interface PartyFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelect?: (item: PartyItem) => void;
  searchFunction?: (query: string, type: 'client' | 'business') => Promise<PartyItem[]>;
  placeholder?: string;
  noResultsText?: string;
  type?: 'client' | 'business';
  apiConfig?: {
    endpoint?: string;
    userId?: string;
    additionalParams?: Record<string, any>;
  };
}

interface PartyItem {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  logo?: string;
  description?: string;
  type?: 'client' | 'business';
  tax_id?: string;
  invoice_count?: number;
}

const PartyField: React.FC<PartyFieldProps> = ({
  label,
  value,
  onChange,
  onSelect,
  searchFunction,
  placeholder = "Type to search",
  noResultsText = "No results found",
  type = 'client',
  apiConfig
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
          } else if (Array.isArray(data.data)) {
            items = data.data;
          } else if (Array.isArray(data)) {
            items = data;
          } else if (data.invoices) {
            // Handle case where data might be nested under invoices key
            items = data.invoices;
          }

          // Transform data to match PartyItem interface
          return items.map((item: any) => ({
            id: item.id || item._id || '',
            name: item.name || item.business_name || item.client_name || '',
            email: item.email || item.contact_email || '',
            address: item.address || item.business_address || '',
            phone: item.phone || item.contact_phone || '',
            tax_id: item.tax_id || item.tax_number || '',
            invoice_count: item.invoice_count || item.total_invoices || 0,
            logo: item.logo || item.name?.charAt(0).toUpperCase() || '?',
            description: `${item.email ? `Email: ${item.email}` : ''}${item.phone ? ` | Phone: ${item.phone}` : ''}${item.address ? ` | ${item.address}` : ''}${item.tax_id ? ` | Tax ID: ${item.tax_id}` : ''}`,
            type: type
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
          onFocus={handleTextareaFocus}
          onBlur={handleTextareaBlur}
          rows={3}
          className="flex w-full min-h-[80px] p-3 rounded-md bg-neutral-700 border
          !border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white
          transition-all duration-300 ease-in-out"
          placeholder={placeholder}
          aria-label={label}
        />
        <button
          type="button"
          onClick={handlePlusClick}
          className={`absolute hidden bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900
              rounded-full p-0.5 right-2 top-2 transition-all duration-300 ease-in-out
          ${isClicked ? "opacity-0 scale-95" : isHovering || isFocused ? "opacity-60 scale-105" : "opacity-60 md:opacity-0 scale-100"}
          ${showDropdown ? 'rotate-45' : 'rotate-0'}`}
          aria-label={`Add ${type}`}
        >
          <Plus size={18} />
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-60 overflow-y-auto
            transition-all duration-300 ease-in-out origin-top
            opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
            role="listbox"
            aria-label={`${type} suggestions`}
          >
            <div className="py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading {type === 'business' ? 'businesses' : 'clients'}...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((party) => (
                    <button
                      key={party.id}
                      onClick={() => handlePartySelect(party)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 ease-in-out group flex items-center justify-between"
                      role="option"
                    >
                      <div className="flex items-center">
                        {party.logo && (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                            <span className="text-white text-sm font-medium">{party.logo}</span>
                          </div>
                        )}
                        <div className="text-left">
                          <span className="font-medium text-gray-900 text-base transition-colors duration-200 ease-in-out group-hover:text-blue-600">
                            {party.name}
                          </span>
                          {party.description && (
                            <p className="text-sm hidden text-gray-500 mt-1">{party.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 ease-in-out group-hover:bg-blue-600 group-hover:scale-110">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center mx-2 gap-2 py-4 px-4 text-sm text-gray-600
                hover:text-gray-800 hover:bg-gray-100 rounded-lg  transition-colors cursor-pointer">
                  <Plus className="hidden" size={16} />
                  <span>{noResultsText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyField;
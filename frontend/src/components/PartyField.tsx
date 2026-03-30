import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PartyFieldProps {
  label: string;
  value: string;
  addLabel?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelect?: (item: PartyItem) => void;
  onClear?: () => void; // ✅ optional clear callback
  searchFunction?: (query: string, type: string) => Promise<PartyItem[]>;
  placeholder?: string;
  noResultsText?: string;
  type?: string;
  apiConfig?: {
    endpoint?: string;
    userId?: string;
    additionalParams?: Record<string, any>;
  };
  modalLink?: {
    create: string;
    edit: (id: string) => string;
  };
  ModalComponent?: React.ComponentType<any>;
  modalProps?: Record<string, any>;
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
  [key: string]: any;
}

const PartyField: React.FC<PartyFieldProps> = ({
  label,
  addLabel,
  value,
  onChange,
  onSelect,
  onClear,
  searchFunction,
  placeholder = "Type to search",
  noResultsText = "No results found",
  type = "item",
  apiConfig,
  modalLink,
  ModalComponent,
  modalProps = {},
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<PartyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [allParties, setAllParties] = useState<PartyItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<PartyItem | null>(null); // ✅ new
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [selectedItem, setSelectedItem] = useState<PartyItem | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const STORAGE_KEY = `selectedParty_${type}`;

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (apiConfig?.endpoint && apiConfig.userId) {
      fetchParties().then((parties) => setAllParties(parties));
    }
    if (modalLink) navigate(-1);
  };

  const openCreateModal = () => {
    if (modalLink) {
      navigate(modalLink.create);
    } else if (ModalComponent) {
      setModalType("create");
      setSelectedItem(null);
      setIsModalOpen(true);
    }
  };

  const fetchParties = useCallback(
    async (query?: string): Promise<PartyItem[]> => {
      try {
        if (searchFunction) return await searchFunction(query || "", type);

        if (apiConfig?.endpoint) {
          const params = new URLSearchParams({
            ...apiConfig.additionalParams,
            ...(apiConfig.userId && { user_id: apiConfig.userId }),
            ...(query && { search: query }),
          });

          const response = await fetch(`${apiConfig.endpoint}?${params}`);
          const data = await response.json();

          if (data.success) {
            let items: any[] = [];
            if (Array.isArray(data.businesses)) items = data.businesses;
            else if (Array.isArray(data.clients)) items = data.clients;
            else if (Array.isArray(data.vendors)) items = data.vendors;
            else if (Array.isArray(data.data)) items = data.data;
            else if (Array.isArray(data)) items = data;
            else if (data[type + "s"]) items = data[type + "s"];

            return items.map((item: any) => ({
              id: item.id || item._id || "",
              name: item.name || item.business_name || item.client_name || "",
              email: item.email || "",
              address: item.address || "",
              phone: item.phone || "",
              tax_id: item.tax_id || "",
              invoice_count: item.invoice_count || 0,
              logo: item.name?.charAt(0).toUpperCase() || "?",
              type,
              ...item,
            }));
          }
          return [];
        }
        return [];
      } catch (error) {
        console.error(`Failed to fetch ${type}s:`, error);
        return [];
      }
    },
    [apiConfig, searchFunction, type],
  );

  const defaultSearchFunction = useCallback(
    async (query: string): Promise<PartyItem[]> => {
      if (allParties.length > 0) {
        if (!query.trim()) return allParties;
        return allParties.filter(
          (party) =>
            party.name.toLowerCase().includes(query.toLowerCase()) ||
            party.email?.toLowerCase().includes(query.toLowerCase()) ||
            party.tax_id?.toLowerCase().includes(query.toLowerCase()),
        );
      }
      return await fetchParties(query);
    },
    [allParties, fetchParties],
  );

  useEffect(() => {
    if (apiConfig?.endpoint && apiConfig.userId) {
      setIsLoading(true);
      fetchParties()
        .then((parties) => {
          setAllParties(parties);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [apiConfig?.endpoint, apiConfig?.userId]);

  useEffect(() => {
    if (!showDropdown) return;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const searchFn = searchFunction
          ? (query: string) => searchFunction(query, type)
          : defaultSearchFunction;
        const lastLine = value.split("\n").pop() || "";
        const results = await searchFn(lastLine);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 100);
    return () => clearTimeout(debounceTimer);
  }, [value, showDropdown, searchFunction, defaultSearchFunction, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // ✅ Load selectedParty from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSelectedParty(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [STORAGE_KEY]);

  // ✅ Save selectedParty to localStorage when it changes
  useEffect(() => {
    try {
      if (selectedParty) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedParty));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [selectedParty, STORAGE_KEY]);

  const handlePartySelect = (party: PartyItem) => {
    onChange({
      target: { value: party.name },
    } as React.ChangeEvent<HTMLTextAreaElement>);
    if (onSelect) onSelect(party);
    setSelectedParty(party); // ✅ store selected party
    localStorage.setItem(STORAGE_KEY, JSON.stringify(party)); // ✅ persist immediately
    setShowDropdown(false);
  };

  // ✅ Clear selected party and reset field
  const handleClear = () => {
    setSelectedParty(null);
    localStorage.removeItem(STORAGE_KEY); // ✅ clear from storage
    onChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLTextAreaElement>);
    if (onClear) onClear();
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <>
      {isModalOpen && !modalLink && ModalComponent && (
        <ModalComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          data={modalType === "edit" ? selectedItem : null}
          {...modalProps}
        />
      )}

      <div className="w-full" ref={containerRef}>
        <span className="block md:w-64 text-xs text-neutral-500 font-medium mb-1">
          {label}
        </span>

        {/* ✅ Selected party block */}
        {selectedParty ? (
          <div
            className="relative group rounded-md bg-neutral-200 border border-gray-300 p-3 min-h-[80px]"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/*
              X button design:
              - Mobile: always visible (opacity-100), standard size
              - Desktop (md+): hidden by default, fades in on hover with slight scale-up
              - Shape: circle, red on hover for clear destructive affordance
              - Size: w-7 h-7 (28px) — large enough to tap comfortably on mobile
            */}
            <button
              type="button"
              onClick={handleClear}
              className={`
                absolute top-2 right-2
                flex items-center justify-center
                w-6 h-6 rounded-md
                bg-neutral-400 hover:bg-red-500
                text-white shadow-sm
                transition-all duration-200 ease-in-out
                opacity-100 scale-100
                md:opacity-0 md:scale-90
                ${isHovering ? "md:opacity-100 md:scale-100" : ""}
              `}
              aria-label="Clear selection"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Selected party info — not clickable */}
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {selectedParty.logo}
                </span>
              </div>
              <div>
                <p className="text-neutral-800 font-medium text-sm">
                  {selectedParty.name}
                </p>
                {selectedParty.email && (
                  <p className="text-neutral-600 text-xs">
                    {selectedParty.email}
                  </p>
                )}
                {selectedParty.address && (
                  <p className="text-neutral-400 hidden text-xs">
                    {selectedParty.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // ✅ Normal textarea + dropdown when nothing selected
          <div
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              setIsClicked(false);
            }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onClick={() => setIsClicked(true)}
              autoComplete="off"
              onFocus={() => {
                setIsFocused(true);
                setShowDropdown(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowDropdown(false), 150);
              }}
              rows={3}
              className="flex w-full min-h-[80px] p-3 rounded-md bg-neutral-700 border
                !border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white
                transition-all duration-300 ease-in-out"
              placeholder={placeholder}
              aria-label={label}
            />

            {user && (
              <button
                type="button"
                onClick={openCreateModal}
                className={`absolute bg-gray-0 text-gray-700 hover:bg-gray-100
                  rounded-full p-0.5 right-2 top-2 transition-all duration-300 ease-in-out
                  ${isClicked ? "opacity-30 scale-95" : isHovering || isFocused ? "opacity-80 scale-105" : "opacity-80 md:opacity-0 scale-100"}`}
                aria-label={`Add ${type}`}
              >
                <Plus size={18} />
              </button>
            )}

            {showDropdown && user && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl
                  border border-gray-200 z-50 max-h-60 overflow-y-auto"
                role="listbox"
              >
                <div className="py-2">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((party) => (
                      <button
                        key={party.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePartySelect(party)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        role="option"
                      >
                        <div>
                          <span className="font-medium text-gray-900 text-base">
                            {party.name}
                          </span>
                          {party.email && (
                            <p className="text-xs hidden text-gray-400">
                              {party.email}
                            </p>
                          )}
                        </div>
                        <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {party.logo}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-1.5 py-0 text-center">
                      {modalLink ? (
                        <Link
                          to={modalLink.create}
                          className="flex hover:bg-gray-100 items-center w-full justify-center gap-2 py-3 px-3 text-sm text-gray-600 rounded-md transition-colors"
                        >
                          <Plus size={18} />
                          {addLabel ||
                            `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                        </Link>
                      ) : (
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={openCreateModal}
                          className="flex bg-gray-50 hover:bg-gray-100 items-center w-full justify-center gap-2 py-2.5 px-3 text-sm text-gray-600 rounded-md transition-colors"
                        >
                          <Plus size={18} />
                          {addLabel ||
                            `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PartyField;

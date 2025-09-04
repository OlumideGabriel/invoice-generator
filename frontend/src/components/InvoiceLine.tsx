import React from 'react';
import { ChevronDown, ChevronUp, X, GripVertical, Trash2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

type DraggableProvided = any;
type DraggableStateSnapshot = any;

// Drag styles for react-beautiful-dnd
const dragStyles = {
  base: {
    transition: 'box-shadow 0.2s cubic-bezier(.08,.52,.52,1)',
    boxShadow: 'none',
  },
  dragging: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
    zIndex: 2,
  },
  static: {
    boxShadow: 'none',
    zIndex: 1,
  },
};

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_cost: number;
  showDesc?: boolean;
  [key: string]: any;
}

export interface InvoiceLineProps {
  item: InvoiceItem;
  index: number;
  draggableId: string;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onChange: (index: number, field: string, value: string | number) => void;
  onRemove: (index: number) => void;
  onToggleDescription: (index: number) => void;
  itemsLength: number;
}

// Hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const InvoiceLine: React.FC<InvoiceLineProps> = ({
  item,
  index,
  onChange,
  onRemove,
  onToggleDescription,
  itemsLength,
  provided,
  snapshot,
  draggableId
}) => {
  const { currency } = useCurrency();
  const isMobile = useIsMobile();

  // Create conditional drag props - disable on mobile
  const dragProps = isMobile ? {} : provided.draggableProps;
  const dragHandleProps = isMobile ? {} : provided?.dragHandleProps;

  return (
    <div
      ref={provided.innerRef}
      {...dragProps}
      style={{
        ...dragProps.style,
        marginBottom: '5px',
      }}
      className={`flex-2 group rounded-xl transition-all duration-200 items-start border-none ${
        snapshot?.isDragging ? 'border-emerald-300 shadow-lg bg-gray-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Drag handle icon - hidden on mobile */}
      <div
        className={`flex items-center justify-center self-center rounded-xs
        active:cursor-grabbing border-gray-200 ${
          isMobile ? 'cursor-default' : 'cursor-grab'
        }`}
        {...dragHandleProps}
        style={{ touchAction: isMobile ? 'auto' : 'none' }}
      >
        <GripVertical
          size={25}
          className={`transition-colors ${
            snapshot?.isDragging ? 'text-emerald-600' :
            isMobile ? 'hidden' : 'hidden md:block text-neutral-400 hover:text-emerald-500'
          }`}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 p-1.5 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl md:rounded-r-xl">
        <div className="flex w-full flex-wrap lg:flex-nowrap gap-1.5">
          {/* Item name and description section */}
          <div className="relative flex-2 w-full">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Enter item name"
                value={item.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border !border-gray-300 rounded-lg
                  text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500
                  focus:border-transparent transition-all duration-200 text-md font-medium"
              />
              <button
                type="button"
                onClick={() => onToggleDescription(index)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all
                  duration-200 bg-green-50 hover:text-green-800 hover:bg-green-100 text-green-600 rounded-full p-0.5"
                aria-label={item.showDesc ? 'Hide description' : 'Show description'}
                aria-expanded={item.showDesc}
              >
                {item.showDesc ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
              </button>
            </div>

            {/* Description textarea */}
            {item.showDesc && (
              <div className="mt-1.5 animate-in slide-in-from-top-2 duration-200">
                <textarea
                  placeholder="Add item description or notes..."
                  value={item.description || ''}
                  onChange={(e) => onChange(index, 'description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border !border-gray-300 rounded-lg text-gray-700
                  placeholder-gray-500 text-md focus:outline-none focus:ring-2 focus:ring-emerald-500
                  focus:border-transparent transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>
          {/* Quantity input */}
          <div className="flex flex-col">
            <input
              type="text"
              value={item.quantity ?? "1"}
              onChange={(e) => {
                const val = e.target.value;

                // Allow empty string, but only digits (no decimals for qty)
                if (val === "" || /^[0-9]+$/.test(val)) {
                  onChange(index, "quantity", val);
                }
              }}
              className="w-20 px-3 py-2.5 bg-gray-50 border !border-gray-300 rounded-lg text-gray-900 text-center text-md font-medium
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          {/* Unit cost and amount section */}
          <div className="md:flex flex-1 flex-col md:flex-row items-start gap-4">
            {/* Unit cost input */}
            <div className="flex flex-col">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  {currency.symbol}
                </span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={item.unit_cost}
                  onChange={(e) => {
                    const val = e.target.value;

                    // Allow empty string, but validate number
                    if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      onChange(index, "unit_cost", val);
                    }
                  }}
                  className="md:w-32 w-full pl-8 pr-3 py-2.5 bg-gray-50 border !border-gray-300 rounded-lg text-gray-900 text-md font-medium
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            {/* Amount display */}
            <div className="flex flex-col w-full">
              <div className="flex md:items-center justify-end md:justify-start min-w-40 mt-1 md:mt-0 py-2.5 rounded-lg">
                  <div className="text-md  font-semibold text-emerald-900">
                    <span className="text-sm mr-2 text-gray-600 font-medium">
                      {currency.code}
                    </span>
                    {(item.quantity * item.unit_cost).toFixed(2)}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove button */}
      <div className={`flex flex-col justify-center self-center bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500
           cursor-pointer
      ml-2 p-1 rounded-lg cursor-pointer ${itemsLength > 1 ? 'small-icon transition-colors' : 'hidden'}`}
        onClick={() => onRemove(index)}
        aria-label="Remove item"
      >
        <X size={18} />
      </div>
    </div>
  );
};

export default InvoiceLine;
import React, { useRef, useState, useEffect } from 'react';
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
  const [isSwiping, setIsSwiping] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const touchAreaRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't allow swipe if this is the last item
    if (itemsLength <= 1) return;

    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't allow swipe if this is the last item
    if (itemsLength <= 1 || !isSwiping) return;

    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;

    // Only allow right-to-left swipe
    if (diff > 0) {
      setCurrentX(-Math.min(diff, 100)); // Limit swipe distance

      // Show delete if swiped more than 60% of the threshold
      if (diff > 60) {
        setShowDelete(true);
      } else {
        setShowDelete(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    setIsSwiping(false);

    // If swiped beyond threshold and not the last item, trigger delete
    if (showDelete && itemsLength > 1) {
      onRemove(index);
    }

    // Reset position
    setCurrentX(0);
    setShowDelete(false);
  };

  // Reset swipe if the user starts interacting with form elements
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isSwiping) {
        setCurrentX(0);
        setShowDelete(false);
        setIsSwiping(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isSwiping]);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        marginBottom: '5px',
        transform: `translateX(${currentX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.3s ease',
      }}
      className={`flex group rounded-xl transition-all duration-200 items-start border-none relative ${
        snapshot?.isDragging ? 'border-emerald-300 shadow-lg bg-gray-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Swipe to delete hint for mobile - only show if not the last item */}
      {itemsLength > 1 && (
        <div className="md:hidden absolute inset-y-0 right-0 flex items-center justify-end pr-2 bg-red-50 text-red-500 rounded-xl w-20">
          <Trash2 size={20} />
        </div>
      )}

      {/* Touch area for swipe gestures on mobile - only enable if not the last item */}
      {itemsLength > 1 && (
        <div
          ref={touchAreaRef}
          className="md:hidden absolute inset-0 z-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        />
      )}

      {/* Drag handle icon - hidden on mobile */}
      <div
        className="hidden md:flex items-center justify-center self-center rounded-xs cursor-grab
        active:cursor-grabbing border-gray-200"
        {...provided?.dragHandleProps}
        style={{ touchAction: 'none' }}
      >
        <GripVertical
          size={25}
          className={`transition-colors ${
            snapshot?.isDragging ? 'text-emerald-600' : 'text-neutral-400 hover:text-emerald-500'
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

      {/* Remove button - visible on desktop, hidden on mobile (we use swipe instead) */}
      <div className={`hidden md:flex flex-col justify-center self-center bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500
           cursor-pointer ml-2 p-1 rounded-lg ${itemsLength > 1 ? 'small-icon transition-colors' : 'hidden'}`}
        onClick={() => itemsLength > 1 && onRemove(index)}
        aria-label="Remove item"
      >
        <X size={18} />
      </div>

      {/* Swipe delete indicator for mobile - only show if not the last item */}
      {showDelete && itemsLength > 1 && (
        <div className="md:hidden absolute inset-0 bg-red-100 flex items-center justify-end pr-4 rounded-xl">
          <div className="text-red-600 font-medium flex items-center">
            <Trash2 size={18} className="mr-2" />
            Remove
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceLine;
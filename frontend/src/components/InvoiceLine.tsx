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

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        marginBottom: '5px',
      }}
      className={`flex-2 group rounded-xl transition-all duration-200 items-start border-none ${
        snapshot?.isDragging ? 'border-emerald-300 shadow-lg bg-gray-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Drag handle icon */}

      <div 
        className="flex items-center justify-center self-center rounded-xs cursor-grab
        active:cursor-grabbing border-gray-200"
        {...provided?.dragHandleProps}
        style={{ touchAction: 'none' }}
      >
        <GripVertical 
          size={25}
          className={`transition-colors ${
            snapshot?.isDragging ? 'text-emerald-600' : 'hidden md:block text-neutral-400 hover:text-emerald-500'
          }`} 
        />

      
      {/* Main content area */}
      <div className="flex-1 p-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-xl md:rounded-r-xl">
        <div className="flex w-full flex-wrap md:flex-nowrap gap-2">
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
              <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
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
              type="number"
              placeholder="1"
              value={item.quantity}
              min={1}
              onChange={(e) => onChange(index, 'quantity', Number(e.target.value))}
              className="w-20 px-3 py-2.5 bg-gray-50 border !border-gray-300 rounded-lg text-gray-900 text-center text-md font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
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
                  type="number"
                  placeholder="0.00"
                  value={item.unit_cost}
                  min={0}
                  step={0.01}
                  onChange={(e) => onChange(index, 'unit_cost', Number(e.target.value))}
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
      <div className={`flex hidden flex-col justify-center self-center bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600
          self-stretch cursor-pointer
      ml-1 p-2 rounded-lg cursor-pointer ${itemsLength > 1 ? ' transition-colors' : 'hidden'}`}

        onClick={() => onRemove(index)}
        aria-label="Remove item"
      >
      <X size={18} />


      </div>
      <button
          onClick={() => onRemove(index)}
          className={`p-1 md:flex  rounded-lg transition-all duration-200 ease-in-out ml-2 focus:outline-none focus:ring-2
              focus:ring-red-500 focus:ring-offset-1 ${itemsLength > 1 ? 'small-icon transition-colors' : 'md:hidden'}`}
          aria-label="Remove item"
        >
          <X size={18} />

        </button>
    </div>
    </div>
  );
};

export default InvoiceLine;

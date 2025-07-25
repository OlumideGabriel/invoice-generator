import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface PartyFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PartyField: React.FC<PartyFieldProps> = ({ label, value, onChange }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

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

  return (
    <div className="mb-6 w-full">
    <span className="block text-sm font-medium mb-2">{label}</span>
      <div
        className="relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

        <textarea
          value={value}
          onChange={onChange}
          onClick={handleClick}
          rows={3}
          className="flex md:w-64 w-full min-h-[100px] p-3 rounded-md bg-neutral-700 border
          border-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          className={`absolute bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900
              rounded-full p-0.5 right-2 top-2 ease-in-ease-out transition-opacity duration-300
          ${isClicked ? "opacity-0" : isHovering ? "opacity-60" : "opacity-60 md:opacity-0"}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

export default PartyField;
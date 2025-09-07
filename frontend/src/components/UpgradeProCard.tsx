import { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function UpgradeProCard() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex items-start z-10 w-full">
      <div className="bg-[#d2fee1] shadow-xs p-4 hover:shadow-sm transition-shadow relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-transparent hover:bg-[#8eda91] flex items-center justify-center transition-colors group"
          aria-label="Close upgrade card"
        >
          <X className="w-4 h-4 text-[#0e423e] group-hover:text-gray-700" />
        </button>

        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-3 pr-6">
          <h3 className="font-semibold text-[#0e423e]">Upgrade to Pro</h3>
        </div>

        {/* Single benefit */}
        <p className="text-sm text-[#0e423e] text-left mb-4">
          Unlock all features and get priority support
        </p>

        {/* CTA Button */}
        <button onClick={() => navigate("/settings?section=billing")} className="w-full hover:from-green-600 hover:to-emerald-700 border border-[#0e423e] hover:bg-[#8eda91] text-[#0e423e]
         text-sm font-medium rounded-sm px-2 py-0.5 transition-all duration-200 hover:shadow-green-500/25 ring-1 ring-green-400/20">
          Get Pro
        </button>

        {/* Price */}
        <p className="text-left hidden text-sm !font-semibold text-[#132a29] mt-2">
          From $2.99/mo
        </p>
      </div>
    </div>
  );
}
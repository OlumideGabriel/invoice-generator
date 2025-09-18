import { useState } from 'react';
import { X, Crown, Plus} from 'lucide-react';
import { useNavigate } from "react-router-dom";

export default function Advert() {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) {
    return null;
  }

  return (
      <a href="https://medium.com/@talktoolumide/it-started-with-a-familiar-pain-point-f33f26b85d3a" target="_blank" rel="noopener noreferrer" className="flex items-start z-10 w-full hover:contrast-125">
    <div className="flex items-start z-10 w-full">
      <div className="w-full">
      <div className="bg-[#8eda91] hover:bg-[#8eda91] shadow-xs hidden xl:block p-4 transition-all duration-200 ease-in-out relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 w-5 h-5 hidden rounded-full bg-transparent hover:bg-[#8eda91] flex items-center justify-center transition-colors group"
          aria-label="Close upgrade card"
        >
          <X className="w-4 h-4 text-[#0e423e] group-hover:text-gray-700" />
        </button>

        {/* Header with icon */}
        <div className="flex items-center mb-1 pr-6">
          <h3 className="font-medium text-3xl text-[#0e423e]">500</h3><Plus className="text-[#0e423e]" size={30}/>
        </div>

        {/* Single benefit */}
        <p className="text-sm text-[#0e423e] text-left mb-4">
          How we got our first 500 users without running Ads
        </p>

        {/* CTA Button */}
        <button href="https://medium.com/@talktoolumide/it-started-with-a-familiar-pain-point-f33f26b85d3a" className="w-full hover:from-green-600 hover:to-emerald-700 border border-[#0e423e] hover:bg-[#8eda91] text-[#0e423e]
         text-sm font-medium rounded-sm px-2 py-0.5 transition-all duration-200 hover:shadow-green-500/25 ring-1 ring-green-400/20">
          Read Article

        </button>


        {/* Price */}
        <div className="text-left px-2.5 py-0.5 hidden bg-black/20 rounded-full !font-medium text-xs text-[#132a29] w-fit -mb-1 mt-4">
          Article on medium
        </div>

      </div>
      <img
        src="/advert-3.png"
        alt="Envoyce Logo"
        className="w-full bg-cover bg-green-500"
      />
      </div>

      {/* Upgrade Mobile */}
      <div className="w-full flex xl:hidden justify-center items-center">
          <button
            onClick={() => navigate("/settings?section=billing")}
            className="bg-[#d2fee1] shadow-xs py-2 w-full rounded-md hover:shadow-sm hover:bg-[#8eda91] transition-shadow
             relative flex flex-col items-center justify-center"
          >
            <Crown className="text-[#0e423e]" size={20} />
            <span className="text-xs font-medium mt-0.5 text-[#0e423e]">Pro</span>
          </button>
        </div>


    </div>
    </a>
  );
}
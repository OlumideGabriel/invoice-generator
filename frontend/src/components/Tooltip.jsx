import React from 'react';

const Tooltip = ({ message, children, position = 'center' }) => {
  const isTop = position === 'top';

  return (
    <div className="relative group inline-block">
      {children}

      {/* Tooltip bubble */}
      <div
        className={`absolute ${isTop ? 'bottom-full' : 'top-full'} left-1/2 transform -translate-x-1/2
          ${isTop ? 'mb-2' : 'mt-2'}
          w-max max-w-xs px-2 py-1 bg-gray-800 text-white text-sm
          rounded-md shadow-lg opacity-0 group-hover:opacity-100
          transition-opacity duration-200 delay-500 z-10 pointer-events-none`}
      >
        {message}

        {/* Arrow */}
        <div
          className={`absolute ${isTop ? '-bottom-2' : '-top-1'} left-1/2 transform -translate-x-1/2
            w-3 h-3 bg-gray-800 rotate-45 z-[-1]`}
        ></div>
      </div>
    </div>
  );
};

export default Tooltip;

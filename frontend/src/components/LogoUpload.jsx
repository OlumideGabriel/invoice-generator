// components/LogoUpload.jsx
import React, { useRef } from 'react';

const LogoUpload = ({ logoFile, logoStatus, handleLogoChange }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation(); // Prevent triggering upload on click
    handleLogoChange({ target: { files: [] } });
  };

  return (
    <div className="mb-6">

      <div
        onClick={handleClick}
        className="h-40 max-w-xs border border-gray-200 bg-gray-50 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 transition relative group overflow-hidden"
      >
        {logoFile ? (
          <>
            <img
              src={URL.createObjectURL(logoFile)}
              alt="Logo Preview"
              className="max-h-full max-w-full object-contain"
            />

            {/* Replace overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <span className="text-sm font-medium">Replace Logo</span>
            </div>

            {/* Remove X button */}
            <button
              onClick={handleRemoveLogo}
              className="absolute top-1 left-1 bg-white text-black rounded-1/5 w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-indigo-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Remove logo"
            >
              ×
            </button>
          </>
        ) : (
          <span className="text-gray-400 text-lg font-medium">
            + Add Your Logo
          </span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        ref={fileInputRef}
        className="hidden"
      />

      {logoStatus && (
        <p className="mt-2 text-sm text-indigo-400">{logoStatus}</p>
      )}
    </div>
  );
};

export default LogoUpload;

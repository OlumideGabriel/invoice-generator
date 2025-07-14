// components/LogoUpload.jsx
import React, { useRef, useState } from 'react';

const LogoUpload = ({ logoFile, logoUrl, logoStatus, handleLogoChange }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);

      try {
        // Upload to backend
        const formData = new FormData();
        formData.append('logo', file);

        const response = await fetch('http://localhost:5000/upload-logo', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          // Pass both file and URL to parent component
          handleLogoChange(file, result.logo_url);
        } else {
          const error = await response.json();
          console.error('Upload failed:', error);
          // Still show preview locally but no backend URL
          handleLogoChange(file, null);
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Still show preview locally but no backend URL
        handleLogoChange(file, null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    handleLogoChange(null, null);
  };

  return (
    <div className="mb-6 w-64">
      <div
        onClick={handleClick}
        className="h-40 max-w-xs border-2 border-dashed border-indigo-500 bg-indigo-900 rounded-lg flex
        items-center justify-center cursor-pointer hover:border-indigo-400 transition relative group overflow-hidden"
      >
        {logoFile ? (
          <>
            <img
              src={URL.createObjectURL(logoFile)}
              alt="Logo Preview"
              className="max-h-full max-w-full object-contain bg-white-900 p-4"
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
          <span className="text-indigo-400 text-lg font-medium">
            {isUploading ? 'Uploading...' : '+ Add Your Logo'}
          </span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
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
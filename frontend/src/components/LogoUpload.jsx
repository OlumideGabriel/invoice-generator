// components/LogoUpload.jsx
import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

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
        className="h-40 max-w-xs border-2 border-dashed border-3 bg-green-100 rounded-xl flex
        items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-200
        transition relative group overflow-hidden"
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
              className="absolute top-1 left-1 small-icon rounded-1/2 p-1 opacity-0 group-hover:opacity-100
              transition-opacity duration-200 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Remove logo">

              <X size={12}/>
            </button>
          </>
        ) : (
          <span className="text-green-500 text-lg font-medium">
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
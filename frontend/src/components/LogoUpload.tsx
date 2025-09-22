import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface LogoUploadProps {
  logoFile: File | null;
  logoUrl: string | null;
  logoStatus: string;
  handleLogoChange: (file: File | null, url: string | null) => void;
}

const LogoUpload: React.FC<LogoUploadProps> = ({ logoFile, logoUrl, logoStatus, handleLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        // Upload to backend
        const formData = new FormData();
        formData.append('logo', file);
        const response = await fetch(`${API_BASE_URL}upload-logo`, {
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
          handleLogoChange(file, null);
        }
      } catch (error) {
        console.error('Upload error:', error);
        handleLogoChange(file, null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleLogoChange(null, null);
  };

  return (
    <div className="mb-6 w-full sm:w-64">
      <div
        onClick={handleClick}
        className="h-40 md:max-w-xs border-2 border-dashed border-3 bg-green-100 rounded-xl flex items-center
        justify-center cursor-pointer hover:border-green-400 transition relative group overflow-hidden"
      >
        {isUploading ? (
          // SVG Loader Animation
          <div className="flex flex-col items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 38 38"
              xmlns="http://www.w3.org/2000/svg"
              className="text-green-500"
            >
              <defs>
                <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
                  <stop stopColor="currentColor" stopOpacity="0" offset="0%" />
                  <stop stopColor="currentColor" stopOpacity=".631" offset="63.146%" />
                  <stop stopColor="currentColor" offset="100%" />
                </linearGradient>
              </defs>
              <g fill="none" fillRule="evenodd">
                <g transform="translate(1 1)">
                  <path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke="url(#a)" strokeWidth="2">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 18 18"
                      to="360 18 18"
                      dur="0.9s"
                      repeatCount="indefinite" />
                  </path>
                  <circle fill="currentColor" cx="36" cy="18" r="1">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 18 18"
                      to="360 18 18"
                      dur="0.9s"
                      repeatCount="indefinite" />
                  </circle>
                </g>
              </g>
            </svg>
            <span className="text-green-500 mt-2">Uploading...</span>
          </div>
        ) : logoUrl ? (
          <>
            <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain p-4" />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-2 rounded-sm right-2
              group-hover:bg-red-200 bg-red-200 opacity-100 md:opacity-0 group-hover:opacity-100 group-hover:border-red-400"
              aria-label="Remove logo"
            >
              <X className="text-red-700 hover:bg-red-300 rounded-sm p-0.5" size={22} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <ImagePlus size={36} className="text-green-400" />
            <span className="text-green-500 mt-2">Upload Logo</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      {logoStatus && (
        <div className="mt-2 hidden text-xs text-gray-500">{logoStatus}</div>
      )}
    </div>
  );
};

export default LogoUpload;
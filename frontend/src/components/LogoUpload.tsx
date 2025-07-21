import React, { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

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
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <div className="mb-6 w-64">
      <div
        onClick={handleClick}
        className="h-40 max-w-xs border-2 border-dashed border-3 bg-green-100 rounded-xl flex items-center
        justify-center cursor-pointer hover:border-green-400 hover:bg-green-200 transition relative group overflow-hidden"
      >
        {logoUrl ? (
          <>
            <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain p-4" />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute top-2 right-2 bg-white rounded-1/2 p-1 shadow group-hover:bg-red-100"
              aria-label="Remove logo"
            >
              <X size={18} />
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
        <div className="mt-2 text-xs text-gray-500">{logoStatus}</div>
      )}
    </div>
  );
};

export default LogoUpload;

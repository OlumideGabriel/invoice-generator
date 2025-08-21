import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface BusinessLogoUploadProps {
  logoFile: File | null;
  logoUrl: string;
  onLogoChange: (file: File | null, url: string) => void;
  className?: string;
}

const BusinessLogoUpload: React.FC<BusinessLogoUploadProps> = ({
  logoFile,
  logoUrl,
  onLogoChange,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      // Create a preview URL
      const url = URL.createObjectURL(file);
      onLogoChange(file, url);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(null, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Business Logo
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : logoFile || logoUrl
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {logoFile || logoUrl ? (
          // Logo preview
          <div className="flex items-center justify-center">
            <div className="relative">
              <img
                src={logoUrl}
                alt="Business logo"
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {logoFile?.name || 'Logo uploaded'}
              </p>
              <p className="text-xs text-gray-500">
                Click to change or drag a new image
              </p>
            </div>
          </div>
        ) : (
          // Upload prompt
          <div
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={handleClick}
          >
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 2MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessLogoUpload;

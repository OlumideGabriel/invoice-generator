// components/LogoUpload.jsx
import React from 'react';

const LogoUpload = ({ logoFile, logoStatus, handleLogoChange, uploadLogo }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Upload Logo</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoChange}
        className="block mb-2 text-neutral-300"
      />
      <button
        onClick={uploadLogo}
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-md"
      >
        Upload Logo
      </button>
      {logoStatus && <p className="mt-2 text-sm text-indigo-300">{logoStatus}</p>}
    </div>
  );
};

export default LogoUpload;

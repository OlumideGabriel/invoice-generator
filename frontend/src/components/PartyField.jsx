// components/PartyField.jsx
import React from 'react';

const PartyField = ({ label, value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows="3"
        className="w-64 min-h-[100px] p-3 rounded-md bg-neutral-700 border border-neutral-600
        focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};

export default PartyField;

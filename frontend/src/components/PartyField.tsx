import React from 'react';

interface PartyFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PartyField: React.FC<PartyFieldProps> = ({ label, value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        className="flex flex-col w-64 min-h-[100px] p-3 rounded-md bg-neutral-700 border
        border-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
};

export default PartyField;

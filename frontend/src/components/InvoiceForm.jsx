import React, { useState } from 'react';
import InvoiceLine from './InvoiceLine';

export default function InvoiceForm() {
  const [lines, setLines] = useState([
    { description: '', quantity: '', price: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleLineChange = (index, updatedLine) => {
    const newLines = [...lines];
    newLines[index] = updatedLine;
    setLines(newLines);
  };

  const handleAddLine = () => {
    setLines([...lines, { description: '', quantity: '', price: '' }]);
  };

  const handleRemoveLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleDownloadInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lines }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoice.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Generator</h1>

      {lines.map((line, index) => (
        <InvoiceLine
          key={index}
          index={index}
          data={line}
          onChange={handleLineChange}
          onRemove={handleRemoveLine}
        />
      ))}

      <button
        onClick={handleAddLine}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        + Add Line
      </button>

      <button
        onClick={handleDownloadInvoice}
        className="bg-green-600 text-white px-6 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Download Invoice'}
      </button>
    </div>
  );
}

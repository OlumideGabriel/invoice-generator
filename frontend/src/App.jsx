import React, { useState } from 'react';

function App() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState([{ name: '', quantity: 1, unit_cost: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = field === 'quantity' || field === 'unit_cost' ? parseFloat(value) || 0 : value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unit_cost: 0 }]);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toFixed(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = {
        from,
        to,
        items: items.filter(item => item.name.trim() !== ''), // Filter out empty items
        total: parseFloat(getTotal())
      };

      // Check if there are valid items
      if (data.items.length === 0) {
        throw new Error('Please add at least one item');
      }

      const res = await fetch('http://localhost:5000/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err.message || 'Failed to generate invoice. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Invoice Generator</h1>

      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}

      <div style={{ marginBottom: '15px' }}>
        <label>From:</label><br />
        <textarea
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          rows="3"
          cols="50"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>To:</label><br />
        <textarea
          value={to}
          onChange={(e) => setTo(e.target.value)}
          rows="3"
          cols="50"
          style={{ width: '100%' }}
        />
      </div>

      <h2>Items</h2>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Item name"
            value={item.name}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
            style={{ flex: 2, padding: '8px' }}
          />
          <input
            type="number"
            placeholder="Qty"
            value={item.quantity}
            min="1"
            onChange={(e) => handleChange(index, 'quantity', e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <input
            type="number"
            placeholder="Unit Cost"
            value={item.unit_cost}
            min="0"
            step="0.01"
            onChange={(e) => handleChange(index, 'unit_cost', e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <span style={{ flex: 1 }}>Total: ${(item.quantity * item.unit_cost).toFixed(2)}</span>
          <button
            onClick={() => removeItem(index)}
            style={{ padding: '8px 12px' }}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        onClick={addItem}
        style={{ marginBottom: '20px', padding: '8px 16px' }}
      >
        Add Item
      </button>

      <h3>Total: ${getTotal()}</h3>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>
    </div>
  );
}

export default App;
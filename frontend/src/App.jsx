import React, { useState } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoiceLine from './components/InvoiceLine';
import LogoUpload from './components/LogoUpload';
import PartyField from './components/PartyField';
import InvoiceButton from './components/InvoiceButton';
import ItemDescriptions from './components/ItemDescriptions';
import TaxDiscountSection from './components/TaxDiscountSection';
import PaymentSection from './components/PaymentSection';
import TotalsDisplay from './components/TotalsDisplay';

function App() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState([{ name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoStatus, setLogoStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Item handlers
  const handleChange = (index, field, value) => {
    const updatedItems = [...items];
    if (field === 'quantity' || field === 'unit_cost') {
      updatedItems[index][field] = parseFloat(value) || 0;
    } else {
      updatedItems[index][field] = value;
    }
    setItems(updatedItems);
  };

  const toggleDescription = (index) => {
    const updatedItems = [...items];
    updatedItems[index].showDesc = !updatedItems[index].showDesc;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', description: '', quantity: 1, unit_cost: 0, showDesc: false }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const getSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const getTaxAmount = () => getSubtotal() * (taxPercent / 100);
  const getDiscountAmount = () => getSubtotal() * (discountPercent / 100);
  const getTotal = () => (getSubtotal() + getTaxAmount() - getDiscountAmount()).toFixed(2);

  // Logo upload handlers
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      setLogoStatus('');
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) {
      setLogoStatus('Please select a logo file first.');
      return;
    }
    setLogoStatus('Uploading...');
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const res = await fetch('http://localhost:5000/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setLogoStatus('Logo uploaded successfully!');
      } else {
        setLogoStatus(`Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setLogoStatus(`Upload error: ${error.message}`);
    }
  };

  // Submit invoice data
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const filteredItems = items.filter(item => item.name.trim() !== '');

      if (!from.trim() || !to.trim()) throw new Error('Please fill in both "From" and "To" fields.');
      if (filteredItems.length === 0) throw new Error('Please add at least one valid item.');

      const data = {
        from,
        to,
        items: filteredItems,
        tax_percent: taxPercent,
        discount_percent: discountPercent,
        payment_details: paymentDetails,
        payment_instructions: paymentInstructions,
        total: parseFloat(getTotal()),
      };

      const res = await fetch('http://localhost:5000/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errResp = await res.json();
        throw new Error(errResp.error || `Failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-12 ">
      <div className="max-w-5xl w-full bg-neutral-800 shadow-xl rounded-2xl p-8 overflow-auto mx-auto">
        <h1 className="mb-6 text-indigo-400">Invoice Generator</h1>

        <LogoUpload
          logoFile={logoFile}
          logoStatus={logoStatus}
          handleLogoChange={handleLogoChange}
          uploadLogo={uploadLogo}
        />

        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="from-to-group">
        <PartyField label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <PartyField label="To" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-indigo-300">Items</h2>
        {items.map((item, index) => (
          <InvoiceLine
            key={index}
            item={item}
            index={index}
            onChange={handleChange}
            onRemove={removeItem}
            onToggleDescription={toggleDescription}
          />
        ))}

        <button
          onClick={addItem}
          className="mb-6 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-md"
        >
          Add Item
        </button>

        <TaxDiscountSection
          taxPercent={taxPercent}
          setTaxPercent={setTaxPercent}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
        />

        <PaymentSection
          paymentDetails={paymentDetails}
          setPaymentDetails={setPaymentDetails}
          paymentInstructions={paymentInstructions}
          setPaymentInstructions={setPaymentInstructions}
        />

        <TotalsDisplay
          subtotal={getSubtotal()}
          taxAmount={getTaxAmount()}
          discountAmount={getDiscountAmount()}
          total={getTotal()}
        />

        <InvoiceButton loading={loading} onClick={handleSubmit} />
      </div>
    </div>
  );
}

export default App;
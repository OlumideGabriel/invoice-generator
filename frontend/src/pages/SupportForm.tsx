import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

const SupportForm = () => {
  const [formData, setFormData] = useState({
    issueType: '',
    details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const issueTypes = [
    { value: '', label: 'Select an issue type' },
    { value: 'payment-not-processed', label: 'Payment not processed' },
    { value: 'incorrect-amount', label: 'Incorrect invoice amount' },
    { value: 'missing-invoice', label: 'Missing invoice' },
    { value: 'duplicate-charge', label: 'Duplicate charge' },
    { value: 'refund-request', label: 'Refund request' },
    { value: 'billing-address', label: 'Billing address issue' },
    { value: 'tax-related', label: 'Tax-related question' },
    { value: 'other', label: 'Other invoice issue' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.issueType || !formData.details.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Create email content
    const subject = `Invoice Support Request: ${issueTypes.find(type => type.value === formData.issueType)?.label}`;
    const body = `Issue Type: ${issueTypes.find(type => type.value === formData.issueType)?.label}

Details:
${formData.details}

---
This message was sent from the Envoyce support form.`;

    // Create mailto link
    const mailtoLink = `mailto:support@envoyce.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoLink;

    // Simulate form submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const handleReset = () => {
    setFormData({ issueType: '', details: '' });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Client Opened</h2>
          <p className="text-gray-600 mb-6">
            Your email client should have opened with your support request pre-filled.
            Please send the email to complete your support request.
          </p>
          <button
            onClick={handleReset}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-[#d2fee1] rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="h-6 w-6 text-[#0e423e]" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Invoice Support</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
            Issue Type *
          </label>
          <select
            id="issueType"
            name="issueType"
            value={formData.issueType}
            onChange={handleInputChange}
            required
            className="w-full px-2 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            {issueTypes.map((type) => (
              <option key={type.value} value={type.value} disabled={type.value === ''}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-2">
            More Details *
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleInputChange}
            required
            rows={4}
            placeholder="Please provide more details about your invoice issue. Include invoice numbers, dates, or any other relevant information..."
            className="w-full min-h-32 max-h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical transition-colors"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Your support request will be sent to <strong>support@envoyce.xyz</strong> via your email client.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.issueType || !formData.details.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Opening Email...' : 'Send Support Request'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          We typically respond within 24 hours
        </p>
      </div>
    </div>
  );
};

export default SupportForm;
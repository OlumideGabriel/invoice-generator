import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SupportForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issueType: '',
    details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

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

    if (!formData.issueType || !formData.details.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issueType: formData.issueType,
          details: formData.details,
          name: user?.name || 'Unknown User',
          email: user?.email || 'unknown@example.com',
          userId: user?.id
        })
      });

      // Check if response is OK and has content
      if (!res.ok) {
        // Try to get error message from response
        const errorText = await res.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { error: `Server error: ${res.status} ${res.statusText}` };
        }
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      // Check if response has content before parsing as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setIsSubmitted(true);
        } else {
          setError(data.error || 'Failed to send support request');
        }
      } else {
        // If no JSON response but request was successful
        setIsSubmitted(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ issueType: '', details: '' });
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Support Request Sent</h2>
            <p className="text-gray-600 mb-6">
              Thanks {user?.name || 'there'}, we've received your request and will respond shortly.
            </p>
            <button
              onClick={handleReset}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center px-3 py-2 mb-4 bg-white hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-colors shadow-sm border border-slate-200"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#d2fee1] rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-[#0e423e]" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Invoice Support</h1>
            <p className="text-gray-600">We're here to help with any invoice issues</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                placeholder="Please provide more details about your invoice issue..."
                className="w-full min-h-32 max-h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Your request will be sent to <strong>talktoenvoyce@gmail.com</strong>.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.issueType || !formData.details.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Sending...' : 'Send Support Request'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">We typically respond within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportForm;
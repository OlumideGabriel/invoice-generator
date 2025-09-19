import React, { useState, useRef, useEffect } from 'react';
import { Mail, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import Navbar from '../components/Navbar';
import MainMenu from '../components/MainMenu';

const SupportForm = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    issueType: '',
    details: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const textareaRef = useRef(null);

  const issueTypes = [
    { value: '', label: 'Select an issue type' },
    { value: 'missing-invoice', label: 'Invoice not generated or missing' },
    { value: 'duplicate-invoice', label: 'Duplicate invoice or charge' },
    { value: 'layout-issue', label: 'Layout or formatting issue' },
    { value: 'download-error', label: 'Download or Preview issue (PDF)' },
    { value: 'other', label: 'Other issue' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto-expand textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // expand to fit
    }
  }, [formData.details]);

  const handleDropdownSelect = (option) => {
    setFormData(prev => ({ ...prev, issueType: option.value }));
    setIsDropdownOpen(false);
  };

  const getSelectedIssueLabel = () => {
    const selected = issueTypes.find(type => type.value === formData.issueType);
    return selected ? selected.label : 'Select an issue type';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.issueType || !formData.details.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueType: formData.issueType,
          details: formData.details,
          name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User",
          email: user?.email || 'unknown@example.com',
          userId: user?.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || 'Failed to send support request');
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
      <div className="py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Support Request Sent</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thanks, {user.first_name || 'friend'}! We’ve got your request and will reach out on&nbsp;
              <span className="text-gray-800 font-semibold">{user.email}</span> soon!
            </p>
            <button
              onClick={handleReset}
              className="w-full bg-gray-100 hidden text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="md:block hidden sticky top-0 left-0 w-full z-30">
      <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
      <MainMenu />
      </div>

    <div className="py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#d2fee1] rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-[#0e423e]" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Support</h1>
            <p className="text-gray-600">We're here to help with any issues</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Issue Type Dropdown */}
            <div className="relative">
              <div className="bg-white border border-gray-300 shadow-sm rounded-md cursor-pointer select-none">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className={`w-full py-2.5 px-3 pr-10 text-left rounded-md hover:bg-gray-50 transition-colors ${
                    formData.issueType ? 'text-gray-900' : 'text-gray-500'
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  {getSelectedIssueLabel()}
                </div>
                <ChevronDown
                  size={20}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md p-1 shadow-md z-10">
                    <div className="max-h-40 overflow-y-auto">
                      {issueTypes.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleDropdownSelect(option)}
                          className={`w-full px-3 py-2.5 mb-1 text-left text-md hover:bg-gray-100 rounded-md transition-colors ${
                            formData.issueType === option.value
                              ? 'bg-gray-100 font-medium text-gray-900'
                              : 'text-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {isDropdownOpen && <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />}
            </div>

            {/* Details Auto-Expanding Textarea */}
            <textarea
              ref={textareaRef}
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              required
              rows={1}
              placeholder="Please provide more details..."
              className="w-full min-h-40 px-3 py-3 input rounded-md focus:ring-2 focus:ring-blue-500
              focus:border-blue-500 outline-none resize-none overflow-hidden transition-colors placeholder-gray-500 text-gray-900"
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
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
              {isSubmitting ? 'Sending...' : 'Send Support Request'}
            </button>

            <p className="mt-4 text-xs text-gray-500 text-center">We typically respond within 24 hours</p>
          </form>
        </div>
      </div>
    </div>
    <Navbar />
    </>
  );
};

export default SupportForm;

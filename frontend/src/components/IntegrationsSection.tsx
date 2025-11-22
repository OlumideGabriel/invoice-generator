import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Key,
  Info,
  X
} from 'lucide-react';

const IntegrationsSection = ({ showNotification }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiCredentials, setApiCredentials] = useState({
    publicKey: '',
    secretKey: ''
  });

  const handleConnect = () => {
    if (isConnected) {
      // Disconnect
      setIsConnected(false);
      setApiCredentials({ publicKey: '', secretKey: '' });
      showNotification('Fincra disconnected successfully', 'success');
    } else {
      // Show API key modal
      setShowApiKeyModal(true);
    }
  };

  const handleSaveCredentials = () => {
    if (!apiCredentials.publicKey || !apiCredentials.secretKey) {
      showNotification('Please enter both public and secret keys', 'error');
      return;
    }

    // Here you would typically save to your backend
    setIsConnected(true);
    setShowApiKeyModal(false);
    showNotification('Fincra connected successfully', 'success');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApiCredentials(prev => ({ ...prev, [name]: value }));
  };

return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Main Integration Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Payment Integration</h2>
            <p className="text-gray-500 text-sm mt-1">Connect your payment provider to accept payments from customers</p>
          </div>
          <div className="flex items-center space-x-3">
            {isConnected && (
              <span className="text-sm text-gray-500">
                Fincra connected
              </span>
            )}
          </div>
        </div>

        {/* Fincra Integration Card */}
        <div className="bg-white md:w-1/2 lg:w-1/3 border border-gray-300 rounded-lg p-6 transition-all duration-200 hover:shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${
              isConnected ? 'bg-teal-100' : 'bg-gray-100'
            }`}>
              <img
                src="/fincra_icon.png"
                alt="Fincra Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            {isConnected && (
              <div className="flex items-center justify-center w-6 h-6 bg-teal-600 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Fincra</h4>
            <p className="text-sm text-gray-500 mb-3">
              Accept payments from customers worldwide with support for cards, bank transfers, and mobile money.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleConnect}
              className={`px-4 py-2 rounded-md text-sm border font-medium transition-colors ${
                isConnected
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-transparent border-gray-400 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>


      {/* Connected State - API Keys */}
      {isConnected && (
        <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">API Credentials</h3>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Update
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Public Key
              </label>
              <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono break-all">
                {apiCredentials.publicKey || '••••••••••••••••'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Secret Key
              </label>
              <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono">
                ••••••••••••••••••••••••
              </div>
            </div>
          </div>
        </div>
      )}

{/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between py-5 px-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {isConnected ? 'Update API Keys' : 'Connect Fincra'}
              </h2>
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  if (!isConnected) {
                    setApiCredentials({ publicKey: '', secretKey: '' });
                  }
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Key
                </label>
                <input
                  type="text"
                  name="publicKey"
                  value={apiCredentials.publicKey}
                  onChange={handleInputChange}
                  placeholder="pk_test_..."
                  className="w-full px-4 py-3 input bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key
                </label>
                <input
                  type="password"
                  name="secretKey"
                  value={apiCredentials.secretKey}
                  onChange={handleInputChange}
                  placeholder="sk_test_..."
                  className="w-full px-4 py-3 input bg-gray-50 text-gray-700 placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Your API keys are encrypted and stored securely. Get your keys from your Fincra dashboard under Settings → API Keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-6 pt-0 border-t pt-4 border-gray-100">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  if (!isConnected) {
                    setApiCredentials({ publicKey: '', secretKey: '' });
                  }
                }}
                className="flex px-8 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                className="flex px-8 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                {isConnected ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

      )}
    </div>
    </div>
  );
};

export default IntegrationsSection;
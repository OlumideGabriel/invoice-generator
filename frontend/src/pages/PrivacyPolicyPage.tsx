import React from 'react';
import { Shield, Mail, User, Database, Lock, Eye, Trash2, FileText, CheckCircle2 } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">

              <div>
                <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="mt-2 text-gray-600">Your privacy and data protection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                This Privacy Policy describes how our Invoice Management Application ("we," "our," or "us")
                collects, uses, and protects your information when you use our service. We are committed to
                protecting your privacy and ensuring the security of your personal information.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-3 text-blue-600" />
            Information We Collect
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                Google Account Information
              </h3>
              <p className="text-gray-600 mb-2">
                When you sign in with Google OAuth, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>Email Address:</strong> Used for account identification and communication</li>
                <li><strong>Profile Information:</strong> Your name and profile picture for account personalization</li>
                <li><strong>Google User ID:</strong> A unique identifier to link your account securely</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Application Data
              </h3>
              <p className="text-gray-600 mb-2">
                Information you provide while using our service:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Client information (names, addresses, contact details)</li>
                <li>Invoice data and financial records</li>
                <li>Usage analytics and application preferences</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-3 text-blue-600" />
            How We Use Your Information
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Account Management</h4>
                  <p className="text-sm text-gray-600">Create and manage your user account</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Service Delivery</h4>
                  <p className="text-sm text-gray-600">Provide invoice management functionality</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Communication</h4>
                  <p className="text-sm text-gray-600">Send important updates and notifications</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Security</h4>
                  <p className="text-sm text-gray-600">Protect against unauthorized access</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Service Improvement</h4>
                  <p className="text-sm text-gray-600">Analyze usage to enhance our application</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Legal Compliance</h4>
                  <p className="text-sm text-gray-600">Meet legal and regulatory requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection & Security */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-3 text-blue-600" />
            Data Protection & Security
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Encryption & Storage</h4>
              <p className="text-gray-600 text-sm">
                All data is encrypted in transit using HTTPS/TLS protocols and stored securely in our protected databases.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Access Controls</h4>
              <p className="text-gray-600 text-sm">
                We implement strict access controls to ensure only authorized personnel can access your data for legitimate business purposes.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Regular Security Audits</h4>
              <p className="text-gray-600 text-sm">
                Our systems undergo regular security assessments to identify and address potential vulnerabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing</h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 font-medium">
              We do not sell, trade, or rent your personal information to third parties.
            </p>
          </div>

          <p className="text-gray-600 mb-4">
            We may share your information only in the following limited circumstances:
          </p>

          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span><strong>Legal Requirements:</strong> When required by law, regulation, or court order</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span><strong>Service Providers:</strong> With trusted third-party services that help us operate our application</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</span>
            </li>
          </ul>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Access your data</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Update your information</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Delete your account</span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Mail className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Data portability</span>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm mt-4">
            To exercise any of these rights, please contact us using the information provided below.
          </p>
        </div>

        {/* Google OAuth Compliance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Google OAuth Integration</h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              Our application uses Google OAuth for authentication. By signing in with Google, you agree to:
            </p>

            <ul className="space-y-2 text-gray-600 ml-4">
              <li className="flex items-start space-x-2">
                <span className="font-medium text-gray-900 min-w-0">•</span>
                <span>Allow us to access your basic Google profile information</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-gray-900 min-w-0">•</span>
                <span>Use your email address for account identification</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-medium text-gray-900 min-w-0">•</span>
                <span>Store your Google User ID securely in our system</span>
              </li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You can revoke our access to your Google account at any time through your
                <a href="https://myaccount.google.com/permissions" className="ml-1 underline font-medium" target="_blank" rel="noopener noreferrer">
                  Google Account Settings
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-3 text-blue-600" />
            Contact Us
          </h2>

          <p className="text-gray-600 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> privacy@envoyce.xyz</p>
              <p><strong>Address:</strong> Liverpool, UK</p>
              <p><strong>Response Time:</strong> We will respond to your inquiry within 48 hours</p>
            </div>
          </div>
        </div>

        {/* Changes to Policy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>

          <p className="text-gray-600 mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
            operational, or regulatory reasons. When we make changes:
          </p>

          <ul className="space-y-2 text-gray-600 ml-4 mb-4">
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span>We will update the "Last updated" date at the top of this policy</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span>We will notify you of significant changes via email</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-medium text-gray-900 min-w-0">•</span>
              <span>Continued use of our service constitutes acceptance of the updated policy</span>
            </li>
          </ul>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Effective Date:</strong> This Privacy Policy is effective as of the date listed above and applies to all information collected on or after that date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
import React from 'react';
import { Scale, FileText, AlertTriangle, Shield, Users, CreditCard, Gavel, Mail, Clock, CheckCircle2 } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                <p className="mt-2 text-gray-600">Legal terms and conditions for using our service</p>
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
                <Scale className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms of Service ("Terms") govern your use of our Invoice Management Application ("Service")
                operated by Envoyce ("us," "we," or "our"). By accessing or using our Service, you agree to be
                bound by these Terms.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> If you disagree with any part of these terms, then you may not access the Service.
                </p>
              </div>
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

        {/* Service Description */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-3 text-blue-600" />
            Service Description
          </h2>

          <p className="text-gray-600 mb-4">
            Our Service provides invoice management functionality including:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Create and manage invoices</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Client information management</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Financial record tracking</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Google OAuth integration</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Data export capabilities</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Secure cloud storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Accounts & Eligibility */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-3 text-blue-600" />
            User Accounts & Eligibility
          </h2>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Eligibility Requirements</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>You must be at least 18 years old to use this Service</li>
                <li>You must have the legal authority to enter into this agreement</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You must maintain a valid Google account for authentication</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>You are liable for all activities that occur under your account</li>
                <li>You may not share your account credentials with others</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Acceptable Use Policy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-3 text-blue-600" />
            Acceptable Use Policy
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-green-700">✓ Permitted Uses</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Creating legitimate business invoices and records</li>
                  <li>Managing client information for business purposes</li>
                  <li>Exporting your own data</li>
                  <li>Using the service in compliance with applicable laws</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-red-700">✗ Prohibited Uses</h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Creating fraudulent or misleading invoices</li>
                  <li>Attempting to access other users' data</li>
                  <li>Using the service for illegal activities</li>
                  <li>Attempting to reverse engineer or hack the application</li>
                  <li>Uploading malicious code or content</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-3 text-blue-600" />
            Payment Terms
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Current Pricing</h4>
              <p className="text-sm text-blue-800">
                Our service is currently provided free of charge. We reserve the right to introduce
                paid plans in the future with appropriate notice to users.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Future Payment Terms</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>All fees will be clearly disclosed before implementation</li>
                <li>Existing users will receive at least 30 days notice of any pricing changes</li>
                <li>Refunds will be handled according to our refund policy (to be established)</li>
                <li>Payment disputes must be raised within 30 days of billing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property Rights</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Our Rights</h3>
              <p className="text-gray-600 text-sm mb-2">
                The Service and its original content, features, and functionality are owned by us and are
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">Your Rights</h3>
              <p className="text-gray-600 text-sm mb-2">
                You retain ownership of all data you upload to our Service. By using our Service, you grant
                us a limited license to use your data solely for providing the Service to you.
              </p>
            </div>

            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="font-medium text-gray-900 mb-2">License to Use</h3>
              <p className="text-gray-600 text-sm">
                We grant you a limited, non-exclusive, non-transferable license to use our Service in
                accordance with these Terms.
              </p>
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data & Privacy</h2>

          <p className="text-gray-600 mb-4">
            Your privacy is important to us. Our data collection and use practices are governed by our
            Privacy Policy, which is incorporated into these Terms by reference.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-gray-900">Key Points:</h4>
            <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
              <li>We only collect data necessary to provide our Service</li>
              <li>Your data is encrypted and stored securely</li>
              <li>We do not sell your personal information to third parties</li>
              <li>You can request deletion of your data at any time</li>
            </ul>
          </div>
        </div>

        {/* Service Availability */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-3 text-blue-600" />
            Service Availability
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              We strive to provide reliable service, but we cannot guarantee 100% uptime. We reserve the right to:
            </p>

            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Perform scheduled maintenance with advance notice</li>
              <li>Temporarily suspend service for emergency maintenance</li>
              <li>Modify or discontinue features with reasonable notice</li>
              <li>Limit usage to prevent abuse of system resources</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Service Level:</strong> We aim for 99.5% uptime, excluding scheduled maintenance windows.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimers & Limitations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 text-amber-600" />
            Disclaimers & Limitations of Liability
          </h2>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Disclaimer of Warranties</h4>
              <p className="text-sm text-red-800">
                The Service is provided "as is" without warranties of any kind. We disclaim all warranties,
                express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">Limitation of Liability</h4>
              <p className="text-sm text-amber-800">
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of profits, data, or business interruption.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Data Backup Responsibility</h4>
              <p className="text-sm text-blue-800">
                While we implement backup systems, you are responsible for maintaining your own backups
                of important data. We recommend regularly exporting your invoice data.
              </p>
            </div>
          </div>
        </div>

        {/* Termination */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Gavel className="h-5 w-5 mr-3 text-blue-600" />
            Termination
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Right to Terminate</h3>
              <p className="text-gray-600 text-sm mb-2">
                You may terminate your account at any time by contacting us or using the account deletion
                feature within the application.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Our Right to Terminate</h3>
              <p className="text-gray-600 text-sm mb-2">
                We may terminate or suspend your account immediately if you violate these Terms or engage
                in prohibited activities.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Upon Termination</h4>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                <li>Your right to use the Service ceases immediately</li>
                <li>We will delete your account data within 30 days</li>
                <li>You may request an export of your data before deletion</li>
                <li>Certain provisions of these Terms will survive termination</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Governing Law */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Governing Law & Disputes</h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              These Terms are governed by and construed in accordance with the laws of England and Wales,
              without regard to conflict of law principles.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Dispute Resolution</h4>
              <p className="text-gray-600 text-sm mb-2">
                Any disputes arising from these Terms or your use of the Service shall be resolved through:
              </p>
              <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                <li>Good faith negotiation between the parties</li>
                <li>Mediation if negotiation fails</li>
                <li>Binding arbitration as a last resort</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Changes to Terms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to These Terms</h2>

          <p className="text-gray-600 mb-4">
            We reserve the right to update these Terms at any time. When we make changes:
          </p>

          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>We will update the "Last updated" date at the top of these Terms</li>
            <li>We will notify you of significant changes via email</li>
            <li>Changes become effective 30 days after notification</li>
            <li>Continued use of the Service constitutes acceptance of updated Terms</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Your Options:</strong> If you disagree with updated Terms, you may terminate your
              account before the changes take effect.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-3 text-blue-600" />
            Contact Information
          </h2>

          <p className="text-gray-600 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> contact@envoyce.xyz</p>
              <p><strong>Address:</strong> Liverpool, UK</p>
              <p><strong>Response Time:</strong> We will respond to legal inquiries within 5 business days</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Effective Date:</strong> These Terms of Service are effective as of the date listed above
              and govern all use of the Service from that date forward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
import React from 'react';
import { Construction, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ComingSoon: React.FC = () => {
  return (
    <div className="h-full bg-white max-h-100dvh justify-center items-center text-gray-900 overflow-x-hidden flex flex-col">
      <div className="max-w-md w-full bg-white text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Construction className="h-10 w-10 text-gray-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">We’re building a better support experience for you!</h1>

        <p className="text-gray-500 mb-6 leading-relaxed text-lg">
        Our Customer Support page is currently under development and will be available soon.</p>

        <div className=" rounded-lg p-4 mb-6">
        <button onClick={() => window.location.href = 'mailto:support@envoyce.xyz'}
        className="w-full bg-white border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium">
          <div className="flex items-center justify-center">
            <Mail className="h-5 w-5 text-gray-600 mr-2" />
            <span className="text-gray-800 font-medium">
              Message us here
            </span>
          </div>
            </button>
        </div>

        <div className=" rounded-lg px-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="w-full !bg-neutral-900 text-white py-3.5 px-4 rounded-lg hover:!bg-neutral-800
          transition-colors font-medium"
        >
          Go Back
        </button>
        </div>

        <div className="mt-8 pt-6">
          <p className="text-sm text-gray-500">
            Thank you for your patience and understanding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
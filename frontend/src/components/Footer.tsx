import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-neutral-900 text-gray-300 py-6 px-4 flex flex-col md:flex-row items-center justify-between border-t border-neutral-800">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-green-400">InvoiceGen</span>
        <span className="text-xs">&copy; {new Date().getFullYear()} All rights reserved.</span>
      </div>
      <div className="flex gap-4 mt-2 md:mt-0 text-sm">
        <a href="https://github.com/OlumideGabriel/invoice-generator" className="hover:text-green-400 transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="mailto:support@invoicegen.com" className="hover:text-green-400 transition-colors">Contact</a>
      </div>
    </footer>
  );
};

export default Footer;

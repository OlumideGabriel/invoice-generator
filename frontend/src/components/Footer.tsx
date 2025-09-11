import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full text-neutral-400 py-8 px-4 border-neutral-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
        {/* Copyright and company info */}
        <div className="flex items-center gap-2 text-sm">
          <span>&copy;{new Date().getFullYear()} envoyce.xyz. All rights reserved.</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-2 text-sm">
          <a
            href="/terms-of-service"
            className="hover:text-neutral-500 text-neutral-400 transition-colors bg-neutral-800 px-2 py-0.5 rounded-sm duration-200"
          >
            Terms
          </a>
          <a
            href="/privacy-policy"
            className="hover:text-neutral-500 text-neutral-400 transition-colors bg-neutral-800 px-2 py-0.5 rounded-sm duration-200"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'white' | 'primary' | 'gray' | 'current';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'current',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const colorClasses = {
    white: 'text-white',
    primary: 'text-blue-600',
    gray: 'text-gray-400',
    current: 'text-current'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={size === 'sm' ? '16' : size === 'md' ? '24' : size === 'lg' ? '32' : '48'}
        height={size === 'sm' ? '16' : size === 'md' ? '24' : size === 'lg' ? '32' : '48'}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      >
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
            <stop stopColor="currentColor" stopOpacity="0" offset="0%" />
            <stop stopColor="currentColor" stopOpacity=".631" offset="63.146%" />
            <stop stopColor="currentColor" offset="100%" />
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)">
            <path d="M36 18c0-9.94-8.06-18-18-18" id="Oval-2" stroke="url(#a)" strokeWidth="2">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
            <circle fill="currentColor" cx="36" cy="18" r="1">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Spinner;
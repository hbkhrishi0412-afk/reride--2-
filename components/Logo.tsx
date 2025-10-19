import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "", onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 transition-all duration-300 hover:scale-105 ${className}`}
    >
      {/* Wave/Curve Graphic */}
      <svg 
        width="40" 
        height="40" 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path 
          d="M8 32C12 28 16 24 20 20C24 16 28 12 32 8C34 6 36 4 38 2C39 1 40 0 40 0V40H0C0 40 1 39 2 38C4 36 6 34 8 32Z" 
          fill="url(#gradient)"
          className="drop-shadow-sm"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="50%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#4CAF50" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Text */}
      <span 
        className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-blue-500 to-green-500 bg-clip-text text-transparent"
        style={{ 
          fontFamily: 'Nunito Sans, sans-serif',
          fontWeight: '800'
        }}
      >
        reride
        <sup className="text-xs ml-1">®</sup>
      </span>
    </button>
  );
};

export default Logo;

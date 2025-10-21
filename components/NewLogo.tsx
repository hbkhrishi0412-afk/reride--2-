import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const NewLogo: React.FC<LogoProps> = ({ 
  className = "", 
  onClick, 
  size = 'md',
  showText = true 
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { icon: 24, text: 'text-sm', spacing: 'gap-1' },
    md: { icon: 32, text: 'text-lg', spacing: 'gap-2' },
    lg: { icon: 40, text: 'text-xl', spacing: 'gap-2' },
    xl: { icon: 48, text: 'text-2xl', spacing: 'gap-3' }
  };

  const config = sizeConfig[size];
  const iconSize = config.icon;

  return (
    <button 
      onClick={onClick}
      className={`flex items-center ${config.spacing} transition-all duration-300 hover:scale-105 ${className}`}
    >
      {/* Logo Icon Container */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        {/* White rounded square background */}
        <div 
          className="absolute inset-0 bg-white rounded-lg shadow-sm"
          style={{ borderRadius: '8px' }}
        />
        
        {/* Car and Location Pin SVG */}
        <svg
          width={iconSize * 0.7}
          height={iconSize * 0.7}
          viewBox="0 0 100 100"
          className="relative z-10"
        >
          {/* Location Pin */}
          <g transform="translate(50, 20)">
            {/* Pin body - split blue/orange */}
            <path
              d="M-8,0 C-8,-8 -4,-12 0,-12 C4,-12 8,-8 8,0 L8,12 C8,16 4,20 0,20 C-4,20 -8,16 -8,12 Z"
              fill="url(#pinGradient)"
            />
            {/* Pin center circle */}
            <circle cx="0" cy="4" r="3" fill="white" />
          </g>

          {/* Car */}
          <g transform="translate(50, 60)">
            {/* Car body outline */}
            <path
              d="M-20,-8 L-12,-16 L12,-16 L20,-8 L20,8 L-20,8 Z"
              fill="none"
              stroke="url(#carGradient)"
              strokeWidth="2"
            />
            
            {/* Front wheel (orange) */}
            <circle cx="-12" cy="8" r="6" fill="#FF6B35" />
            <circle cx="-12" cy="8" r="3" fill="white" />
            
            {/* Rear wheel (blue) */}
            <circle cx="12" cy="8" r="6" fill="#2196F3" />
            <circle cx="12" cy="8" r="3" fill="white" />
            
            {/* Windshield */}
            <path
              d="M-8,-8 L-4,-12 L4,-12 L8,-8"
              fill="none"
              stroke="url(#carGradient)"
              strokeWidth="1.5"
            />
            
            {/* Headlight */}
            <circle cx="18" cy="-4" r="2" fill="#FF6B35" />
          </g>

          {/* Gradients */}
          <defs>
            {/* Pin gradient - blue to orange */}
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2196F3" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
            
            {/* Car gradient - orange to blue */}
            <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#2196F3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span 
          className={`font-bold text-blue-600 ${config.text}`}
          style={{ 
            fontFamily: 'Nunito Sans, sans-serif',
            fontWeight: '800',
            letterSpacing: '0.5px'
          }}
        >
          RERIDE
        </span>
      )}
    </button>
  );
};

export default NewLogo;

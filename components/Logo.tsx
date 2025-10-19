import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "", onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`transition-all duration-300 hover:scale-105 ${className}`}
    >
      {/* Text with gradient colors for each letter */}
      <span 
        className="text-3xl font-bold"
        style={{ 
          fontFamily: 'Nunito Sans, sans-serif',
          fontWeight: '800'
        }}
      >
        <span style={{ background: 'linear-gradient(135deg, #FF6B35, #E65100)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>r</span>
        <span style={{ background: 'linear-gradient(135deg, #FF6B35, #E65100)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>e</span>
        <span style={{ background: 'linear-gradient(135deg, #9C27B0, #673AB7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>r</span>
        <span style={{ background: 'linear-gradient(135deg, #9C27B0, #673AB7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>i</span>
        <span style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>d</span>
        <span style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>e</span>
        <sup className="text-xs ml-1" style={{ color: '#666' }}>®</sup>
      </span>
    </button>
  );
};

export default Logo;

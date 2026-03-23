import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 32, color = "currentColor" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The "G" that looks like a wave */}
      <path 
        d="M82 35C76 22 64 15 50 15C30 15 15 31 15 50C15 69 31 85 50 85C69 85 85 69 85 50V48H55" 
        stroke={color} 
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Wave crest */}
      <path 
        d="M50 15C65 15 82 25 82 48" 
        stroke={color} 
        strokeWidth="14" 
        strokeLinecap="round"
      />
    </svg>
  );
};

import React from 'react';

interface LogoMarkProps {
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = '' }) => (
  <img
    src="/logo.png"
    alt="Vinayaka Chavithi logo"
    className={`object-contain ${className}`}
  />
);

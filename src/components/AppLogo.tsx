import React, { useState } from 'react';

interface AppLogoProps {
  className?: string;
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-28 h-28',
  alt = 'Logo Officiel FAAB RISK'
}) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const sources = [
    './assets/aistudio/logo_faab_risk_8a560e79.png',
    '/assets/aistudio/logo_faab_risk_8a560e79.png',
    './logo.png?v=7',
    './favicon.png?v=7'
  ];

  if (srcIndex < sources.length) {
    return (
      <img
        src={sources[srcIndex]}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setSrcIndex(prev => prev + 1)}
        className={`${className} object-contain shrink-0 select-none drop-shadow-lg transition-transform duration-200 hover:scale-105`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      fill="none"
      className={`${className} shrink-0 select-none drop-shadow-md`}
      role="img"
      aria-label={alt}
    >
      <rect x="6" y="28" width="228" height="206" rx="32" fill="#ea580c" />
      <rect x="26" y="88" width="188" height="122" rx="14" fill="#FFFFFF" />
      <rect x="38" y="4" width="28" height="58" rx="14" fill="#ea580c" stroke="#FFFFFF" strokeWidth="6" />
      <rect x="88" y="4" width="28" height="58" rx="14" fill="#ea580c" stroke="#FFFFFF" strokeWidth="6" />
      <rect x="138" y="4" width="28" height="58" rx="14" fill="#ea580c" stroke="#FFFFFF" strokeWidth="6" />
      <rect x="188" y="4" width="28" height="58" rx="14" fill="#ea580c" stroke="#FFFFFF" strokeWidth="6" />
      <text
        x="120"
        y="166"
        fontFamily="Plus Jakarta Sans, Arial Black, sans-serif"
        fontSize="34"
        fontWeight="900"
        fill="#ea580c"
        textAnchor="middle"
      >
        FAAB RISK
      </text>
    </svg>
  );
};

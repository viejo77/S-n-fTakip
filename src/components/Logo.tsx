import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Stylized Pen Nib / Pencil Tip with embedded '+' mark */}
      <div
        className={`relative ${iconDimensions} rounded-xl bg-gradient-to-br from-teal-700 via-teal-600 to-sky-700 p-1.5 shadow-sm shadow-teal-900/10 flex items-center justify-center shrink-0 group`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform transition-transform group-hover:scale-105"
        >
          {/* Main Pen Nib body */}
          <path
            d="M18 3L29 16C29 23 24 28 18 31C12 28 7 23 7 16L18 3Z"
            fill="url(#nibGradient)"
          />
          {/* Left Facet Highlight */}
          <path
            d="M18 3L7 16C7 21 10.5 25 15 27.5L18 3Z"
            fill="white"
            fillOpacity="0.18"
          />
          {/* Slit / Central Ink Channel */}
          <path
            d="M18 3V20"
            stroke="#fed7aa"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Breathing hole at end of slit */}
          <circle cx="18" cy="20" r="1.6" fill="#fed7aa" />

          {/* Golden / Amber tip accent */}
          <path
            d="M18 3L21 7.5H15L18 3Z"
            fill="#f59e0b"
          />

          {/* Plus (+) symbol accent */}
          <path
            d="M27 7V13M24 10H30"
            stroke="#fb923c"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient
              id="nibGradient"
              x1="7"
              y1="3"
              x2="29"
              y2="31"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0f766e" />
              <stop offset="0.5" stopColor="#0284c7" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Subtle orange accent glow dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white" />
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className={`font-extrabold ${textSizes} text-slate-900 tracking-tight font-sans`}>
            SınıfTakip
          </span>
          <span className={`font-black ${textSizes} text-amber-500 ml-0.5`}>
            +
          </span>
        </div>
      )}
    </div>
  );
};

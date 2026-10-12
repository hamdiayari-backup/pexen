import React, { useState, useRef } from 'react';

interface AnimatedLogoProps {
  className?: string;
}

export const PexenAnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = 'w-10 h-10' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [clickPulse, setClickPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 28; // tilt degrees
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -28;
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickPulse(true);
    setTimeout(() => setClickPulse(false), 600);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative select-none cursor-pointer perspective-500 ${className}`}
      title="PEXEN® — Ingénierie & Performance"
    >
      {/* Outer ambient glow reacting to mouse */}
      <div
        className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-px-primary via-px-accent-light to-px-primary-light opacity-0 blur-md transition-all duration-500 ${
          isHovered ? 'opacity-70 scale-110' : ''
        } ${clickPulse ? 'opacity-100 scale-125' : ''}`}
      />

      {/* Main container with 3D tilt transformation */}
      <div
        style={{
          transform: isHovered
            ? `rotateY(${coords.x}deg) rotateX(${coords.y}deg) scale(1.08)`
            : 'rotateY(0deg) rotateX(0deg) scale(1)',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative w-full h-full rounded-xl bg-px-navy border border-slate-700/60 shadow-md flex items-center justify-center overflow-hidden"
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00C6BA_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Dynamic sweeping shine beam */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 ease-in-out ${
            isHovered ? 'translate-x-full' : ''
          }`}
        />

        {/* Interactive SVG Logo */}
        <svg
          viewBox="0 0 40 40"
          className="w-7 h-7 relative z-10 transition-transform duration-300"
          style={{
            transform: isHovered ? 'rotate(5deg)' : 'rotate(0deg)'
          }}
        >
          <defs>
            <linearGradient id="logo-dyn-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--px-primary)" />
              <stop offset="50%" stopColor="var(--px-accent-mid)" />
              <stop offset="100%" stopColor="var(--px-accent)" />
            </linearGradient>

            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background aura ring */}
          <circle
            cx="20"
            cy="20"
            r={isHovered ? 15 : 13}
            fill="none"
            stroke="url(#logo-dyn-grad)"
            strokeWidth="0.75"
            strokeDasharray="2 3"
            className="transition-all duration-500 opacity-60"
            style={{
              animation: isHovered ? 'spin 6s linear infinite' : 'none',
              transformOrigin: '20px 20px'
            }}
          />

          {/* Outer diamond frame */}
          <path
            d="M10 20 L20 10 L30 20 L20 30 Z"
            fill="none"
            stroke="url(#logo-dyn-grad)"
            strokeWidth={isHovered ? '3.8' : '3.2'}
            strokeLinejoin="round"
            filter="url(#glow-filter)"
            className="transition-all duration-300"
          />

          {/* Inner accent diamond */}
          <path
            d="M15 20 L20 15 L25 20 L20 25 Z"
            fill="none"
            stroke={isHovered ? 'var(--px-primary-light)' : 'rgba(0, 198, 186, 0.4)'}
            strokeWidth="1.2"
            strokeLinejoin="round"
            className="transition-all duration-300"
            style={{
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transformOrigin: '20px 20px'
            }}
          />

          {/* Glowing central reactor sphere */}
          <circle
            cx="20"
            cy="20"
            r={isHovered ? 4.5 : 3.5}
            fill="var(--px-primary)"
            className="transition-all duration-300"
          />
          <circle
            cx="19"
            cy="19"
            r="1"
            fill="#FFFFFF"
            className="opacity-90"
          />
        </svg>

        {/* Pulse wave animation on click */}
        {clickPulse && (
          <div className="absolute inset-0 rounded-xl border-2 border-px-primary animate-ping pointer-events-none" />
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

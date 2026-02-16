// 5-Agent Dots Logo with "AGENTS BUILD STRATEGY" slogan
export function AgentDotsLogo({ size = 'md', showSlogan = true }) {
  const sizes = {
    sm: { container: 'w-8 h-8', dot: 'w-1.5 h-1.5', text: 'text-lg', slogan: 'text-[8px]' },
    md: { container: 'w-12 h-12', dot: 'w-2 h-2', text: 'text-2xl', slogan: 'text-xs' },
    lg: { container: 'w-16 h-16', dot: 'w-2.5 h-2.5', text: 'text-3xl', slogan: 'text-sm' },
    xl: { container: 'w-20 h-20', dot: 'w-3 h-3', text: 'text-4xl', slogan: 'text-base' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* 5-Agent Dots Icon */}
      <div className={`${s.container} bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg`}>
        <div className="flex gap-1">
          <div className={`${s.dot} bg-white/90 rounded-full animate-pulse`}></div>
          <div className={`${s.dot} bg-white/70 rounded-full animate-pulse`} style={{animationDelay: '150ms'}}></div>
          <div className={`${s.dot} bg-white/50 rounded-full animate-pulse`} style={{animationDelay: '300ms'}}></div>
          <div className={`${s.dot} bg-white/70 rounded-full animate-pulse`} style={{animationDelay: '450ms'}}></div>
          <div className={`${s.dot} bg-white/90 rounded-full animate-pulse`} style={{animationDelay: '600ms'}}></div>
        </div>
      </div>

      {/* Brand Name + Slogan */}
      <div className="flex flex-col">
        <h1 className={`${s.text} font-black bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent leading-none`}>
          PLANVIX
        </h1>
        {showSlogan && (
          <p className={`${s.slogan} font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase mt-0.5`}>
            AGENTS BUILD STRATEGY
          </p>
        )}
      </div>
    </div>
  );
}

// Compact version for mobile
export function AgentDotsCompact() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-white/90 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
      <span className="text-xl font-black bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
        PLANVIX
      </span>
    </div>
  );
}

// Icon only (for favicon/small spaces)
export function AgentDotsIcon({ size = 'md' }) {
  const sizes = {
    sm: { container: 'w-6 h-6', dot: 'w-1 h-1' },
    md: { container: 'w-10 h-10', dot: 'w-1.5 h-1.5' },
    lg: { container: 'w-14 h-14', dot: 'w-2 h-2' },
  };

  const s = sizes[size];

  return (
    <div className={`${s.container} bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg`}>
      <div className="flex gap-0.5">
        <div className={`${s.dot} bg-white/90 rounded-full animate-pulse`}></div>
        <div className={`${s.dot} bg-white/70 rounded-full animate-pulse`} style={{animationDelay: '150ms'}}></div>
        <div className={`${s.dot} bg-white/50 rounded-full animate-pulse`} style={{animationDelay: '300ms'}}></div>
        <div className={`${s.dot} bg-white/70 rounded-full animate-pulse`} style={{animationDelay: '450ms'}}></div>
        <div className={`${s.dot} bg-white/90 rounded-full animate-pulse`} style={{animationDelay: '600ms'}}></div>
      </div>
    </div>
  );
}

// Default export - Full logo with slogan
export default AgentDotsLogo;

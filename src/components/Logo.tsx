import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function Logo({ className = "", size = "md", animated = false }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <circle cx="20" cy="20" r="20" fill="url(#gradient)" />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#16213e" />
          </linearGradient>
        </defs>
        
        {/* "M" vault structure */}
        <g fill="#00d4ff">
          {/* Left pillar */}
          <rect x="8" y="12" width="4" height="16" />
          {/* Right pillar */}
          <rect x="28" y="12" width="4" height="16" />
          {/* Top vault door */}
          <rect x="8" y="12" width="24" height="3" />
          {/* Middle vault bars */}
          <rect x="12" y="17" width="16" height="2" />
          <rect x="14" y="21" width="12" height="2" />
        </g>
        
        {/* Crypto symbol */}
        <text x="20" y="26" fill="#ffd700" fontSize="6" textAnchor="middle" fontFamily="Arial">₿</text>
        
        {/* Vault lock */}
        <circle cx="20" cy="18" r="1.5" fill="#00d4ff" />
        <circle cx="20" cy="18" r="0.8" fill="#1a1a2e" />
        
        {/* Sarcastic quote mark */}
        <text x="20" y="8" fill="#ff6b6b" fontSize="4" textAnchor="middle" fontFamily="Arial">"M"</text>
      </svg>
      
      {/* Animated pulse effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-cyan-400/20 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <LogoIcon />
      </motion.div>
    );
  }

  return <LogoIcon />;
}

export function LogoWithText({ className = "", size = "md", animated = false }: LogoProps) {
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Logo size={size} animated={animated} />
      <div className="flex flex-col">
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent`}>
          Mustody
        </span>
        <span className="text-xs text-gray-500 italic">"Miracle" Custody</span>
      </div>
    </div>
  );
}

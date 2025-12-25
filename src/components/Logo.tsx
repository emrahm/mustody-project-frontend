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
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center relative overflow-hidden ${className}`}>
      {/* Main geometric pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/80 rounded transform rotate-45"></div>
        <div className="absolute w-3 h-3 bg-white rounded-full"></div>
      </div>
      
      {/* Animated pulse effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-lg"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Corner accent */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
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
      <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent`}>
        Mustody
      </span>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AurexLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

export default function AurexLogo({ 
  size = "md", 
  animated = true, 
  showText = true,
  className = "" 
}: AurexLogoProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { logo: "h-8 w-8", text: "text-xl", container: "gap-2" },
    md: { logo: "h-12 w-12", text: "text-3xl", container: "gap-3" },
    lg: { logo: "h-16 w-16", text: "text-4xl", container: "gap-4" },
    xl: { logo: "h-24 w-24", text: "text-6xl", container: "gap-6" }
  };

  const config = sizeConfig[size];

  // Trigger glitch effect periodically
  useEffect(() => {
    if (!animated) return;
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 200);
      }
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, [animated]);

  const logoVariants = {
    initial: { 
      scale: 1,
      rotate: 0,
      filter: "hue-rotate(0deg)",
    },
    hover: {
      scale: 1.05,
      filter: "hue-rotate(10deg)",
      transition: { duration: 0.3 }
    },
    glitch: {
      scale: [1, 1.02, 0.98, 1.01, 1],
      rotate: [0, -0.5, 0.5, -0.2, 0],
      filter: [
        "hue-rotate(0deg)",
        "hue-rotate(90deg)",
        "hue-rotate(180deg)",
        "hue-rotate(270deg)",
        "hue-rotate(0deg)"
      ],
      transition: { 
        duration: 0.2,
        times: [0, 0.25, 0.5, 0.75, 1]
      }
    }
  };

  const textVariants = {
    initial: { 
      textShadow: "0 0 10px rgba(0, 212, 255, 0.3)",
    },
    hover: {
      textShadow: "0 0 20px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3)",
      transition: { duration: 0.3 }
    },
    glitch: {
      textShadow: [
        "0 0 10px rgba(0, 212, 255, 0.3)",
        "2px 0 0 rgba(255, 0, 102, 0.8), -2px 0 0 rgba(0, 255, 136, 0.8)",
        "0 0 10px rgba(0, 212, 255, 0.3)",
      ],
      x: [0, -1, 1, 0],
      transition: { 
        duration: 0.2,
        times: [0, 0.5, 1]
      }
    }
  };

  return (
    <motion.div 
      className={`flex items-center ${config.container} ${className}`}
      initial="initial"
      whileHover={animated ? "hover" : undefined}
      animate={glitchActive ? "glitch" : "initial"}
    >
      {/* Logo Symbol - Stylized "A" with cyberpunk design */}
      <motion.div
        variants={logoVariants}
        className={`${config.logo} relative flex items-center justify-center`}
      >
        {/* Main "A" shape with mountain/shield design */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="aurexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#0099cc" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
          </defs>
          
          {/* Main "A" structure */}
          <path
            d="M50 15 L25 85 L35 85 L40 70 L60 70 L65 85 L75 85 Z"
            fill="url(#aurexGradient)"
            filter="url(#glow)"
            className="drop-shadow-lg"
          />
          
          {/* Crossbar of "A" with tech detail */}
          <rect
            x="42"
            y="55"
            width="16"
            height="4"
            fill="#0a0a0a"
            rx="1"
          />
          
          {/* Tech accents - small lines */}
          <rect x="30" y="75" width="8" height="2" fill="#00ff88" opacity="0.8" />
          <rect x="62" y="75" width="8" height="2" fill="#00ff88" opacity="0.8" />
          
          {/* Peak detail - small diamond */}
          <polygon
            points="50,20 52,25 50,30 48,25"
            fill="#00ff88"
            className="animate-pulse"
          />
        </svg>

        {/* Animated particles around logo */}
        {animated && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyber-blue rounded-full"
                animate={{
                  x: [0, 20, -20, 0],
                  y: [0, -15, 15, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 4,
                  delay: i * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Text Logo */}
      {showText && (
        <motion.div
          variants={textVariants}
          className="flex flex-col"
        >
          <motion.h1 
            className={`${config.text} font-bold tracking-tight text-cyber-blue font-mono`}
            style={{
              fontFamily: "system-ui, -apple-system, 'Segoe UI', monospace",
              letterSpacing: "0.05em"
            }}
          >
            AUREX
          </motion.h1>
          
          {size === "lg" || size === "xl" ? (
            <motion.span 
              className="text-xs text-cyber-green font-mono tracking-wider opacity-80"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              SECURITY PLATFORM
            </motion.span>
          ) : null}
        </motion.div>
      )}

      {/* Matrix-style background effect for large sizes */}
      {animated && (size === "lg" || size === "xl") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cyber-green text-xs font-mono"
              style={{
                left: `${20 + i * 15}%`,
                fontFamily: "monospace"
              }}
              animate={{
                y: [-20, 100],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {Math.random().toString(2).substr(2, 8)}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

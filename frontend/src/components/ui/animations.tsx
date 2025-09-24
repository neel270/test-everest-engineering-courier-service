import { ReactNode, useEffect, useState } from "react";
import { animationClasses, getDelayClass } from "./animationsUtils";

// Animated wrapper components using CSS classes
export const AnimatedCard = ({
  children,
  delay = 0,
  className = "",
  animation = "fadeInUp",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  animation?: keyof typeof animationClasses;
}) => {
  const delayClass = getDelayClass(delay);
  const animationClass = animationClasses[animation];

  return (
    <div className={`${animationClass} ${delayClass} ${className}`}>
      {children}
    </div>
  );
};

export const AnimatedSection = ({
  children,
  delay = 0,
  animation = "fadeInLeft",
}: {
  children: ReactNode;
  delay?: number;
  animation?: keyof typeof animationClasses;
}) => {
  const delayClass = getDelayClass(delay);
  const animationClass = animationClasses[animation];

  return <div className={`${animationClass} ${delayClass}`}>{children}</div>;
};

export const AnimatedListItem = ({
  children,
  index = 0,
  animation = "fadeInUp",
}: {
  children: ReactNode;
  index?: number;
  animation?: keyof typeof animationClasses;
}) => {
  const delay = index * 100;
  const delayClass = getDelayClass(delay);
  const animationClass = animationClasses[animation];

  return <div className={`${animationClass} ${delayClass}`}>{children}</div>;
};

export const AnimatedCounter = ({
  value,
  suffix = "",
  className = "",
}: {
  value: number | string;
  suffix?: string;
  className?: string;
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span className={`tabular-nums transition-all duration-300 ${className}`}>
      {Number(displayValue).toFixed(2)}
      {suffix}
    </span>
  );
};

export const AnimatedProgressBar = ({
  progress,
  className = "",
  showPercentage = false,
}: {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`relative ${className}`}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000 ease-out"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-center">
          {animatedProgress.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

// Package animation component
export const AnimatedPackage = ({
  children,
  isSelected = false,
  isHovered = false,
  className = "",
}: {
  children: ReactNode;
  isSelected?: boolean;
  isHovered?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${
          isSelected
            ? "scale-105 shadow-lg shadow-blue-500/50 ring-2 ring-blue-300"
            : ""
        }
        ${isHovered ? "scale-102 shadow-md" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Vehicle animation component
export const AnimatedVehicle = ({
  children,
  isMoving = false,
  isAssigned = false,
  className = "",
}: {
  children: ReactNode;
  isMoving?: boolean;
  isAssigned?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${isMoving ? "animate-pulse" : ""}
        ${isAssigned ? "scale-105 shadow-lg shadow-green-500/50" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Status indicator component
export const AnimatedStatusIndicator = ({
  status = "idle",
  size = "md",
  className = "",
}: {
  status?: "idle" | "success" | "warning" | "error" | "loading";
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusClasses = {
    idle: "bg-gray-400",
    success: "bg-green-500 animate-pulse",
    warning: "bg-yellow-500 animate-pulse",
    error: "bg-red-500 animate-pulse",
    loading: "bg-blue-500 animate-spin",
  };

  return (
    <div
      className={`
        rounded-full ${sizeClasses[size]} ${statusClasses[status]}
        transition-all duration-300 ${className}
      `}
    />
  );
};

// Celebration component for completion
export const CelebrationEffect = ({
  show = false,
  children,
}: {
  show?: boolean;
  children: ReactNode;
}) => {
  if (!show) return <>{children}</>;

  return (
    <div className="relative">
      <div className="absolute inset-0 animate-ping bg-green-400 rounded-full opacity-20" />
      <div className="relative animate-bounce">{children}</div>
    </div>
  );
};

// Confetti effect component
export const ConfettiEffect = ({ show = false }: { show?: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`
            absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400
            animate-bounce opacity-80
          `}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${1 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
};

// Step transition wrapper
export const StepTransition = ({
  children,
  isVisible = true,
  direction = "up",
}: {
  children: ReactNode;
  isVisible?: boolean;
  direction?: "up" | "down" | "left" | "right";
}) => {
  const directionClasses = {
    up: isVisible ? "animate-slide-in-bottom" : "animate-slide-out-top",
    down: isVisible ? "animate-slide-in-top" : "animate-slide-out-bottom",
    left: isVisible ? "animate-slide-in-right" : "animate-slide-out-left",
    right: isVisible ? "animate-slide-in-left" : "animate-slide-out-right",
  };

  return (
    <div
      className={`transition-all duration-500 ${directionClasses[direction]}`}
    >
      {children}
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full h-full w-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );
};

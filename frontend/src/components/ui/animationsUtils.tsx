// CSS Animation classes and utilities
export const animationClasses = {
  // Fade animations
  fadeIn: "animate-fade-in",
  fadeInUp: "animate-fade-in-up",
  fadeInDown: "animate-fade-in-down",
  fadeInLeft: "animate-fade-in-left",
  fadeInRight: "animate-fade-in-right",

  // Scale animations
  scaleIn: "animate-scale-in",
  scaleOut: "animate-scale-out",

  // Slide animations
  slideInFromBottom: "animate-slide-in-bottom",
  slideInFromTop: "animate-slide-in-top",
  slideInFromLeft: "animate-slide-in-left",
  slideInFromRight: "animate-slide-in-right",

  // Bounce animations
  bounce: "animate-bounce",
  bounceIn: "animate-bounce-in",

  // Pulse animations
  pulse: "animate-pulse",
  pulseSlow: "animate-pulse-slow",
  pulseFast: "animate-pulse-fast",

  // Spin animations
  spin: "animate-spin",
  spinSlow: "animate-spin-slow",

  // Special effect animations
  glow: "animate-glow",
  shimmer: "animate-shimmer",
  wiggle: "animate-wiggle",
  heartbeat: "animate-heartbeat",

  // Hover effects
  hoverLift: "hover:-translate-y-1 transition-transform duration-200",
  hoverScale: "hover:scale-105 transition-transform duration-200",
  hoverGlow:
    "hover:shadow-lg hover:shadow-blue-500/25 transition-shadow duration-200",

  // Loading states
  loading: "animate-pulse bg-gray-200",
  skeleton:
    "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]",
};

// Animation delay utilities
export const getDelayClass = (delay: number) => {
  const delayMap: Record<number, string> = {
    0: "",
    100: "delay-100",
    200: "delay-200",
    300: "delay-300",
    500: "delay-500",
    700: "delay-700",
    1000: "delay-1000",
  };
  return delayMap[delay] || "";
};
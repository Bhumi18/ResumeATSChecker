import { useEffect, useState, useRef } from "react";

const ScoreCircle = ({ score }: { score: number | null | undefined }) => {
  const hasScore = typeof score === 'number' && Number.isFinite(score);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);

  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = animatedScore / 100;
  const strokeDashoffset = circumference * (1 - progress);

  // Animate score on mount with easing
  useEffect(() => {
    setIsVisible(true);

    if (!hasScore) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1500;
    const steps = 80;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - step / steps, 4);
      current = Math.round((score as number) * easeOutQuart);

      if (step >= steps) {
        setAnimatedScore(score as number);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hasScore, score]);

  // Get color based on score
  const getScoreColor = () => {
    if (!hasScore) return { start: "#6b7280", end: "#9ca3af", glow: "rgba(107, 114, 128, 0.25)" };
    if (score >= 80) return { start: "#059669", end: "#10b981", glow: "rgba(16, 185, 129, 0.4)" };
    if (score >= 60) return { start: "#d97706", end: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
    return { start: "#dc2626", end: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getScoreColor();

  return (
    <div
      ref={circleRef}
      className={`relative w-[100px] h-[100px] cursor-pointer transition-all duration-500 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        filter: isHovered ? `drop-shadow(0 0 15px ${colors.glow})` : "none",
      }}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          opacity: isHovered ? 0.8 : 0.3,
          transform: isHovered ? "scale(1.3)" : "scale(1)",
        }}
      />

      <svg
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        className="transform -rotate-90 relative z-10"
      >
        {/* Background circle with subtle animation */}
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="transparent"
          className="transition-all duration-500"
          style={{
            opacity: isHovered ? 0.5 : 1,
          }}
        />
        {/* Gradient definitions */}
        <defs>
          <linearGradient id={`grad-${hasScore ? score : 'na'}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.start}>
              <animate
                attributeName="stop-color"
                values={`${colors.start};${colors.end};${colors.start}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={colors.end}>
              <animate
                attributeName="stop-color"
                values={`${colors.end};${colors.start};${colors.end}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          {/* Glow filter */}
          <filter id={`glow-${hasScore ? score : 'na'}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Animated progress circle */}
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke={`url(#grad-${hasScore ? score : 'na'})`}
          strokeWidth={isHovered ? stroke + 2 : stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter={isHovered ? `url(#glow-${hasScore ? score : 'na'})` : "none"}
          className="transition-all duration-300 ease-out"
          style={{
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.1))`,
          }}
        />
        {/* Decorative particles on hover */}
        {isHovered && (
          <>
            <circle cx="50" cy="10" r="2" fill={colors.start} opacity="0.6">
              <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="90" cy="50" r="2" fill={colors.end} opacity="0.6">
              <animate attributeName="r" values="2;3;2" dur="1.2s" repeatCount="indefinite"/>
            </circle>
          </>
        )}
      </svg>

      {/* Score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span
          className="font-bold text-xl transition-all duration-300"
          style={{
            color: colors.start,
            transform: isHovered ? "scale(1.15)" : "scale(1)",
            textShadow: isHovered ? `0 0 10px ${colors.glow}` : "none",
          }}
        >
          {hasScore ? animatedScore : '—'}
        </span>
        <span
          className="text-xs text-ink-400 transition-all duration-300"
          style={{
            opacity: isHovered ? 0.8 : 1,
          }}
        >
          / 100
        </span>
      </div>

      {/* Pulse ring on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-full border-2 animate-ping"
          style={{
            borderColor: colors.glow,
            animationDuration: "1.5s",
          }}
        />
      )}
    </div>
  );
};

export default ScoreCircle;

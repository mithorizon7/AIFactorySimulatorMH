import LightAnimation from "./LightAnimation";
import sparkAnimation from "../../assets/spark-animation.json";
import robotHelperAnimation from "../../assets/robot-helper.json";

interface SparkCharacterProps {
  message?: string;
  onAnimationComplete?: () => void;
  size?: "small" | "medium" | "large";
  className?: string;
  position?: "corner" | "inline";
}

export function SparkCharacter({
  message,
  onAnimationComplete,
  size = "medium",
  className = "",
  position = "inline",
}: SparkCharacterProps) {
  const sizes = { small: "h-20 w-16", medium: "h-30 w-24", large: "h-40 w-32" };
  const hasSpark = Object.keys(sparkAnimation).length > 5;
  const character = (
    <div className={`${sizes[size]} relative shrink-0`}>
      <LightAnimation
        animationData={hasSpark ? sparkAnimation : robotHelperAnimation}
        loop={!hasSpark}
        onComplete={onAnimationComplete}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-blue-400/20 blur-md motion-safe:animate-pulse"
      />
      <span className="absolute -bottom-1 -right-1 rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
        Spark
      </span>
    </div>
  );
  if (position === "corner")
    return (
      <div className={`absolute right-2 top-2 ${className}`}>{character}</div>
    );
  return (
    <div className={`flex min-w-0 flex-wrap items-start gap-3 ${className}`}>
      {character}
      {message && (
        <div className="min-w-0 flex-1 rounded-lg bg-blue-700 px-4 py-3 text-white shadow-lg">
          <p className="mb-2 text-sm font-semibold">Spark AI Advisor</p>
          <p className="break-words text-sm leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  );
}

export default SparkCharacter;

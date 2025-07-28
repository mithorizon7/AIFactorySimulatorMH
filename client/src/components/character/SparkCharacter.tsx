import React, { useState, useRef } from 'react';
import Lottie from 'lottie-react';
import sparkAnimation from '../../assets/spark-animation.json';

interface SparkCharacterProps {
  message?: string;
  onAnimationComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  position?: 'corner' | 'inline';
}

export function SparkCharacter({ 
  message, 
  onAnimationComplete, 
  size = 'medium',
  className = '',
  position = 'inline'
}: SparkCharacterProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const lottieRef = useRef<any>(null);

  const sizeClasses = {
    small: 'w-16 h-20',
    medium: 'w-24 h-30',
    large: 'w-32 h-40'
  };

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  const handleAnimationLoaded = () => {
    // Play animation once and then stop
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1);
      lottieRef.current.play();
    }
  };

  // Fallback Spark visual component
  const SparkFallback = ({ size }: { size: 'small' | 'medium' | 'large' }) => {
    const sparkSize = size === 'small' ? 'w-16 h-16' : size === 'large' ? 'w-32 h-32' : 'w-24 h-24';
    
    return (
      <div className={`${sparkSize} relative flex items-center justify-center border-2 border-blue-400`}>
        {/* Main Spark Circle - Made more visible with border */}
        <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20">
          {/* Inner Spark */}
          <div className="w-3/4 h-3/4 bg-gradient-to-tr from-white/40 to-blue-300/20 rounded-full flex items-center justify-center">
            {/* Spark Eyes */}
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Floating Particles - Made larger and more visible */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce shadow-lg"></div>
        <div className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1s' }}></div>
        
        {/* Glow Effect - Enhanced */}
        <div className="absolute inset-0 bg-blue-400/40 rounded-full blur-lg animate-pulse"></div>
        <div className="absolute inset-1 bg-purple-400/30 rounded-full blur-md animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
    );
  };

  // Corner positioning for dialogs and notifications
  if (position === 'corner') {
    return (
      <div className={`absolute top-2 right-2 z-50 ${className}`}>
        <div className={`${sizeClasses[size]} relative`}>
          {sparkAnimation && Object.keys(sparkAnimation).length > 5 ? (
            <Lottie
              lottieRef={lottieRef}
              animationData={sparkAnimation}
              loop={false}
              autoplay={true}
              onComplete={handleAnimationComplete}
              onDOMLoaded={handleAnimationLoaded}
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          ) : (
            <SparkFallback size={size} />
          )}
          
          {/* Spark's "AI Glow" Effect */}
          <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-md animate-pulse" />
          
          {/* Character Name Badge */}
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            Spark
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* Spark Character Animation */}
      <div className={`${sizeClasses[size]} flex-shrink-0 relative`}>
        {sparkAnimation && Object.keys(sparkAnimation).length > 5 ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={sparkAnimation}
            loop={false}
            autoplay={true}
            onComplete={handleAnimationComplete}
            onDOMLoaded={handleAnimationLoaded}
            className="w-full h-full"
            style={{
              background: 'transparent'
            }}
          />
        ) : (
          <SparkFallback size={size} />
        )}
        
        {/* Spark's "AI Glow" Effect */}
        <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-md animate-pulse" />
        
        {/* Character Name Badge */}
        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
          Spark
        </div>
      </div>

      {/* Message Bubble */}
      {message && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg px-4 py-3 relative max-w-md flex-1 shadow-lg">
          {/* Speech Bubble Arrow */}
          <div className="absolute left-0 top-4 transform -translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-blue-600" />
          
          {/* Message Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-blue-200">Spark AI Advisor</span>
            </div>
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SparkCharacter;
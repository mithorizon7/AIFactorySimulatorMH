import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';

// Define the steps of the tutorial
const tutorialSteps = [
  { 
    step: 1, 
    targetId: 'compute-factory-card', 
    text: "Welcome to your AI Factory! Let's start with Compute. This is the raw brainpower for your AI. Click on the Compute section to see how we can improve it." 
  },
  { 
    step: 2, 
    targetId: 'compute-level-upgrade', 
    text: 'Great! Now, click here to invest your starting funds and upgrade your Compute Level. This is essential for unlocking more advanced training.' 
  },
  { 
    step: 3, 
    targetId: 'data-factory-card', 
    text: 'Excellent! Next is Data. AI learns from examples. Click the Data Factory section to see how we can improve its learning material.' 
  },
  { 
    step: 4, 
    targetId: 'data-quality-upgrade', 
    text: 'Perfect. High-quality data makes your AI more reliable. Click here to invest in better data curation.' 
  },
  { 
    step: 5, 
    targetId: 'algorithm-factory-card', 
    text: "Finally, let's look at Algorithms. These are the teaching methods for our AI. Click on the Algorithm section." 
  },
  { 
    step: 6, 
    targetId: 'algorithm-architecture-upgrade', 
    text: 'Better architectures lead to major breakthroughs. Invest now to improve your model design.' 
  },
  { 
    step: 7, 
    targetId: 'dashboard-tab', 
    text: 'Awesome! You\'ve upgraded the three pillars of AI. You\'re ready to begin. Go back to the Dashboard to see your progress.' 
  },
];

interface TutorialGuideProps {
  step: number;
  onComplete: () => void;
  onAdvance: () => void;
}

export default function TutorialGuide({ step, onComplete, onAdvance }: TutorialGuideProps) {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);

  const currentStep = useMemo(() => tutorialSteps.find(s => s.step === step), [step]);

  useEffect(() => {
    if (!currentStep) {
      setHighlightStyle({ display: 'none' });
      setTooltipStyle({ display: 'none' });
      setIsVisible(false);
      return;
    }

    // Small delay to ensure DOM is updated
    const timeout = setTimeout(() => {
      const targetElement = document.querySelector(`[data-tutorial-id='${currentStep.targetId}']`) as HTMLElement;

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Style for the spotlight effect
        setHighlightStyle({
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          pointerEvents: 'none',
          transition: 'all 0.3s ease-in-out',
          zIndex: 999,
        });

        // Calculate tooltip position - try to position it smartly
        let tooltipLeft = rect.left;
        let tooltipTop = rect.bottom + 15;

        // If tooltip would go off screen, position it differently
        if (tooltipTop + 150 > window.innerHeight) {
          tooltipTop = rect.top - 150;
        }
        if (tooltipLeft + 320 > window.innerWidth) {
          tooltipLeft = window.innerWidth - 340;
        }

        // Style for the tooltip
        setTooltipStyle({
          position: 'fixed',
          left: `${Math.max(20, tooltipLeft)}px`,
          top: `${Math.max(20, tooltipTop)}px`,
          transition: 'all 0.3s ease-in-out',
          zIndex: 1000,
        });

        setIsVisible(true);

        // Scroll element into view if needed
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center' 
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentStep]);

  if (!currentStep || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[999]" style={{ pointerEvents: 'none' }}>
      {/* Spotlight element */}
      <div style={highlightStyle}></div>

      {/* Tooltip element */}
      <div 
        style={tooltipStyle} 
        className="max-w-sm p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-amber-500 rounded-lg shadow-2xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="bg-amber-500 rounded-full p-1.5 shrink-0">
            <Lightbulb className="h-4 w-4 text-gray-900" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-400 mb-1">Spark's Guide</h4>
            <p className="text-sm text-gray-200 leading-relaxed">{currentStep.text}</p>
          </div>
          <button 
            onClick={onComplete}
            className="text-gray-400 hover:text-white transition-colors p-1"
            style={{ pointerEvents: 'auto' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={onAdvance} 
            variant="outline" 
            size="sm" 
            className="text-xs bg-amber-500 hover:bg-amber-600 text-gray-900 border-amber-500"
            style={{ pointerEvents: 'auto' }}
          >
            Next Step
          </Button>
          <Button 
            onClick={onComplete} 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-400 hover:text-white"
            style={{ pointerEvents: 'auto' }}
          >
            Skip Tutorial
          </Button>
        </div>
        
        {/* Step indicator */}
        <div className="flex justify-center mt-3 gap-1">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index + 1 === step ? 'bg-amber-500' : 
                index + 1 < step ? 'bg-amber-600' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
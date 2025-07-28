import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameStateType } from "@/lib/gameState";
import { tutorialContent } from "@/lib/narrativeContent";
import { ArrowRight, Lightbulb, Cpu, Database, Cog, Target, TrendingUp, DollarSign, Zap, Trophy, Sparkles, X } from "lucide-react";
import { SparkCharacter } from "@/components/character/SparkCharacter";

interface UnifiedTutorialProps {
  gameState: GameStateType;
  onNextStep: () => void;
  onSkipTutorial: () => void;
  onComplete: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  context: string;
  action: string;
  targetElement: string | null;
  modalStyle: boolean;
  icon: string;
  nextTarget?: string;
  highlightTab?: string;
  speaker?: string;
}

export function UnifiedTutorialSystem({ gameState, onNextStep, onSkipTutorial, onComplete }: UnifiedTutorialProps) {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);

  if (!gameState.tutorial.isActive || gameState.tutorial.isCompleted) {
    return null;
  }

  // Get current tutorial step from unified content
  const currentPhase = `PHASE_${gameState.tutorial.phase}` as keyof typeof tutorialContent;
  const stepKey = gameState.tutorial.step as keyof typeof tutorialContent[typeof currentPhase];
  const currentStep = tutorialContent[currentPhase]?.[stepKey] as TutorialStep | undefined;
  
  if (!currentStep) {
    return null;
  }

  const getIcon = (iconName: string) => {
    const iconProps = { className: "h-6 w-6" };
    switch (iconName) {
      case "spark": return <Sparkles {...iconProps} className="h-6 w-6 text-purple-400" />;
      case "lightbulb": return <Lightbulb {...iconProps} className="h-6 w-6 text-yellow-400" />;
      case "cpu": return <Cpu {...iconProps} className="h-6 w-6 text-blue-400" />;
      case "database": return <Database {...iconProps} className="h-6 w-6 text-green-400" />;
      case "cog": return <Cog {...iconProps} className="h-6 w-6 text-purple-400" />;
      case "trending-up": return <TrendingUp {...iconProps} className="h-6 w-6 text-indigo-400" />;
      case "target": return <Target {...iconProps} className="h-6 w-6 text-red-400" />;
      case "dollar-sign": return <DollarSign {...iconProps} className="h-6 w-6 text-green-400" />;
      case "zap": return <Zap {...iconProps} className="h-6 w-6 text-yellow-400" />;
      case "trophy": return <Trophy {...iconProps} className="h-6 w-6 text-gold-400" />;
      default: return <Lightbulb {...iconProps} />;
    }
  };

  // Handle spotlight highlighting for non-modal steps
  useEffect(() => {
    if (!currentStep || currentStep.modalStyle || !currentStep.targetElement) {
      setHighlightStyle({ display: 'none' });
      setTooltipStyle({ display: 'none' });
      setIsVisible(false);
      return;
    }

    const timeout = setTimeout(() => {
      const targetElement = document.querySelector(`[data-tutorial-id='${currentStep.targetElement}']`) as HTMLElement;
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        // Spotlight effect
        setHighlightStyle({
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
          borderRadius: '8px',
          pointerEvents: 'none',
          transition: 'all 0.3s ease-in-out',
          zIndex: 999,
          border: '3px solid #3B82F6',
        });

        // Smart tooltip positioning
        let tooltipLeft = rect.left;
        let tooltipTop = rect.bottom + 20;

        if (tooltipTop + 200 > window.innerHeight) {
          tooltipTop = rect.top - 200;
        }
        if (tooltipLeft + 380 > window.innerWidth) {
          tooltipLeft = window.innerWidth - 400;
        }

        setTooltipStyle({
          position: 'fixed',
          left: `${Math.max(20, tooltipLeft)}px`,
          top: `${Math.max(20, tooltipTop)}px`,
          transition: 'all 0.3s ease-in-out',
          zIndex: 1000,
        });

        setIsVisible(true);

        // Scroll into view
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center' 
        });
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentStep]);

  // Handle tab highlighting
  useEffect(() => {
    if (currentStep?.highlightTab) {
      const tabElement = document.querySelector(`[data-tab="${currentStep.highlightTab}"]`);
      if (tabElement) {
        tabElement.classList.add('tutorial-highlight-tab');
      }
      return () => {
        if (tabElement) {
          tabElement.classList.remove('tutorial-highlight-tab');
        }
      };
    }
  }, [currentStep]);

  const isLastStep = gameState.tutorial.phase === 4 && gameState.tutorial.step === 2;

  // Modal style tutorial steps with Spark character
  if (currentStep.modalStyle) {
    const showSpark = currentStep.speaker === 'spark';

    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700">
          <DialogHeader>
            {showSpark ? (
              <div className="mb-4 relative">
                <SparkCharacter 
                  position="corner"
                  size="small"
                />
                <div className="pr-16">
                  <DialogTitle className="text-xl font-bold text-white mb-2">
                    {currentStep.title}
                  </DialogTitle>
                  <DialogDescription className="text-gray-300 text-base leading-relaxed">
                    {currentStep.content}
                  </DialogDescription>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  {getIcon(currentStep.icon)}
                  <DialogTitle className="text-xl font-bold text-white">
                    {currentStep.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-gray-300 text-base leading-relaxed">
                  {currentStep.content}
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 my-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300 mb-1">Real-World Context</p>
                <p className="text-sm text-blue-200 leading-relaxed">{currentStep.context}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={onSkipTutorial}
              className="text-gray-400 hover:text-white"
            >
              Skip Tutorial
            </Button>
            <Button 
              onClick={isLastStep ? onComplete : onNextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLastStep ? "Start Building!" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Spotlight style tutorial steps
  if (!isVisible || !currentStep.targetElement) return null;

  return (
    <>
      {/* Spotlight highlight */}
      <div style={highlightStyle} />
      
      {/* Tutorial tooltip */}
      <div 
        style={tooltipStyle}
        className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl max-w-sm z-[1000]"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {getIcon(currentStep.icon)}
            <h3 className="font-bold text-white text-sm">{currentStep.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkipTutorial}
              className="ml-auto h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-gray-300 text-sm mb-3 leading-relaxed">
            {currentStep.content}
          </p>
          
          <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3 mb-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-200 leading-relaxed">{currentStep.context}</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Step {gameState.tutorial.step} of {Object.keys(tutorialContent[currentPhase] || {}).length}
            </span>
            <Button 
              onClick={onNextStep}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {currentStep.action || "Continue"}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameStateType } from "@/lib/gameState";
import { getTutorialCurrentStep, tutorialContent, TutorialStepDefinition } from "@/lib/narrativeContent";
import { ArrowRight, Lightbulb, Cpu, Database, Cog, Target, TrendingUp, DollarSign, Zap, Trophy, Sparkles, X } from "lucide-react";
import { SparkCharacter } from "@/components/character/SparkCharacter";

interface UnifiedTutorialProps {
  gameState: GameStateType;
  onNextStep: () => void;
  onSkipTutorial: () => void;
  onComplete: () => void;
}

export function UnifiedTutorialSystem({ gameState, onNextStep, onSkipTutorial, onComplete }: UnifiedTutorialProps) {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Get current tutorial step from unified content
  const currentPhase = `PHASE_${gameState.tutorial.phase}` as keyof typeof tutorialContent;
  const currentStep = getTutorialCurrentStep(gameState.tutorial) as TutorialStepDefinition | undefined;

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

  const isTargetInteractable = (targetElement: HTMLElement) => {
    const rect = targetElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(targetElement);
    const isDisabled =
      targetElement.matches(':disabled') ||
      targetElement.getAttribute('aria-disabled') === 'true';

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      computedStyle.display !== 'none' &&
      computedStyle.visibility !== 'hidden' &&
      !isDisabled
    );
  };

  // Handle spotlight highlighting for non-modal steps
  useEffect(() => {
    setHighlightStyle({ display: 'none' });
    setTooltipStyle({ display: 'none' });
    setIsVisible(false);

    if (!currentStep || currentStep.modalStyle || !currentStep.targetElement) {
      return;
    }

    const targetSelector = `[data-tutorial-id='${currentStep.targetElement}']`;
    let cleanupTargetListeners: (() => void) | undefined;
    let retryTimeout: number | undefined;
    let animationFrame: number | undefined;
    let activeTarget: HTMLElement | null = null;

    const positionSpotlight = (targetElement: HTMLElement) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        const rect = targetElement.getBoundingClientRect();

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

        let tooltipLeft = rect.left;
        let tooltipTop = rect.bottom + 20;

        if (tooltipTop + 220 > window.innerHeight) {
          tooltipTop = rect.top - 220;
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
      });
    };

    const getTargetElement = () => {
      const targetElement = document.querySelector(targetSelector) as HTMLElement | null;
      if (!targetElement || !isTargetInteractable(targetElement)) {
        return null;
      }

      return targetElement;
    };

    const bindToTarget = (targetElement: HTMLElement) => {
      activeTarget = targetElement;
      targetElement.classList.add('tutorial-active-target');
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
      positionSpotlight(targetElement);

      const handleViewportChange = () => {
        const currentTarget = getTargetElement();
        if (currentTarget) {
          positionSpotlight(currentTarget);
        }
      };

      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);

      cleanupTargetListeners = () => {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange, true);
        targetElement.classList.remove('tutorial-active-target');
      };
    };

    const resolveTarget = (attemptsRemaining: number) => {
      const targetElement = document.querySelector(targetSelector) as HTMLElement | null;

      if (!targetElement || !isTargetInteractable(targetElement)) {
        if (attemptsRemaining <= 0) {
          setHighlightStyle({ display: 'none' });
          setTooltipStyle({ display: 'none' });
          setIsVisible(false);
          return;
        }

        retryTimeout = window.setTimeout(() => {
          resolveTarget(attemptsRemaining - 1);
        }, 150);
        return;
      }

      bindToTarget(targetElement);
    };

    retryTimeout = window.setTimeout(() => {
      resolveTarget(20);
    }, 100);

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      cleanupTargetListeners?.();
      activeTarget?.classList.remove('tutorial-active-target');
    };
  }, [currentStep, gameState.tutorial.phase, gameState.tutorial.step]);

  useEffect(() => {
    if (!currentStep || currentStep.modalStyle || !currentStep.targetElement || !isVisible) {
      return;
    }

    const targetElement = document.querySelector(
      `[data-tutorial-id='${currentStep.targetElement}']`
    ) as HTMLElement | null;

    if (!targetElement || !tooltipRef.current) {
      return;
    }

    const isAllowedNode = (node: EventTarget | null) => (
      node instanceof Node &&
      (targetElement.contains(node) || tooltipRef.current?.contains(node) === true)
    );

    const blockPointerInteraction = (event: Event) => {
      if (isAllowedNode(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const blockKeyboardInteraction = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      if (isAllowedNode(document.activeElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('pointerdown', blockPointerInteraction, true);
    document.addEventListener('click', blockPointerInteraction, true);
    document.addEventListener('keydown', blockKeyboardInteraction, true);

    return () => {
      document.removeEventListener('pointerdown', blockPointerInteraction, true);
      document.removeEventListener('click', blockPointerInteraction, true);
      document.removeEventListener('keydown', blockKeyboardInteraction, true);
    };
  }, [currentStep, isVisible]);

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

  // Early returns after all hooks are declared
  if (!gameState.tutorial.isActive || gameState.tutorial.isCompleted) {
    return null;
  }

  if (!currentStep) {
    return null;
  }

  const isLastStep = gameState.tutorial.phase === 4 && gameState.tutorial.step === 3;

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
        ref={tooltipRef}
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

          <div className="bg-amber-900/20 border border-amber-700/30 rounded p-3 mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-300 mb-1">
              Action
            </p>
            <p className="text-sm text-amber-100 leading-relaxed">
              {currentStep.action}
            </p>
          </div>
          
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
              size="sm"
              disabled
              className="bg-blue-600 text-white text-xs disabled:cursor-default disabled:opacity-70"
            >
              Do the highlighted action
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

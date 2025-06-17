import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";

interface HighlightedArea {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialOverlayProps {
  highlightedArea?: HighlightedArea;
  title: string;
  description: string;
  textPosition?: "top" | "bottom" | "left" | "right";
  onNext?: () => void;
  onSkip?: () => void;
  showNextButton?: boolean;
  showSkipButton?: boolean;
  nextButtonText?: string;
}

export default function TutorialOverlay({
  highlightedArea,
  title,
  description,
  textPosition = "bottom",
  onNext,
  onSkip,
  showNextButton = false,
  showSkipButton = true,
  nextButtonText = "Next"
}: TutorialOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate text box position based on highlighted area and textPosition
  const getTextBoxStyle = () => {
    if (!highlightedArea) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const { top, left, width, height } = highlightedArea;
    const offset = 20; // Distance from highlighted area

    switch (textPosition) {
      case "top":
        return {
          top: `${top - offset}px`,
          left: `${left + width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${top + height + offset}px`,
          left: `${left + width / 2}px`,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: `${top + height / 2}px`,
          left: `${left - offset}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${top + height / 2}px`,
          left: `${left + width + offset}px`,
          transform: "translate(0, -50%)",
        };
      default:
        return {
          top: `${top + height + offset}px`,
          left: `${left + width / 2}px`,
          transform: "translate(-50%, 0)",
        };
    }
  };

  // Create spotlight effect using box-shadow
  const getOverlayStyle = () => {
    if (!highlightedArea) {
      return {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
      };
    }

    const { top, left, width, height } = highlightedArea;
    return {
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      boxShadow: `
        0 0 0 ${top}px rgba(0, 0, 0, 0.7),
        0 0 0 ${left}px rgba(0, 0, 0, 0.7),
        ${left + width}px 0 0 9999px rgba(0, 0, 0, 0.7),
        0 ${top + height}px 0 9999px rgba(0, 0, 0, 0.7)
      `,
      clipPath: `polygon(
        0% 0%, 
        0% 100%, 
        ${left}px 100%, 
        ${left}px ${top}px, 
        ${left + width}px ${top}px, 
        ${left + width}px ${top + height}px, 
        ${left}px ${top + height}px, 
        ${left}px 100%, 
        100% 100%, 
        100% 0%
      )`,
    };
  };

  // Handle escape key to skip tutorial
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onSkip) {
        onSkip();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onSkip]);

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-auto"
      style={getOverlayStyle()}
    >
      {/* Highlighted area (if provided) */}
      {highlightedArea && (
        <div
          className="absolute bg-transparent border-2 border-amber-400 rounded-lg shadow-2xl pointer-events-none animate-pulse"
          style={{
            top: `${highlightedArea.top - 2}px`,
            left: `${highlightedArea.left - 2}px`,
            width: `${highlightedArea.width + 4}px`,
            height: `${highlightedArea.height + 4}px`,
          }}
        />
      )}

      {/* Tutorial text box */}
      <div
        className="absolute bg-gray-900 text-white p-6 rounded-lg shadow-2xl border border-amber-400 max-w-sm z-10"
        style={getTextBoxStyle()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-amber-400">{title}</h3>
          {showSkipButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-400 hover:text-white p-1 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          {description}
        </p>

        <div className="flex items-center justify-between">
          {showSkipButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkip}
              className="text-gray-400 border-gray-600 hover:bg-gray-800"
            >
              Skip Tutorial
            </Button>
          )}
          
          {showNextButton && onNext && (
            <Button
              onClick={onNext}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white ml-auto"
            >
              {nextButtonText}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
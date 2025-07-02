import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameStateType } from "@/lib/gameState";
import { ArrowRight, Lightbulb, Cpu, Database, Cog } from "lucide-react";

interface TutorialOverlayProps {
  gameState: GameStateType;
  onNextStep: () => void;
  onSkipTutorial: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  educationalContext: string;
  targetElement?: string;
  action?: string;
  highlightTabId?: string;
}

// Tutorial content organized by phase and step
const tutorialSteps: Record<number, Record<number, TutorialStep>> = {
  // Phase 1: The First Spark of Intelligence
  1: {
    1: {
      title: "Welcome to AI Factory!",
      content: "Hello! I'm Spark, your AI assistant. I'm ready to learn, but I need your help. Let's start by generating some initial intelligence.",
      educationalContext: "You're about to create your first neural network! In the real world, this is like the 'Hello, World!' of AI.",
      action: "Click 'Continue' to begin your AI journey"
    },
    2: {
      title: "Your First Neural Network!",
      content: "Excellent! You've just created your first neural network. We have a basic model, but to make it smarter, we need three key ingredients.",
      educationalContext: "We now have a basic AI model, but to make it truly intelligent, we need Compute, Data, and Algorithms working together.",
      action: "Let's explore the three pillars of AI"
    }
  },
  
  // Phase 2: The Three Pillars of AI
  2: {
    1: {
      title: "Introducing: Compute Power",
      content: "This is **Compute**. Think of it as the 'brainpower' of our AI. By upgrading our compute, we're essentially getting more powerful computers.",
      educationalContext: "This is why companies like Google and NVIDIA build massive data centers! More compute means faster AI training and better performance.",
      targetElement: "compute-panel",
      action: "Click 'Upgrade Compute' to increase our processing power"
    },
    2: {
      title: "The Importance of Data",
      content: "This is **Data**. AI learns from examples. The more high-quality data we give it, the better it understands the world.",
      educationalContext: "We're like a student reading a giant library of books. GPT models were trained on hundreds of billions of words from the internet!",
      targetElement: "data-panel",
      action: "Click 'Upgrade Data' to improve our training examples"
    },
    3: {
      title: "Smart Algorithms",
      content: "These are our **Algorithms**. Think of them as the 'teaching methods' we use. Better algorithms mean our AI learns more efficiently.",
      educationalContext: "This is where breakthroughs like the 'Transformer Architecture' came from - smarter ways to process information.",
      targetElement: "algorithm-panel",
      action: "Click 'Upgrade Algorithm' to improve our learning methods"
    }
  },
  
  // Phase 3: The First Breakthrough
  3: {
    1: {
      title: "Working Toward a Breakthrough",
      content: "Great! Now, let's work towards our first major AI breakthrough: **Unsupervised Pre-training**. This will unlock new capabilities.",
      educationalContext: "Breakthroughs represent major advances in AI research, like when researchers discovered how to train models on unlabeled text.",
      highlightTabId: "breakthroughs-tab",
      action: "Continue upgrading resources to meet the breakthrough requirements"
    },
    2: {
      title: "Breakthrough Achieved!",
      content: "Congratulations! You've achieved your first breakthrough. This represents a major step forward in AI capability.",
      educationalContext: "In the real world, breakthroughs like this enabled the creation of models like GPT and BERT that can understand language.",
      action: "Let's explore how to generate revenue from our AI"
    }
  },
  
  // Phase 4: Economy and Progression
  4: {
    1: {
      title: "Monetizing Your AI",
      content: "Now that we have capable AI, we can start generating revenue! Let's explore B2B and B2C revenue streams.",
      educationalContext: "Real AI companies balance research with revenue generation. OpenAI's API business helps fund their research.",
      highlightTabId: "economy-tab",
      action: "Click on the Economy tab to explore revenue options"
    },
    2: {
      title: "The Path to AGI",
      content: "Finally, let's look at our progression toward Artificial General Intelligence. Each era represents a major milestone.",
      educationalContext: "The journey from simple models to AGI mirrors real AI development - from basic language models to systems that can reason across domains.",
      highlightTabId: "progression-tab",
      action: "Click on the Progression tab to see your path to AGI"
    },
    3: {
      title: "Tutorial Complete!",
      content: "Excellent work! You now understand the fundamentals of AI development. Continue building, experimenting, and learning!",
      educationalContext: "You're now ready to explore advanced concepts like training runs, investment strategies, and breakthrough research.",
      action: "Start your AI journey!"
    }
  }
};

export function TutorialOverlay({ gameState, onNextStep, onSkipTutorial }: TutorialOverlayProps) {
  if (!gameState.tutorial.isActive || gameState.tutorial.isCompleted) {
    return null;
  }

  const currentStep = tutorialSteps[gameState.tutorial.phase]?.[gameState.tutorial.step];
  
  if (!currentStep) {
    return null;
  }

  const isLastStep = gameState.tutorial.phase === 4 && gameState.tutorial.step === 3;

  return (
    <>
      {/* Highlight overlay for specific elements */}
      {currentStep.targetElement && (
        <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none">
          <div 
            className="absolute border-4 border-blue-400 rounded-lg shadow-lg pointer-events-auto"
            style={{
              // Dynamic positioning based on target element would be implemented here
              // For now, using fixed positions as placeholders
            }}
          />
        </div>
      )}
      
      {/* Tutorial Dialog */}
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-gradient-to-br from-blue-900 to-purple-900 border-blue-400/30">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-blue-900" />
              </div>
              <span className="text-blue-300 text-sm font-medium">Spark AI Guide</span>
            </div>
            <DialogTitle className="text-white text-lg">
              {currentStep.title}
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              {currentStep.content}
            </DialogDescription>
          </DialogHeader>
          
          {/* Educational Context Section */}
          <div className="bg-blue-800/30 border border-blue-600/40 rounded-md p-3 mt-4">
            <h5 className="text-blue-300 font-medium text-sm flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" />
              Real-World Context
            </h5>
            <p className="text-blue-100 text-sm">{currentStep.educationalContext}</p>
          </div>
          
          {/* Action guidance */}
          {currentStep.action && (
            <div className="bg-green-800/20 border border-green-600/40 rounded-md p-3 mt-3">
              <h5 className="text-green-300 font-medium text-sm mb-1">Next Action:</h5>
              <p className="text-green-100 text-sm">{currentStep.action}</p>
            </div>
          )}
          
          <DialogFooter className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={onSkipTutorial}
              className="text-gray-300 border-gray-600 hover:bg-gray-800"
            >
              Skip Tutorial
            </Button>
            <Button
              onClick={onNextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLastStep ? "Start Building!" : "Continue"}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </DialogFooter>
          
          {/* Progress indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((phase) => (
              <div
                key={phase}
                className={`w-2 h-2 rounded-full ${
                  phase < gameState.tutorial.phase
                    ? "bg-green-400"
                    : phase === gameState.tutorial.phase
                    ? "bg-blue-400"
                    : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
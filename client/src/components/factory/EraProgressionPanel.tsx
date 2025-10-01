import React from "react";
import { GameStateType, Era, Breakthrough, getNextEra } from "@/lib/gameState";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HistoryIcon, MapPinIcon, SparklesIcon, CheckCircleIcon, LockIcon, InfoIcon } from "lucide-react";
import { EducationalTooltip } from "@/components/ui/educational-tooltip";
import { eraEducationalContent } from "@/lib/educationalContent";

// Helper function to map Era enum values to educational content keys
function getEraContentKey(era: Era): keyof typeof eraEducationalContent {
  // Map Era.GNT2 (value: "GNT-2") to "GNT2" for eraEducationalContent lookup
  switch (era) {
    case Era.GNT2: return "GNT2";
    case Era.GNT3: return "GNT3";
    case Era.GNT4: return "GNT4";
    case Era.GNT5: return "GNT5";
    case Era.GNT6: return "GNT6";
    case Era.GNT7: return "GNT7";
    default: return "GNT2"; // Fallback to first era if somehow we get an invalid value
  }
}

interface EraProgressionPanelProps {
  gameState: GameStateType;
}

export default function EraProgressionPanel({ gameState }: EraProgressionPanelProps) {
  const { currentEra, daysElapsed, intelligence, agiThreshold, breakthroughs, levels } = gameState;
  
  // Calculate progress to next era based on current era and intelligence
  const getNextEraProgress = () => {
    switch (currentEra) {
      case Era.GNT2:
        return Math.min(100, Math.round((intelligence / 200) * 100));
      case Era.GNT3:
        return Math.min(100, Math.round(((intelligence - 200) / 200) * 100));
      case Era.GNT4:
        return Math.min(100, Math.round(((intelligence - 400) / 200) * 100));
      case Era.GNT5:
        return Math.min(100, Math.round(((intelligence - 600) / 200) * 100));
      case Era.GNT6:
        return Math.min(100, Math.round(((intelligence - 800) / 100) * 100));
      case Era.GNT7:
        return Math.min(100, Math.round((intelligence / agiThreshold) * 100));
      default:
        return 0;
    }
  };
  
  // Get breakthroughs for the current era
  const currentEraBreakthroughs = breakthroughs.filter(b => b.era === currentEra);
  
  // Get breakthroughs for the next era
  const nextEra = getNextEra(currentEra);
  const nextEraBreakthroughs = nextEra ? breakthroughs.filter(b => b.era === nextEra) : [];
  
  // Get requirements for the next era
  const getNextEraRequirements = () => {
    switch (currentEra) {
      case Era.GNT2:
        return {
          intelligence: 200,
          compute: 2,
          data: 1,
          algorithm: 1
        };
      case Era.GNT3:
        return {
          intelligence: 400,
          compute: 2,
          data: 3,
          algorithm: 2
        };
      case Era.GNT4:
        return {
          intelligence: 600,
          compute: 3,
          data: 3,
          algorithm: 4
        };
      case Era.GNT5:
        return {
          intelligence: 800,
          compute: 5,
          data: 5,
          algorithm: 5
        };
      case Era.GNT6:
        return {
          intelligence: 900,
          compute: 6,
          data: 6,
          algorithm: 6
        };
      default:
        return {
          intelligence: agiThreshold,
          compute: 8,
          data: 8,
          algorithm: 8
        };
    }
  };
  
  const nextEraRequirements = getNextEraRequirements();
  
  // Define type for era context
  interface EraContext {
    phase: string;
    description: string;
    size: string;
  }
  
  // Get historical context for current era
  const getEraContext = (): EraContext => {
    switch (currentEra) {
      case Era.GNT2:
        return {
          phase: "Early Phase",
          description: "The GNT-2 era represented early transformer models with basic language capabilities. Early Generative Neural Transformers were notable for being able to generate coherent text from prompts.",
          size: "1.5 billion parameters"
        };
      case Era.GNT3:
        return {
          phase: "Mid Phase I",
          description: "GNT-3 showed massive scaling with 175B parameters and demonstrated few-shot learning capabilities - the ability to learn new tasks with minimal examples.",
          size: "175 billion parameters"
        };
      case Era.GNT4:
        return {
          phase: "Mid Phase II",
          description: "GNT-4 introduced multimodal capabilities and significantly improved reasoning, enabling complex problem-solving and better alignment with human instructions.",
          size: "Trillions of parameters"
        };
      case Era.GNT5:
        return {
          phase: "Late Phase I",
          description: "A hypothetical future model with enhanced reasoning and problem-solving capabilities, approaching human-level performance on many tasks.",
          size: "Unknown"
        };
      case Era.GNT6:
        return {
          phase: "Late Phase II",
          description: "A speculative future model with advanced tool use and possibly approaching aspects of general intelligence.",
          size: "Unknown"
        };
      case Era.GNT7:
        return {
          phase: "Final Phase",
          description: "A theoretical model at the threshold of Artificial General Intelligence.",
          size: "Unknown"
        };
      default:
        return {
          phase: "Unknown",
          description: "Unknown era",
          size: "Unknown"
        };
    }
  };
  
  const eraContext = getEraContext();
  
  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <HistoryIcon className="h-5 w-5 mr-2 text-amber-400" />
          <h2 className="text-xl font-semibold">AI Evolution Timeline</h2>
        </div>
        <Badge variant="outline" className="text-amber-400 border-amber-400">
          Day {daysElapsed}
        </Badge>
      </div>
      
      {/* Current Era Display */}
      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <SparklesIcon className="h-4 w-4 mr-2 text-amber-400" />
            <EducationalTooltip 
              content={
                <div className="space-y-2">
                  <p className="font-bold">{eraEducationalContent[getEraContentKey(currentEra)].title}</p>
                  <p>{eraEducationalContent[getEraContentKey(currentEra)].description}</p>
                  {(currentEra === Era.GNT2 || currentEra === Era.GNT3 || currentEra === Era.GNT4) && (
                    <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                      <span className="font-semibold">Historical context:</span> {
                        // Type assertion to safely access historical era content
                        (eraEducationalContent[getEraContentKey(currentEra)] as {realWorldParallel: string}).realWorldParallel
                      }
                    </p>
                  )}
                  {(currentEra === Era.GNT5 || currentEra === Era.GNT6 || currentEra === Era.GNT7) && (
                    <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                      <span className="font-semibold">Possible future:</span> {
                        // Type assertion to safely access future era content
                        (eraEducationalContent[getEraContentKey(currentEra)] as {speculativeDevelopments: string}).speculativeDevelopments
                      }
                    </p>
                  )}
                </div>
              }
              resourceColor="amber-400"
            >
              <h3 className="text-lg font-medium">Current Era: {currentEra}</h3>
            </EducationalTooltip>
          </div>
          <Badge>{eraContext.phase}</Badge>
        </div>
        <p className="text-sm text-gray-300 mb-3">{eraContext.description}</p>
        <div className="flex items-center text-xs text-gray-400 mb-4">
          <span>Model Size: {eraContext.size}</span>
        </div>
        
        {/* Progress to next era */}
        {nextEra && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <EducationalTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-bold">{eraEducationalContent[getEraContentKey(nextEra)].title}</p>
                    <p>{eraEducationalContent[getEraContentKey(nextEra)].description}</p>
                    {(nextEra === Era.GNT3 || nextEra === Era.GNT4) && (
                      <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                        <span className="font-semibold">Industry impact:</span> {
                          // Type assertion to safely access earlier era content
                          (eraEducationalContent[getEraContentKey(nextEra)] as {industryImpact: string}).industryImpact
                        }
                      </p>
                    )}
                    {(nextEra === Era.GNT5 || nextEra === Era.GNT6 || nextEra === Era.GNT7) && (
                      <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                        <span className="font-semibold">Potential impact:</span> {
                          // Type assertion to safely access future era content
                          (eraEducationalContent[getEraContentKey(nextEra)] as {potentialImpact: string}).potentialImpact
                        }
                      </p>
                    )}
                  </div>
                }
                resourceColor="blue-400"
              >
                <span className="text-sm">Progress to {nextEra}</span>
              </EducationalTooltip>
              <span className="text-sm font-medium">{getNextEraProgress()}%</span>
            </div>
            <Progress value={getNextEraProgress()} className="h-2" />
          </div>
        )}
      </div>
      
      {/* Next Era Requirements */}
      {nextEra && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1 text-blue-400" />
            {nextEra} Requirements
          </h3>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <div className="text-xs text-gray-400 mb-1">Intelligence</div>
              <div className="flex items-center justify-between">
                <Progress 
                  value={Math.min(100, (intelligence / nextEraRequirements.intelligence) * 100)} 
                  className="h-1.5 w-20 bg-gray-600 [&>div]:bg-amber-400" 
                />
                <span className="text-xs ml-2">
                  {intelligence.toFixed(2)}/{nextEraRequirements.intelligence}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-400 mb-1">Compute Level</div>
              <div className="flex items-center justify-between">
                <Progress 
                  value={Math.min(100, (levels.compute / nextEraRequirements.compute) * 100)} 
                  className="h-1.5 w-20 bg-gray-600 [&>div]:bg-blue-400" 
                />
                <span className="text-xs ml-2">
                  {levels.compute}/{nextEraRequirements.compute}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-400 mb-1">Data Level</div>
              <div className="flex items-center justify-between">
                <Progress 
                  value={Math.min(100, (levels.data / nextEraRequirements.data) * 100)} 
                  className="h-1.5 w-20 bg-gray-600 [&>div]:bg-green-400" 
                />
                <span className="text-xs ml-2">
                  {levels.data}/{nextEraRequirements.data}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-xs text-gray-400 mb-1">Algorithm Level</div>
              <div className="flex items-center justify-between">
                <Progress 
                  value={Math.min(100, (levels.algorithm / nextEraRequirements.algorithm) * 100)} 
                  className="h-1.5 w-20 bg-gray-600 [&>div]:bg-purple-400" 
                />
                <span className="text-xs ml-2">
                  {levels.algorithm}/{nextEraRequirements.algorithm}
                </span>
              </div>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="text-xs text-gray-400">
            Next Era Breakthroughs: {nextEraBreakthroughs.filter(b => b.unlocked).length}/{nextEraBreakthroughs.length}
          </div>
        </div>
      </div>
      )}
      
      {/* Breakthroughs Section */}
      <div>
        <h3 className="text-md font-medium mb-2 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1 text-green-400" />
          Current Era Breakthroughs
        </h3>
        
        <div className="space-y-2">
          {currentEraBreakthroughs.length > 0 ? (
            currentEraBreakthroughs.map(breakthrough => (
              <div 
                key={breakthrough.id}
                className={`flex items-center p-2 rounded-md ${
                  breakthrough.unlocked ? 'bg-green-900/20' : 'bg-gray-700'
                }`}
              >
                <div className="mr-3">
                  {breakthrough.unlocked ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <EducationalTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-bold">{breakthrough.name}</p>
                        <p>{breakthrough.description}</p>
                        {breakthrough.realWorldParallel && (
                          <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                            <span className="font-semibold">Real-world parallel:</span> {breakthrough.realWorldParallel}
                          </p>
                        )}
                      </div>
                    }
                    resourceColor="green-400"
                  >
                    <h4 className="text-sm font-medium">{breakthrough.name}</h4>
                  </EducationalTooltip>
                  <div className="flex space-x-2 mt-1">
                    {Object.entries(breakthrough.requiredLevels).map(([resource, level]) => (
                      <Badge 
                        key={resource} 
                        variant="outline" 
                        className={`text-xs ${
                          levels[resource as keyof typeof levels] >= level 
                            ? 'text-green-400 border-green-400' 
                            : 'text-gray-400 border-gray-400'
                        }`}
                      >
                        {resource}: {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400 italic p-2">
              No remaining breakthroughs in this era.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
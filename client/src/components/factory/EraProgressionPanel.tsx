import React from "react";
import { GameStateType, Era, Breakthrough } from "@/lib/gameState";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { HistoryIcon, MapPinIcon, SparklesIcon, CheckCircleIcon, LockIcon } from "lucide-react";

interface EraProgressionPanelProps {
  gameState: GameStateType;
}

export default function EraProgressionPanel({ gameState }: EraProgressionPanelProps) {
  const { currentEra, daysElapsed, intelligence, agiThreshold, breakthroughs, levels } = gameState;
  
  // Calculate progress to next era based on current era and intelligence
  const getNextEraProgress = () => {
    switch (currentEra) {
      case Era.GPT2:
        return Math.min(100, Math.round((intelligence / 200) * 100));
      case Era.GPT3:
        return Math.min(100, Math.round(((intelligence - 200) / 200) * 100));
      case Era.GPT4:
        return Math.min(100, Math.round(((intelligence - 400) / 200) * 100));
      case Era.GPT5:
        return Math.min(100, Math.round(((intelligence - 600) / 200) * 100));
      case Era.GPT6:
        return Math.min(100, Math.round(((intelligence - 800) / 100) * 100));
      case Era.GPT7:
        return Math.min(100, Math.round((intelligence / agiThreshold) * 100));
      default:
        return 0;
    }
  };
  
  // Get breakthroughs for the current era
  const currentEraBreakthroughs = breakthroughs.filter(b => b.era === currentEra);
  
  // Get breakthroughs for the next era
  const getNextEra = () => {
    switch (currentEra) {
      case Era.GPT2: return Era.GPT3;
      case Era.GPT3: return Era.GPT4;
      case Era.GPT4: return Era.GPT5;
      case Era.GPT5: return Era.GPT6;
      case Era.GPT6: return Era.GPT7;
      default: return Era.GPT7;
    }
  };
  
  const nextEra = getNextEra();
  const nextEraBreakthroughs = breakthroughs.filter(b => b.era === nextEra);
  
  // Get requirements for the next era
  const getNextEraRequirements = () => {
    switch (currentEra) {
      case Era.GPT2:
        return {
          intelligence: 200,
          compute: 2,
          data: 1,
          algorithm: 1
        };
      case Era.GPT3:
        return {
          intelligence: 400,
          compute: 2,
          data: 3,
          algorithm: 2
        };
      case Era.GPT4:
        return {
          intelligence: 600,
          compute: 3,
          data: 3,
          algorithm: 4
        };
      case Era.GPT5:
        return {
          intelligence: 800,
          compute: 5,
          data: 5,
          algorithm: 5
        };
      case Era.GPT6:
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
  
  // Get historical context for current era
  const getEraContext = () => {
    switch (currentEra) {
      case Era.GPT2:
        return {
          year: "2019",
          description: "The GPT-2 era represented early transformer models with basic language capabilities. OpenAI's GPT-2 was notable for being able to generate coherent text from prompts.",
          size: "1.5 billion parameters"
        };
      case Era.GPT3:
        return {
          year: "2020",
          description: "GPT-3 showed massive scaling with 175B parameters and demonstrated few-shot learning capabilities - the ability to learn new tasks with minimal examples.",
          size: "175 billion parameters"
        };
      case Era.GPT4:
        return {
          year: "2023",
          description: "GPT-4 introduced multimodal capabilities and significantly improved reasoning, enabling complex problem-solving and better alignment with human instructions.",
          size: "Trillions of parameters"
        };
      case Era.GPT5:
        return {
          year: "Near future",
          description: "A hypothetical future model with enhanced reasoning and problem-solving capabilities, approaching human-level performance on many tasks.",
          size: "Unknown"
        };
      case Era.GPT6:
        return {
          year: "Future",
          description: "A speculative future model with advanced tool use and possibly approaching aspects of general intelligence.",
          size: "Unknown"
        };
      case Era.GPT7:
        return {
          year: "Future",
          description: "A theoretical model at the threshold of Artificial General Intelligence.",
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
            <h3 className="text-lg font-medium">Current Era: {currentEra}</h3>
          </div>
          <Badge>{eraContext.year}</Badge>
        </div>
        <p className="text-sm text-gray-300 mb-3">{eraContext.description}</p>
        <div className="flex items-center text-xs text-gray-400 mb-4">
          <span>Model Size: {eraContext.size}</span>
        </div>
        
        {/* Progress to next era */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm">Progress to {nextEra}</span>
            <span className="text-sm font-medium">{getNextEraProgress()}%</span>
          </div>
          <Progress value={getNextEraProgress()} className="h-2" />
        </div>
      </div>
      
      {/* Breakthroughs Section */}
      <div className="mb-4">
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
                <div>
                  <h4 className="text-sm font-medium">{breakthrough.name}</h4>
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
      
      {/* Next Era Requirements */}
      <div>
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
                  {intelligence}/{nextEraRequirements.intelligence}
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
    </div>
  );
}
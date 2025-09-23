import { useState } from "react";
import { GameStateType } from "@/lib/gameState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { 
  BrainCog, 
  Clock, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Lightbulb, 
  Cpu, 
  Database, 
  BarChart3 
} from "lucide-react";

interface DashboardContentProps {
  gameState: GameStateType;
  trainModel: () => void;
  setActiveTab: (tab: string) => void;
  handleNavigateToResource: (resourceType: 'compute' | 'data' | 'algorithm') => void;
}

export default function DashboardContent({ 
  gameState, 
  trainModel, 
  setActiveTab, 
  handleNavigateToResource 
}: DashboardContentProps) {
  
  // Smart action generation logic
  const getNextActions = () => {
    const actions = [];
    
    // Check if training is available and should be top priority
    const canTrain = gameState.training && !gameState.training.active;
    const hasUnlockedBreakthrough = gameState.breakthroughs.some(b => b.unlocked && b.id === gameState.currentGoal.id);
    
    if (canTrain && gameState.computeCapacity.available > 1000) {
      actions.push({
        priority: 1,
        action: "Start AI Training Run",
        description: "Begin training to advance to next AI era",
        icon: <BrainCog className="h-5 w-5 text-purple-400" />,
        color: "border-purple-500/50 bg-purple-900/20",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        onClick: trainModel
      });
    }
    
    // Check for available breakthroughs
    if (hasUnlockedBreakthrough) {
      actions.push({
        priority: 2,
        action: "Breakthrough Achieved!",
        description: "New AI capabilities unlocked - check Breakthroughs tab",
        icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
        color: "border-yellow-500/50 bg-yellow-900/20",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        onClick: () => setActiveTab('breakthroughs')
      });
    }
    
    // Resource optimization suggestions
    const lowestResource = Math.min(gameState.levels.compute, gameState.levels.data, gameState.levels.algorithm);
    if (gameState.levels.compute === lowestResource) {
      actions.push({
        priority: 3,
        action: "Upgrade Compute Infrastructure",
        description: `Compute is your weakest resource (Level ${gameState.levels.compute})`,
        icon: <Cpu className="h-5 w-5 text-blue-400" />,
        color: "border-blue-500/50 bg-blue-900/20",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('compute'); }
      });
    } else if (gameState.levels.data === lowestResource) {
      actions.push({
        priority: 3,
        action: "Improve Data Quality & Quantity",
        description: `Data is your weakest resource (Level ${gameState.levels.data})`,
        icon: <Database className="h-5 w-5 text-green-400" />,
        color: "border-green-500/50 bg-green-900/20",
        buttonColor: "bg-green-600 hover:bg-green-700",
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('data'); }
      });
    } else if (gameState.levels.algorithm === lowestResource) {
      actions.push({
        priority: 3,
        action: "Advance Algorithm Research",
        description: `Algorithms need improvement (Level ${gameState.levels.algorithm})`,
        icon: <Lightbulb className="h-5 w-5 text-purple-400" />,
        color: "border-purple-500/50 bg-purple-900/20",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('algorithm'); }
      });
    }
    
    // System health warnings
    if (gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity > 0.9) {
      actions.unshift({
        priority: 0,
        action: "URGENT: System Overload",
        description: "Your compute capacity is critically high - services degraded",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/20",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('compute'); }
      });
    }
    
    // If no specific actions, show general guidance
    if (actions.length === 0) {
      actions.push({
        priority: 4,
        action: "Continue Resource Development",
        description: "Keep building your compute, data, and algorithm capabilities",
        icon: <TrendingUp className="h-5 w-5 text-gray-400" />,
        color: "border-gray-500/50 bg-gray-800/20",
        buttonColor: "bg-gray-600 hover:bg-gray-700",
        onClick: () => setActiveTab('resources')
      });
    }
    
    return actions.sort((a, b) => a.priority - b.priority).slice(0, 3);
  };

  return (
    <>
      {/* TOP: Prominent AGI Progress with Time Remaining */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg border-2 border-amber-500/20 shadow-xl">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BrainCog className="text-amber-400 h-8 w-8" />
            <h1 className="text-2xl font-bold text-amber-400">AGI Development Progress</h1>
            <Clock className="text-gray-400 h-6 w-6" />
          </div>
          <div className="text-gray-300 text-sm">Mission: Achieve Artificial General Intelligence</div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-amber-400 text-3xl font-bold">
            <AnimatedNumber value={gameState.intelligence.toFixed(0)} /> / <AnimatedNumber value={gameState.agiThreshold} />
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-300">
              {Math.round((gameState.intelligence / gameState.agiThreshold) * 100)}% Complete
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Time: {gameState.daysElapsed} days
            </div>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-6 mb-2">
          <div 
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
            style={{ width: `${Math.max(5, Math.min(100, (gameState.intelligence / gameState.agiThreshold) * 100))}%` }}
          >
            {(gameState.intelligence / gameState.agiThreshold) > 0.05 && (
              <span className="text-white text-xs font-semibold">AGI</span>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE: Next Actions Priority Queue */}
      <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-emerald-400">Priority Actions</h2>
          <span className="text-xs text-gray-400 ml-2">• Most impactful next steps</span>
        </div>
        
        <div className="space-y-3">
          {getNextActions().map((action, index) => (
            <div key={index} className={`border rounded-lg p-4 ${action.color} ${action.urgent ? 'animate-pulse' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div>
                    <h3 className={`font-semibold ${action.urgent ? 'text-red-300' : 'text-white'}`}>
                      {action.action}
                    </h3>
                    <p className="text-sm text-gray-300">{action.description}</p>
                  </div>
                </div>
                <button 
                  onClick={action.onClick}
                  className={`px-4 py-2 rounded-md text-white font-medium transition-colors flex items-center gap-2 ${action.buttonColor}`}
                  data-testid={`action-${index}`}
                >
                  Take Action
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM: At-a-Glance Resource Status */}
      <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-blue-400">Resource Overview</h2>
          <span className="text-xs text-gray-400 ml-2">• Quick status check</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-blue-900/50" data-testid="compute-overview">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 font-medium">Compute</span>
              </div>
              <span className="text-blue-400 font-bold">Level {gameState.levels.compute}</span>
            </div>
            <div className="text-xl font-semibold text-white">
              <AnimatedNumber value={gameState.resources.compute.toFixed(0)} />
            </div>
            <div className="text-sm text-gray-400">
              +<AnimatedNumber value={gameState.production.compute.toFixed(1)} />/sec
            </div>
            <div className="mt-2 text-xs">
              <span className="text-gray-400">Capacity: </span>
              <span className={gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity > 0.9 ? 'text-red-400' : 'text-green-400'}>
                {gameState.computeCapacity.used}/{gameState.computeCapacity.maxCapacity}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-green-900/50" data-testid="data-overview">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">Data</span>
              </div>
              <span className="text-green-400 font-bold">Level {gameState.levels.data}</span>
            </div>
            <div className="text-xl font-semibold text-white">
              <AnimatedNumber value={gameState.resources.data.toFixed(0)} />
            </div>
            <div className="text-sm text-gray-400">
              +<AnimatedNumber value={gameState.production.data.toFixed(1)} />/sec
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Quality: Lvl {gameState.dataInputs.quality} • Quantity: Lvl {gameState.dataInputs.quantity}
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-purple-900/50" data-testid="algorithm-overview">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BrainCog className="h-5 w-5 text-purple-400" />
                <span className="text-purple-400 font-medium">Algorithm</span>
              </div>
              <span className="text-purple-400 font-bold">Level {gameState.levels.algorithm}</span>
            </div>
            <div className="text-xl font-semibold text-white">
              <AnimatedNumber value={gameState.resources.algorithm.toFixed(0)} />
            </div>
            <div className="text-sm text-gray-400">
              +<AnimatedNumber value={gameState.production.algorithm.toFixed(1)} />/sec
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Research: {Math.round(gameState.training.algorithmResearchProgress)}% complete
            </div>
          </div>
        </div>
        
        {/* Quick Financial Status */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700" data-testid="financial-overview">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-medium">Available Funds:</span>
              <span className="text-2xl font-bold text-green-400">
                ${(gameState.money / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Revenue: ${((gameState.revenue.b2b + gameState.revenue.b2c + gameState.revenue.investors) / 1000).toFixed(1)}K/day
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
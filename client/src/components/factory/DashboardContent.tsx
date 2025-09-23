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
  
  // Calculate time remaining to AGI based on current progress
  const calculateTimeToAGI = () => {
    const currentIntelligence = gameState.intelligence;
    const targetIntelligence = gameState.agiThreshold;
    const remainingIntelligence = targetIntelligence - currentIntelligence;
    
    // Calculate current intelligence growth rate based on resource production and bonuses
    const baseIntelligenceRate = (
      gameState.production.compute * gameState.bonuses.computeToIntelligence +
      gameState.production.data * gameState.bonuses.dataToIntelligence +
      gameState.production.algorithm * gameState.bonuses.algorithmToIntelligence
    ) || 0;
    
    // Convert per-second rate to per-day (approximate)
    const intelligenceRate = baseIntelligenceRate * 86400; // seconds per day
    
    if (intelligenceRate <= 0 || remainingIntelligence <= 0) {
      return "Complete!";
    }
    
    const daysRemaining = Math.ceil(remainingIntelligence / intelligenceRate);
    if (daysRemaining > 999) {
      return "999+ days";
    }
    return `~${daysRemaining} days`;
  };

  // Intelligent Strategic Action Analysis System
  const getNextActions = () => {
    const actions = [];
    
    // === GAME PHASE DETECTION ===
    const gamePhase = (() => {
      if (gameState.currentEra === 'GNT-2') return 'foundation';
      if (gameState.currentEra === 'GNT-3' || gameState.currentEra === 'GNT-4') return 'scaling';
      return 'advanced';
    })();
    
    // === STRATEGIC BOTTLENECK ANALYSIS ===
    const capacityUtilization = gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity;
    const revenueRate = gameState.revenue.b2b + gameState.revenue.b2c + gameState.revenue.investors;
    const totalProduction = gameState.production.compute + gameState.production.data + gameState.production.algorithm;
    const resourceBalance = {
      compute: gameState.levels.compute,
      data: gameState.levels.data,
      algorithm: gameState.levels.algorithm
    };
    const avgResourceLevel = (resourceBalance.compute + resourceBalance.data + resourceBalance.algorithm) / 3;
    const isResourceImbalanced = Math.max(...Object.values(resourceBalance)) - Math.min(...Object.values(resourceBalance)) > 3;
    
    // === PHASE-SPECIFIC STRATEGIC GUIDANCE ===
    
    if (gamePhase === 'foundation') {
      // Early game: Focus on establishing sustainable foundation
      
      if (gameState.money < 500000 && revenueRate < 50000) {
        actions.push({
          priority: 1,
          action: "Establish Revenue Foundation",
          description: "Low funds + limited income. Time to monetize your capabilities",
          educational: "Early revenue is crucial - it funds your research and prevents game over. Both API and chatbot services generate ongoing income",
          icon: <TrendingUp className="h-5 w-5 text-green-400" />,
          color: "border-green-500/50 bg-green-900/20",
          buttonColor: "bg-green-600 hover:bg-green-700",
          strategies: ["Launch API Service", "Build Chatbot Platform", "Seek Investment"],
          onClick: () => setActiveTab('economy')
        });
      }
      
      if (isResourceImbalanced && avgResourceLevel < 8) {
        const laggingResource = Object.entries(resourceBalance).sort(([,a], [,b]) => a - b)[0][0];
        actions.push({
          priority: 2,
          action: "Balance Your Foundation",
          description: `${laggingResource} is lagging behind - balanced growth prevents bottlenecks`,
          educational: "In early game, keeping resources balanced is more important than specializing. Imbalanced resources create inefficiencies that compound over time",
          icon: <BarChart3 className="h-5 w-5 text-blue-400" />,
          color: "border-blue-500/50 bg-blue-900/20",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          strategies: [`Boost ${laggingResource.charAt(0).toUpperCase() + laggingResource.slice(1)}`],
          onClick: () => { setActiveTab('resources'); handleNavigateToResource(laggingResource); }
        });
      }
      
    } else if (gamePhase === 'scaling') {
      // Mid game: Strategic choices and specialization
      
      const canTrain = gameState.training && !gameState.training.active;
      const hasTrainingCompute = (gameState.computeCapacity.maxCapacity - gameState.computeCapacity.used) > 1000;
      
      if (canTrain && hasTrainingCompute) {
        actions.push({
          priority: 1,
          action: "Era Advancement Opportunity",
          description: `Ready to train next-gen AI model. This is your path to ${gameState.currentEra === 'GNT-3' ? 'GNT-4' : 'GNT-5'}`,
          educational: "Training runs are major milestones that unlock new capabilities and revenue opportunities. Reserve compute for 30 days",
          icon: <BrainCog className="h-5 w-5 text-purple-400" />,
          color: "border-purple-500/50 bg-purple-900/20",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          strategies: ["Begin Training"],
          onClick: trainModel
        });
      }
      
      if (revenueRate > 100000 && gameState.money > 2000000) {
        const nextMilestone = gameState.investmentMilestones.find(m => !m.unlocked && gameState.intelligence >= m.requiredIntelligence);
        if (nextMilestone) {
          actions.push({
            priority: 2,
            action: "Scale Through Investment",
            description: `${nextMilestone.name} available: $${(nextMilestone.funding / 1000000).toFixed(1)}M funding`,
            educational: "Major funding rounds provide capital for aggressive scaling. Use this to dominate compute infrastructure or acquire rare datasets",
            icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
            color: "border-emerald-500/50 bg-emerald-900/20",
            buttonColor: "bg-emerald-600 hover:bg-emerald-700",
            strategies: ["Accept Funding", "Review Terms"],
            onClick: () => setActiveTab('economy')
          });
        }
      }
      
    } else {
      // Advanced game: Optimization and AGI push
      
      const intelligenceGrowthRate = baseIntelligenceRate * 86400;
      const daysToAGI = intelligenceGrowthRate > 0 ? Math.ceil((gameState.agiThreshold - gameState.intelligence) / intelligenceGrowthRate) : 999;
      
      if (daysToAGI > 100 && intelligenceGrowthRate > 0) {
        actions.push({
          priority: 1,
          action: "Accelerate AGI Timeline",
          description: `Current pace: ${daysToAGI} days to AGI. Time to optimize for the final push`,
          educational: "Late game is about maximizing intelligence growth rate through synergies between compute, data, and algorithms. Focus on breakthrough multipliers",
          icon: <Target className="h-5 w-5 text-amber-400" />,
          color: "border-amber-500/50 bg-amber-900/20",
          buttonColor: "bg-amber-600 hover:bg-amber-700",
          strategies: ["Optimize Synergies", "Unlock Breakthroughs", "Scale Infrastructure"],
          onClick: () => setActiveTab('breakthroughs')
        });
      }
    }
    
    // === CRITICAL SYSTEM HEALTH CHECKS ===
    if (capacityUtilization > 0.9) {
      actions.unshift({
        priority: 0,
        action: "SYSTEM OVERLOAD - Immediate Action Required",
        description: `${Math.round(capacityUtilization * 100)}% capacity used. Performance degrading - expand compute now or reduce usage`,
        educational: "High compute usage means your services are slowing down, customers are experiencing delays, and training runs may fail",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/30",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        strategies: ["Expand Infrastructure"],
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('compute'); }
      });
    }
    
    // === BREAKTHROUGH & OPPORTUNITY DETECTION ===
    const availableBreakthroughs = gameState.breakthroughs.filter(b => 
      !b.unlocked && 
      (!b.requiredLevels.compute || gameState.levels.compute >= b.requiredLevels.compute) &&
      (!b.requiredLevels.data || gameState.levels.data >= b.requiredLevels.data) &&
      (!b.requiredLevels.algorithm || gameState.levels.algorithm >= b.requiredLevels.algorithm)
    );
    
    if (availableBreakthroughs.length > 0 && actions.length < 3) {
      actions.push({
        priority: 2,
        action: "Research Breakthrough Available",
        description: `${availableBreakthroughs.length} breakthrough${availableBreakthroughs.length > 1 ? 's' : ''} ready to unlock`,
        educational: "Breakthroughs provide permanent bonuses and unlock new strategies. They're force multipliers for all your resources",
        icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
        color: "border-yellow-500/50 bg-yellow-900/20",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        strategies: ["Research Breakthroughs"],
        onClick: () => setActiveTab('breakthroughs')
      });
    }
    
    // === INTELLIGENT FALLBACK GUIDANCE ===
    // Only show if we don't have enough strategic actions
    if (actions.length < 2) {
      // Smart resource optimization based on current situation
      const resourceGaps = Object.entries(resourceBalance)
        .map(([name, level]) => ({ name, level, gap: avgResourceLevel - level }))
        .filter(r => r.gap > 1)
        .sort((a, b) => b.gap - a.gap);
        
      if (resourceGaps.length > 0) {
        const topGap = resourceGaps[0];
        actions.push({
          priority: 3,
          action: "Strategic Resource Development",
          description: `${topGap.name} optimization would provide the biggest impact right now`,
          educational: `${topGap.name} improvements boost both production and unlock higher-level capabilities. This creates compound growth effects`,
          icon: topGap.name === 'compute' ? <Cpu className="h-5 w-5 text-blue-400" /> : 
                topGap.name === 'data' ? <Database className="h-5 w-5 text-green-400" /> : 
                <Lightbulb className="h-5 w-5 text-purple-400" />,
          color: topGap.name === 'compute' ? "border-blue-500/50 bg-blue-900/20" : 
                 topGap.name === 'data' ? "border-green-500/50 bg-green-900/20" : 
                 "border-purple-500/50 bg-purple-900/20",
          buttonColor: topGap.name === 'compute' ? "bg-blue-600 hover:bg-blue-700" : 
                       topGap.name === 'data' ? "bg-green-600 hover:bg-green-700" : 
                       "bg-purple-600 hover:bg-purple-700",
          strategies: [`Develop ${topGap.name.charAt(0).toUpperCase() + topGap.name.slice(1)}`],
          onClick: () => { setActiveTab('resources'); handleNavigateToResource(topGap.name); }
        });
      }
    }
    
    // === PROSPERITY & GROWTH OPPORTUNITIES ===
    if (actions.length < 3 && gameState.money > 1000000 && revenueRate > 50000) {
      actions.push({
        priority: 4,
        action: "Expand Your AI Empire",
        description: "Strong financial position - time for strategic expansion and optimization",
        educational: "With stable revenue, you can take calculated risks and make bold moves. Consider scaling infrastructure or pursuing ambitious research",
        icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
        color: "border-emerald-500/50 bg-emerald-900/20",
        buttonColor: "bg-emerald-600 hover:bg-emerald-700",
        strategies: ["Scale Resources", "Optimize Revenue", "Research Breakthroughs"],
        onClick: () => setActiveTab('resources')
      });
    }
    
    // === FINAL PRIORITIZATION & CURATION ===
    return actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3) // Show max 3 actions to avoid overwhelming
      .map(action => ({
        ...action,
        // Add visual indicators for different action types
        strategicDepth: action.strategies ? action.strategies.length : 1,
        hasEducation: !!action.educational
      }));
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
              Day {gameState.daysElapsed} • Est. {calculateTimeToAGI()}
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
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {action.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${action.urgent ? 'text-red-300' : 'text-white'}`}>
                        {action.action}
                      </h3>
                      {action.hasEducation && (
                        <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-600/30">
                          Why?
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{action.description}</p>
                    
                    {action.educational && (
                      <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded border-l-2 border-amber-600/50 mb-2">
                        💡 {action.educational}
                      </div>
                    )}
                    
                    {action.strategies && action.strategies.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-400 mr-1">Options:</span>
                        {action.strategies.map((strategy, idx) => (
                          <span key={idx} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded border border-gray-600/30">
                            {strategy}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={action.onClick}
                  className={`px-4 py-2 rounded-md text-white font-medium transition-colors flex items-center gap-2 shrink-0 ${action.buttonColor}`}
                  data-testid={`action-${index}`}
                >
                  {action.strategies && action.strategies.length === 1 ? action.strategies[0] : 'Take Action'}
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
              Research: {Math.round(gameState.training?.algorithmResearchProgress || 0)}% complete
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
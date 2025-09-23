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
  BarChart3, 
  DollarSign 
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

  // Advanced Intelligent Priority Actions System
  const getNextActions = () => {
    const actions = [];
    
    // === COMPREHENSIVE GAME STATE ANALYSIS ===
    const metrics = {
      // Financial Intelligence
      totalRevenue: gameState.revenue.b2b + gameState.revenue.b2c + gameState.revenue.investors,
      cashPosition: gameState.money,
      revenueGrowthPotential: gameState.revenue.b2b < 1000000, // Can still scale significantly
      financialStability: gameState.money > 500000 && (gameState.revenue.b2b + gameState.revenue.b2c) > 50000,
      
      // Capacity Intelligence
      capacityUtilization: gameState.computeCapacity.maxCapacity > 0 ? 
        gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity : 0,
      freeCompute: gameState.computeCapacity.maxCapacity - gameState.computeCapacity.used,
      computeGrowthPotential: gameState.computeCapacity.maxCapacity < 100000, // Can still scale meaningfully
      
      // Resource Intelligence
      resources: {
        compute: gameState.levels.compute,
        data: gameState.levels.data,
        algorithm: gameState.levels.algorithm
      },
      avgResourceLevel: (gameState.levels.compute + gameState.levels.data + gameState.levels.algorithm) / 3,
      resourceGaps: (() => {
        const levels = [gameState.levels.compute, gameState.levels.data, gameState.levels.algorithm];
        const max = Math.max(...levels);
        return {
          compute: max - gameState.levels.compute,
          data: max - gameState.levels.data,
          algorithm: max - gameState.levels.algorithm
        };
      })(),
      
      // Production Intelligence  
      intelligenceRate: (
        gameState.production.compute * gameState.bonuses.computeToIntelligence +
        gameState.production.data * gameState.bonuses.dataToIntelligence +
        gameState.production.algorithm * gameState.bonuses.algorithmToIntelligence
      ) * 86400, // per day
      
      // Strategic Intelligence
      currentEra: gameState.currentEra,
      agiProgress: gameState.intelligence / gameState.agiThreshold,
      canTrain: gameState.training && !gameState.training.active,
      daysToAgi: (() => {
        const rate = (
          gameState.production.compute * gameState.bonuses.computeToIntelligence +
          gameState.production.data * gameState.bonuses.dataToIntelligence +
          gameState.production.algorithm * gameState.bonuses.algorithmToIntelligence
        ) * 86400;
        return rate > 0 ? Math.ceil((gameState.agiThreshold - gameState.intelligence) / rate) : 999;
      })(),
      
      // Critical Financial Intelligence
      netCashFlow: (() => {
        const totalRevenue = (
          gameState.services.api.active ? gameState.services.api.monthlyRevenue * 30 : 0
        ) + (
          gameState.services.chatbot.active ? gameState.services.chatbot.monthlyRevenue * 30 : 0
        );
        const totalCosts = (
          gameState.computeCapacity.maxCapacity * 50 + // Infrastructure costs
          gameState.levels.compute * 1000 + // Operational costs
          gameState.levels.data * 800 +
          gameState.levels.algorithm * 600
        );
        return totalRevenue - totalCosts;
      })(),
      cashRunwayDays: (() => {
        const totalRevenue = (
          gameState.services.api.active ? gameState.services.api.monthlyRevenue * 30 : 0
        ) + (
          gameState.services.chatbot.active ? gameState.services.chatbot.monthlyRevenue * 30 : 0
        );
        const totalCosts = (
          gameState.computeCapacity.maxCapacity * 50 + // Infrastructure costs
          gameState.levels.compute * 1000 + // Operational costs
          gameState.levels.data * 800 +
          gameState.levels.algorithm * 600
        );
        const netCashFlow = totalRevenue - totalCosts;
        return netCashFlow >= 0 ? 999 : Math.max(0, Math.floor(gameState.money / Math.abs(netCashFlow)));
      })()
    };
    
    // === INTELLIGENT ERA DETECTION ===
    const eraPhase = (() => {
      const era = metrics.currentEra;
      const avg = metrics.avgResourceLevel;
      const revenue = metrics.totalRevenue;
      
      if (era === 'GNT-2' || (avg < 6 && revenue < 25000)) return { phase: 'foundation', era: 'startup' };
      if (era === 'GNT-2' && avg >= 6) return { phase: 'foundation', era: 'growth' };
      if (era === 'GNT-3') return { phase: 'scaling', era: 'early_scale' };  
      if (era === 'GNT-4') return { phase: 'scaling', era: 'mid_scale' };
      if (era === 'GNT-5') return { phase: 'advanced', era: 'optimization' };
      if (era === 'GNT-6') return { phase: 'advanced', era: 'breakthrough' };
      if (era === 'GNT-7') return { phase: 'advanced', era: 'agi_push' };
      
      // Fallback based on progress
      if (metrics.agiProgress < 0.2) return { phase: 'foundation', era: 'startup' };
      if (metrics.agiProgress < 0.5) return { phase: 'scaling', era: 'early_scale' };
      if (metrics.agiProgress < 0.8) return { phase: 'advanced', era: 'optimization' };
      return { phase: 'advanced', era: 'agi_push' };
    })();
    
    // === RISK & OPPORTUNITY ANALYSIS ===
    const analysis = {
      // Critical Risks (Priority 0)
      systemOverload: metrics.capacityUtilization > 0.9,
      cashCrisis: metrics.cashRunwayDays < 30 && metrics.netCashFlow < 0,
      revenueCollapse: metrics.totalRevenue < 5000 && gameState.money < 100000,
      
      // High Impact Opportunities (Priority 1)
      trainingReady: metrics.canTrain && metrics.freeCompute > 1000,
      majorFunding: gameState.investmentMilestones.some(m => 
        !m.unlocked && gameState.intelligence >= m.requiredIntelligence && gameState.money > 1000000
      ),
      breakthroughReady: gameState.breakthroughs.filter(b => 
        !b.unlocked && 
        (!b.requiredLevels.compute || metrics.resources.compute >= b.requiredLevels.compute) &&
        (!b.requiredLevels.data || metrics.resources.data >= b.requiredLevels.data) &&
        (!b.requiredLevels.algorithm || metrics.resources.algorithm >= b.requiredLevels.algorithm)
      ).length > 0,
      
      // Growth Opportunities (Priority 2)
      resourceImbalance: Object.entries(metrics.resourceGaps).filter(([,gap]) => gap > 2).length > 0,
      capacityWaste: metrics.capacityUtilization < 0.4 && metrics.freeCompute > 2000,
      revenueOptimization: metrics.totalRevenue > 50000 && metrics.netCashFlow > 100000,
      
      // Efficiency Improvements (Priority 3)
      synergyOpportunity: (gameState.bonuses.computeToIntelligence + 
                          gameState.bonuses.dataToIntelligence + 
                          gameState.bonuses.algorithmToIntelligence) / 3 < 2,
      agiAcceleration: metrics.daysToAgi > 50 && metrics.intelligenceRate > 0
    };
    
    // === INTELLIGENT ACTION GENERATION SYSTEM ===
    
    // Priority 0: Critical Issues (Always shown first)
    if (analysis.systemOverload) {
      actions.unshift({
        priority: 0,
        action: "CRITICAL: System Overload",
        description: `${Math.round(metrics.capacityUtilization * 100)}% capacity used - performance degrading rapidly`,
        educational: "High compute usage causes service slowdowns, customer dissatisfaction, and training failures. Immediate expansion needed",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/30",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        strategies: ["Expand Compute"],
        onClick: () => { setActiveTab('resources'); handleNavigateToResource('compute'); }
      });
    }
    
    if (analysis.cashCrisis) {
      actions.unshift({
        priority: 0,
        action: "URGENT: Cash Crisis",
        description: `${metrics.cashRunwayDays} days of funding left with $${Math.round(Math.abs(metrics.netCashFlow)).toLocaleString()}/day burn rate`,
        educational: "Negative cash flow means imminent bankruptcy. Launch revenue services immediately or seek emergency funding to avoid game over",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/30",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        strategies: ["Launch Services", "Emergency Funding"],
        onClick: () => setActiveTab('economy')
      });
    }
    
    if (analysis.revenueCollapse) {
      actions.unshift({
        priority: 0,
        action: "URGENT: Revenue Crisis",
        description: `$${Math.round(gameState.money).toLocaleString()} funds + $${Math.round(metrics.totalRevenue).toLocaleString()}/day income - bankruptcy imminent`,
        educational: "Without revenue or capital, R&D stops completely. Launch services immediately or game over is inevitable",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/30",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        strategies: ["Launch API", "Seek Investment"],
        onClick: () => setActiveTab('economy')
      });
    }
    
    // Priority 1: Major Opportunities Based on Era
    if (analysis.trainingReady && eraPhase.phase !== 'foundation') {
      const nextEra = metrics.currentEra === 'GNT-2' ? 'GNT-3' : metrics.currentEra === 'GNT-3' ? 'GNT-4' : 
                     metrics.currentEra === 'GNT-4' ? 'GNT-5' : metrics.currentEra === 'GNT-5' ? 'GNT-6' : 'GNT-7';
      actions.push({
        priority: 1,
        action: `Era Advancement: ${nextEra}`,
        description: `${Math.round(metrics.freeCompute)} free compute ready for ${nextEra} training run`,
        educational: `Training to ${nextEra} unlocks new capabilities, better revenue streams, and advances toward AGI. Reserve compute for 30 days`,
        icon: <BrainCog className="h-5 w-5 text-purple-400" />,
        color: "border-purple-500/50 bg-purple-900/20",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        strategies: ["Begin Training"],
        onClick: trainModel
      });
    }
    
    if (analysis.breakthroughReady) {
      const availableBreakthroughs = gameState.breakthroughs.filter(b => 
        !b.unlocked && 
        (!b.requiredLevels?.compute || metrics.resources.compute >= b.requiredLevels.compute) &&
        (!b.requiredLevels?.data || metrics.resources.data >= b.requiredLevels.data) &&
        (!b.requiredLevels?.algorithm || metrics.resources.algorithm >= b.requiredLevels.algorithm)
      ).length;
      
      actions.push({
        priority: 1,
        action: "Research Breakthroughs",
        description: `${availableBreakthroughs} breakthrough${availableBreakthroughs > 1 ? 's' : ''} ready to unlock`,
        educational: "Breakthroughs provide permanent multipliers and unlock advanced capabilities. They're essential for scaling efficiency",
        icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
        color: "border-yellow-500/50 bg-yellow-900/20",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        strategies: ["Research Advances"],
        onClick: () => setActiveTab('breakthroughs')
      });
    }
    
    // Priority 2: Era-Specific Strategic Guidance
    if (eraPhase.phase === 'foundation') {
      if (gameState.money < 500000 && metrics.totalRevenue < 25000) {
        actions.push({
          priority: 2,
          action: "Establish Revenue Foundation", 
          description: "Low funds + minimal income - time to monetize your AI capabilities",
          educational: "Early revenue funds research and prevents bankruptcy. Both API services and chatbot products generate steady income streams",
          icon: <TrendingUp className="h-5 w-5 text-green-400" />,
          color: "border-green-500/50 bg-green-900/20",
          buttonColor: "bg-green-600 hover:bg-green-700",
          strategies: ["Launch API Service", "Build Chatbot", "Seek Investment"],
          onClick: () => setActiveTab('economy')
        });
      }
      
      if (analysis.resourceImbalance && metrics.avgResourceLevel < 10) {
        const biggestGap = Object.entries(metrics.resourceGaps).reduce((max, [name, gap]) => 
          gap > max.gap ? { name, gap } : max, { name: '', gap: 0 });
        actions.push({
          priority: 2, 
          action: "Balance Resource Development",
          description: `${biggestGap.name} lagging by ${biggestGap.gap} levels - balance prevents bottlenecks`,
          educational: "Balanced early growth is crucial. Resource imbalances create inefficiencies that compound over time and limit scaling",
          icon: <BarChart3 className="h-5 w-5 text-blue-400" />,
          color: "border-blue-500/50 bg-blue-900/20",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          strategies: [`Boost ${biggestGap.name.charAt(0).toUpperCase() + biggestGap.name.slice(1)}`],
          onClick: () => { setActiveTab('resources'); handleNavigateToResource(biggestGap.name as 'compute' | 'data' | 'algorithm'); }
        });
      }
    } else if (eraPhase.phase === 'scaling') {
      if (analysis.majorFunding) {
        const nextMilestone = gameState.investmentMilestones.find(m => 
          !m.unlocked && gameState.intelligence >= m.requiredIntelligence);
        if (nextMilestone) {
          actions.push({
            priority: 2,
            action: "Major Investment Opportunity",
            description: `${nextMilestone.name}: $${(nextMilestone.funding / 1000000).toFixed(1)}M funding available`,
            educational: "Major funding rounds provide capital for aggressive scaling and market dominance. Use wisely for compute or data acquisition",
            icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
            color: "border-emerald-500/50 bg-emerald-900/20",
            buttonColor: "bg-emerald-600 hover:bg-emerald-700",
            strategies: ["Accept Funding", "Review Terms"],
            onClick: () => setActiveTab('economy')
          });
        }
      }
    } else if (eraPhase.phase === 'advanced') {
      if (analysis.agiAcceleration) {
        actions.push({
          priority: 2,
          action: "Accelerate AGI Timeline",
          description: `Current pace: ${metrics.daysToAgi} days to AGI - optimize for the final breakthrough`,
          educational: "Late game is about maximizing intelligence growth through synergies. Focus on breakthrough multipliers and resource optimization",
          icon: <Target className="h-5 w-5 text-amber-400" />,
          color: "border-amber-500/50 bg-amber-900/20", 
          buttonColor: "bg-amber-600 hover:bg-amber-700",
          strategies: ["Optimize Synergies", "Max Efficiency", "Final Push"],
          onClick: () => setActiveTab('breakthroughs')
        });
      }
    }
    
    // Priority 3: Smart Optimization and Fallback Guidance
    if (actions.length < 3) {
      // Capacity optimization opportunities
      if (analysis.capacityWaste) {
        actions.push({
          priority: 3,
          action: "Optimize Compute Utilization",
          description: `${Math.round(metrics.capacityUtilization * 100)}% utilization - scale services to use excess capacity`,
          educational: "Underutilized compute is money wasted. Launch more services or reduce infrastructure to optimize costs and efficiency",
          icon: <Cpu className="h-5 w-5 text-blue-400" />,
          color: "border-blue-500/50 bg-blue-900/20",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          strategies: ["Scale Services", "Right-Size Infrastructure"],
          onClick: () => setActiveTab('economy')
        });
      }
      
      // Resource gap optimization
      if (analysis.resourceImbalance) {
        const biggestGap = Object.entries(metrics.resourceGaps).reduce((max, [name, gap]) => 
          gap > max.gap ? { name, gap } : max, { name: '', gap: 0 });
        if (biggestGap.gap > 0) {
          actions.push({
            priority: 3,
            action: "Optimize Resource Balance",
            description: `${biggestGap.name} lagging by ${biggestGap.gap} levels - balance improves overall efficiency`,
            educational: "Resource imbalances create bottlenecks that limit overall system performance. Balanced growth unlocks synergies",
            icon: biggestGap.name === 'compute' ? <Cpu className="h-5 w-5 text-blue-400" /> :
                  biggestGap.name === 'data' ? <Database className="h-5 w-5 text-green-400" /> :
                  <Lightbulb className="h-5 w-5 text-purple-400" />,
            color: biggestGap.name === 'compute' ? "border-blue-500/50 bg-blue-900/20" :
                   biggestGap.name === 'data' ? "border-green-500/50 bg-green-900/20" :
                   "border-purple-500/50 bg-purple-900/20",
            buttonColor: biggestGap.name === 'compute' ? "bg-blue-600 hover:bg-blue-700" :
                         biggestGap.name === 'data' ? "bg-green-600 hover:bg-green-700" :
                         "bg-purple-600 hover:bg-purple-700",
            strategies: [`Develop ${biggestGap.name.charAt(0).toUpperCase() + biggestGap.name.slice(1)}`],
            onClick: () => { setActiveTab('resources'); handleNavigateToResource(biggestGap.name as 'compute' | 'data' | 'algorithm'); }
          });
        }
      }
      
      // Revenue optimization opportunities
      if (analysis.revenueOptimization && metrics.financialStability) {
        actions.push({
          priority: 3,
          action: "Expand Your AI Empire",
          description: `Strong position: $${Math.round(gameState.money).toLocaleString()} + $${Math.round(metrics.totalRevenue).toLocaleString()}/day - time for strategic expansion`,
          educational: "Financial strength enables bold moves. Scale infrastructure aggressively, pursue breakthrough research, or launch new services",
          icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
          color: "border-emerald-500/50 bg-emerald-900/20",
          buttonColor: "bg-emerald-600 hover:bg-emerald-700",
          strategies: ["Scale Infrastructure", "Research Advances", "Launch Services"],
          onClick: () => setActiveTab('resources')
        });
      }
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
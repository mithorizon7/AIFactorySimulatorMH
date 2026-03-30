import {
  canUnlockBreakthrough,
  Era,
  GameStateType,
  TrainingRequirementDetail,
  getTrainingBlockers,
  getUpcomingTrainingRun,
  hasAchievedAgi,
} from "@/lib/gameState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCog,
  Clock,
  Cpu,
  Database,
  DollarSign,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface DashboardContentProps {
  gameState: GameStateType;
  trainModel: () => void;
  setActiveTab: (tab: string) => void;
  handleNavigateToResource: (resourceType: "compute" | "data" | "algorithm") => void;
}

interface DashboardAction {
  priority: number;
  action: string;
  description: string;
  educational: string;
  icon: JSX.Element;
  color: string;
  buttonColor: string;
  urgent?: boolean;
  strategies: string[];
  onClick: () => void;
}

export default function DashboardContent({
  gameState,
  trainModel,
  setActiveTab,
  handleNavigateToResource,
}: DashboardContentProps) {
  const [selectedAction, setSelectedAction] = useState<DashboardAction | null>(null);

  const openPriorityActionDialog = (actionData: DashboardAction) => {
    setSelectedAction(actionData);
  };

  const operationalRevenue = gameState.revenue.b2b + gameState.revenue.b2c;
  const capacityUtilization = gameState.computeCapacity.maxCapacity > 0
    ? gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity
    : 0;
  const resourceGaps = (() => {
    const maxLevel = Math.max(gameState.levels.compute, gameState.levels.data, gameState.levels.algorithm);
    return {
      compute: maxLevel - gameState.levels.compute,
      data: maxLevel - gameState.levels.data,
      algorithm: maxLevel - gameState.levels.algorithm,
    };
  })();
  const averageResourceLevel = (gameState.levels.compute + gameState.levels.data + gameState.levels.algorithm) / 3;
  const nextTrainingRun = getUpcomingTrainingRun(gameState);
  const trainingBlockers = getTrainingBlockers(gameState);
  const agiAchieved = hasAchievedAgi(gameState);
  const intelligenceProgress = Math.min(100, Math.round((gameState.intelligence / gameState.agiThreshold) * 100));

  const formatTrainingBlocker = (blocker: TrainingRequirementDetail) => {
    if (blocker.type === "funding") {
      return `Earn $${(blocker.required - blocker.current).toLocaleString()} more for the training budget`;
    }

    if (blocker.type === "capacity") {
      return `Add ${(blocker.required - blocker.current).toLocaleString()} available compute for the reserve`;
    }

    if (blocker.isPercentage) {
      return `Raise ${blocker.label.toLowerCase()} to ${blocker.required}%`;
    }

    return `Raise ${blocker.label.toLowerCase()} to ${blocker.required}`;
  };

  const nextMilestoneLabel = (() => {
    if (agiAchieved) {
      return "AGI achieved";
    }

    if (gameState.training.active) {
      return `${gameState.training.daysRemaining} days left in training`;
    }

    if (nextTrainingRun) {
      return `Next milestone: ${nextTrainingRun.name}`;
    }

    return `Reach ${gameState.agiThreshold.toLocaleString()} intelligence`;
  })();

  const getNextActions = () => {
    const actions: DashboardAction[] = [];

    if (capacityUtilization > 0.9) {
      actions.push({
        priority: 0,
        action: "Relieve Compute Pressure",
        description: `${Math.round(capacityUtilization * 100)}% of compute is already committed. Service quality and training headroom are at risk.`,
        educational: "Compute is a shared bottleneck. When customer load crowds out headroom, commercialization starts competing directly with frontier progress.",
        icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
        color: "border-red-500/50 bg-red-900/30",
        buttonColor: "bg-red-600 hover:bg-red-700",
        urgent: true,
        strategies: ["Expand Compute"],
        onClick: () => openPriorityActionDialog({
          priority: 0,
          action: "Relieve Compute Pressure",
          description: `${Math.round(capacityUtilization * 100)}% of compute is already committed. Service quality and training headroom are at risk.`,
          educational: "Compute is a shared bottleneck. Expanding it is one of the clearest ways to restore both product reliability and room for the next training run.",
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          color: "border-red-500/50 bg-red-900/30",
          buttonColor: "bg-red-600 hover:bg-red-700",
          urgent: true,
          strategies: ["Expand Compute"],
          onClick: () => {},
        }),
      });
    }

    if (nextTrainingRun && !gameState.training.active) {
      if (trainingBlockers.length === 0) {
        actions.push({
          priority: 1,
          action: `Start ${nextTrainingRun.name}`,
          description: "All real prerequisites are met. Your next era advance is ready to run.",
          educational: "Training runs are the only way to advance eras. If you are ready, delaying the run is a strategic choice, not a hidden requirement issue.",
          icon: <BrainCog className="h-5 w-5 text-purple-400" />,
          color: "border-purple-500/50 bg-purple-900/20",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          strategies: ["Open Training"],
          onClick: () => openPriorityActionDialog({
            priority: 1,
            action: `Start ${nextTrainingRun.name}`,
            description: "All real prerequisites are met. Your next era advance is ready to run.",
            educational: "Training runs create the big step-changes in capability. Use the Training tab to review the run and launch it when you're comfortable committing the compute reserve.",
            icon: <BrainCog className="h-5 w-5 text-purple-400" />,
            color: "border-purple-500/50 bg-purple-900/20",
            buttonColor: "bg-purple-600 hover:bg-purple-700",
            strategies: ["Open Training"],
            onClick: () => {},
          }),
        });
      } else {
        const primaryBlocker = trainingBlockers[0];
        actions.push({
          priority: 1,
          action: "Clear the Next Training Blocker",
          description: `${formatTrainingBlocker(primaryBlocker)}${trainingBlockers.length > 1 ? ` • ${trainingBlockers.length - 1} other blocker${trainingBlockers.length > 2 ? "s" : ""}` : ""}`,
          educational: "The fastest path forward is to remove the first concrete blocker to your next training run. The Training tab shows the exact engine-checked deficits.",
          icon: <Target className="h-5 w-5 text-amber-400" />,
          color: "border-amber-500/50 bg-amber-900/20",
          buttonColor: "bg-amber-600 hover:bg-amber-700",
          strategies: ["Open Training"],
          onClick: () => openPriorityActionDialog({
            priority: 1,
            action: "Clear the Next Training Blocker",
            description: `${formatTrainingBlocker(primaryBlocker)}${trainingBlockers.length > 1 ? ` • ${trainingBlockers.length - 1} other blocker${trainingBlockers.length > 2 ? "s" : ""}` : ""}`,
            educational: "Good frontier teams make blockers legible. The Training tab is your source of truth for which requirement is still preventing the next training leap.",
            icon: <Target className="h-5 w-5 text-amber-400" />,
            color: "border-amber-500/50 bg-amber-900/20",
            buttonColor: "bg-amber-600 hover:bg-amber-700",
            strategies: ["Open Training"],
            onClick: () => {},
          }),
        });
      }
    }

    if (gameState.revenue.apiAvailable && !gameState.revenue.apiPlatformBuilt) {
      actions.push({
        priority: 2,
        action: "Build the API Platform",
        description: "GNT-3 capability is already unlocked. You still need the platform before developer revenue can start.",
        educational: "Commercialization matters, but it is downstream of technical capability. Training unlocked the capability; platform work turns it into revenue.",
        icon: <DollarSign className="h-5 w-5 text-green-400" />,
        color: "border-green-500/50 bg-green-900/20",
        buttonColor: "bg-green-600 hover:bg-green-700",
        strategies: ["Open Economy"],
        onClick: () => openPriorityActionDialog({
          priority: 2,
          action: "Build the API Platform",
          description: "GNT-3 capability is already unlocked. You still need the platform before developer revenue can start.",
          educational: "This is the first major commercialization move. Building the API platform turns technical progress into cash that can finance later training runs.",
          icon: <DollarSign className="h-5 w-5 text-green-400" />,
          color: "border-green-500/50 bg-green-900/20",
          buttonColor: "bg-green-600 hover:bg-green-700",
          strategies: ["Open Economy"],
          onClick: () => {},
        }),
      });
    } else if (gameState.revenue.apiPlatformBuilt && !gameState.revenue.apiEnabled) {
      actions.push({
        priority: 2,
        action: "Launch API Revenue",
        description: "The API platform is built, but the service is still disabled.",
        educational: "API revenue is the early business model. It monetizes frontier capability while using compute that could otherwise go to research.",
        icon: <TrendingUp className="h-5 w-5 text-green-400" />,
        color: "border-green-500/50 bg-green-900/20",
        buttonColor: "bg-green-600 hover:bg-green-700",
        strategies: ["Open Economy"],
        onClick: () => openPriorityActionDialog({
          priority: 2,
          action: "Launch API Revenue",
          description: "The API platform is built, but the service is still disabled.",
          educational: "Turning on the API service creates the earliest repeatable revenue stream in the sim. That revenue can finance future training, but it will also consume compute.",
          icon: <TrendingUp className="h-5 w-5 text-green-400" />,
          color: "border-green-500/50 bg-green-900/20",
          buttonColor: "bg-green-600 hover:bg-green-700",
          strategies: ["Open Economy"],
          onClick: () => {},
        }),
      });
    } else if (gameState.revenue.chatbotAvailable && !gameState.revenue.chatbotPlatformBuilt) {
      actions.push({
        priority: 2,
        action: "Build the Chatbot Platform",
        description: "GNT-4 capability is ready, but the consumer product infrastructure is not built yet.",
        educational: "The chatbot route is a later commercialization layer. It tends to ramp slower but compounds into a broader consumer business over time.",
        icon: <DollarSign className="h-5 w-5 text-purple-400" />,
        color: "border-purple-500/50 bg-purple-900/20",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        strategies: ["Open Economy"],
        onClick: () => openPriorityActionDialog({
          priority: 2,
          action: "Build the Chatbot Platform",
          description: "GNT-4 capability is ready, but the consumer product infrastructure is not built yet.",
          educational: "Building the chatbot platform converts technical capability into a consumer subscription business. That changes your revenue mix and compute demand profile.",
          icon: <DollarSign className="h-5 w-5 text-purple-400" />,
          color: "border-purple-500/50 bg-purple-900/20",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          strategies: ["Open Economy"],
          onClick: () => {},
        }),
      });
    } else if (operationalRevenue === 0 && gameState.money < (nextTrainingRun?.moneyCost ?? 25000)) {
      actions.push({
        priority: 2,
        action: "Create Revenue Before the Next Leap",
        description: "You do not yet have enough operating revenue to comfortably finance the next training run.",
        educational: "Commercial success funds frontier progress. The sim is teaching that venture funding helps, but product revenue carries the long middle of the journey.",
        icon: <DollarSign className="h-5 w-5 text-green-400" />,
        color: "border-green-500/50 bg-green-900/20",
        buttonColor: "bg-green-600 hover:bg-green-700",
        strategies: ["Open Economy"],
        onClick: () => openPriorityActionDialog({
          priority: 2,
          action: "Create Revenue Before the Next Leap",
          description: "You do not yet have enough operating revenue to comfortably finance the next training run.",
          educational: "Revenue and research compete for compute, but revenue is also what keeps the training ladder affordable. Monetization is part of the frontier strategy, not a side system.",
          icon: <DollarSign className="h-5 w-5 text-green-400" />,
          color: "border-green-500/50 bg-green-900/20",
          buttonColor: "bg-green-600 hover:bg-green-700",
          strategies: ["Open Economy"],
          onClick: () => {},
        }),
      });
    }

    const availableBreakthroughs = gameState.breakthroughs.filter((breakthrough) =>
      canUnlockBreakthrough(gameState, breakthrough)
    ).length;

    if (availableBreakthroughs > 0) {
      actions.push({
        priority: 3,
        action: "Claim Ready Breakthroughs",
        description: `${availableBreakthroughs} breakthrough${availableBreakthroughs > 1 ? "s are" : " is"} ready to unlock from current state.`,
        educational: "Breakthroughs change the economics and efficiency of the whole factory. If one is ready, it is part of the real state, not a cosmetic milestone.",
        icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
        color: "border-yellow-500/50 bg-yellow-900/20",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        strategies: ["Open Breakthroughs"],
        onClick: () => openPriorityActionDialog({
          priority: 3,
          action: "Claim Ready Breakthroughs",
          description: `${availableBreakthroughs} breakthrough${availableBreakthroughs > 1 ? "s are" : " is"} ready to unlock from current state.`,
          educational: "Breakthroughs are real mechanical state changes. Reviewing them helps you understand which combinations of compute, data, and algorithm investment are currently paying off.",
          icon: <Lightbulb className="h-5 w-5 text-yellow-400" />,
          color: "border-yellow-500/50 bg-yellow-900/20",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
          strategies: ["Open Breakthroughs"],
          onClick: () => {},
        }),
      });
    }

    const biggestGap = Object.entries(resourceGaps).reduce(
      (max, [name, gap]) => (gap > max.gap ? { name, gap } : max),
      { name: "compute", gap: 0 }
    );

    if (biggestGap.gap >= 2 && averageResourceLevel < 10) {
      actions.push({
        priority: 3,
        action: "Rebalance the Three Pillars",
        description: `${biggestGap.name} is lagging by ${biggestGap.gap} level${biggestGap.gap > 1 ? "s" : ""}.`,
        educational: "Progress depends on interacting pillars, not one dominant stat. When one pillar falls behind, it becomes the bottleneck for both breakthroughs and training readiness.",
        icon: biggestGap.name === "compute"
          ? <Cpu className="h-5 w-5 text-blue-400" />
          : biggestGap.name === "data"
          ? <Database className="h-5 w-5 text-green-400" />
          : <BarChart3 className="h-5 w-5 text-purple-400" />,
        color: biggestGap.name === "compute"
          ? "border-blue-500/50 bg-blue-900/20"
          : biggestGap.name === "data"
          ? "border-green-500/50 bg-green-900/20"
          : "border-purple-500/50 bg-purple-900/20",
        buttonColor: biggestGap.name === "compute"
          ? "bg-blue-600 hover:bg-blue-700"
          : biggestGap.name === "data"
          ? "bg-green-600 hover:bg-green-700"
          : "bg-purple-600 hover:bg-purple-700",
        strategies: [`Boost ${biggestGap.name}`],
        onClick: () => openPriorityActionDialog({
          priority: 3,
          action: "Rebalance the Three Pillars",
          description: `${biggestGap.name} is lagging by ${biggestGap.gap} level${biggestGap.gap > 1 ? "s" : ""}.`,
          educational: "Balanced growth is what unlocks the strongest synergies in the simulation. Catching the weak pillar up usually produces a cleaner path than over-investing further in the leader.",
          icon: biggestGap.name === "compute"
            ? <Cpu className="h-5 w-5 text-blue-400" />
            : biggestGap.name === "data"
            ? <Database className="h-5 w-5 text-green-400" />
            : <BarChart3 className="h-5 w-5 text-purple-400" />,
          color: "border-gray-700 bg-gray-900/20",
          buttonColor: biggestGap.name === "compute"
            ? "bg-blue-600 hover:bg-blue-700"
            : biggestGap.name === "data"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-purple-600 hover:bg-purple-700",
          strategies: [`Boost ${biggestGap.name}`],
          onClick: () => {},
        }),
      });
    }

    return actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
  };

  const actions = getNextActions();

  return (
    <>
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg border-2 border-amber-500/20 shadow-xl">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BrainCog className="text-amber-400 h-8 w-8" />
            <h1 className="text-2xl font-bold text-amber-400">AGI Readiness</h1>
            <Clock className="text-gray-400 h-6 w-6" />
          </div>
          <div className="text-gray-300 text-sm">
            Complete GNT-7 training and reach the intelligence threshold to win
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-amber-400 text-3xl font-bold">
            <AnimatedNumber value={gameState.intelligence.toFixed(0)} /> / <AnimatedNumber value={gameState.agiThreshold} />
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-300">
              {intelligenceProgress}% of threshold
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Day {gameState.daysElapsed} • {nextMilestoneLabel}
            </div>
            <div className="text-xs text-gray-500">
              Final training: {gameState.training.runs[Era.GNT7].status === "complete" ? "complete" : "not complete"}
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-6 mb-2">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
            style={{ width: `${Math.max(5, intelligenceProgress)}%` }}
          >
            {intelligenceProgress > 5 && (
              <span className="text-white text-xs font-semibold">Threshold</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-5 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-emerald-400">Priority Actions</h2>
          <span className="text-xs text-gray-400 ml-2">• Derived from real blockers</span>
        </div>

        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className={`border rounded-lg p-4 ${action.color} ${action.urgent ? "animate-pulse" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {action.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${action.urgent ? "text-red-300" : "text-white"}`}>
                        {action.action}
                      </h3>
                      <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-600/30">
                        Why?
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{action.description}</p>
                    <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded border-l-2 border-amber-600/50 mb-2">
                      {action.educational}
                    </div>
                    {action.strategies.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-400 mr-1">Options:</span>
                        {action.strategies.map((strategy, strategyIndex) => (
                          <span key={strategyIndex} className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded border border-gray-600/30">
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
                  {action.strategies[0] ?? "Take Action"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
              +<AnimatedNumber value={gameState.production.compute.toFixed(1)} />/day
            </div>
            <div className="mt-2 text-xs">
              <span className="text-gray-400">Capacity: </span>
              <span className={capacityUtilization > 0.9 ? "text-red-400" : "text-green-400"}>
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
              +<AnimatedNumber value={gameState.production.data.toFixed(1)} />/day
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
              +<AnimatedNumber value={gameState.production.algorithm.toFixed(1)} />/day
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Research: {Math.round(gameState.training.algorithmResearchProgress || 0)}% complete
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700" data-testid="financial-overview">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-medium">Available Funds:</span>
              <span className="text-2xl font-bold text-green-400">
                ${(gameState.money / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Revenue: ${((operationalRevenue) / 1000).toFixed(1)}K per day
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction?.icon}
              {selectedAction?.action}
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedAction?.educational && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Why This Matters</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">{selectedAction.educational}</p>
            </div>
          )}

          {selectedAction?.strategies && selectedAction.strategies.length > 1 && (
            <div>
              <h4 className="font-medium mb-2">Strategic Options</h4>
              <div className="space-y-2">
                {selectedAction.strategies.map((strategy, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Target className="h-4 w-4" />
                    {strategy}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => setSelectedAction(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              I'll Handle This Myself
            </button>
            <button
              onClick={() => {
                const actionLabel = selectedAction?.action;

                setSelectedAction(null);

                if (actionLabel === "Relieve Compute Pressure") {
                  setActiveTab("resources");
                  handleNavigateToResource("compute");
                  return;
                }

                if (actionLabel === "Rebalance the Three Pillars") {
                  setActiveTab("resources");
                  return;
                }

                if (actionLabel === `Start ${nextTrainingRun?.name}`) {
                  setActiveTab("training");
                  return;
                }

                if (actionLabel === "Clear the Next Training Blocker") {
                  setActiveTab("training");
                  return;
                }

                if (
                  actionLabel === "Build the API Platform" ||
                  actionLabel === "Launch API Revenue" ||
                  actionLabel === "Build the Chatbot Platform" ||
                  actionLabel === "Create Revenue Before the Next Leap"
                ) {
                  setActiveTab("economy");
                  return;
                }

                if (actionLabel === "Claim Ready Breakthroughs") {
                  setActiveTab("breakthroughs");
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {selectedAction?.strategies?.[0] || "Take Action"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

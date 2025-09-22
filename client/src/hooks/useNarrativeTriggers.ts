import { useEffect, useRef } from 'react';
import { GameStateType } from '@/lib/gameState';
import { narrative } from '@/lib/narrativeContent';

export interface NarrativeMessage {
  id: string;
  title: string;
  content: string;
  context: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  category: 'tutorial' | 'warning' | 'achievement' | 'advice' | 'breakthrough';
  speaker?: 'spark' | 'system';
}

interface UseNarrativeTriggersProps {
  gameState: GameStateType;
  onShowMessage: (message: NarrativeMessage) => void;
}

// Helper function to check if training can be started (basic prerequisite check)
function checkTrainingPrerequisites(gameState: GameStateType): boolean {
  // Basic checks: has compute capacity, some algorithm research progress, and at least one breakthrough
  const hasComputeCapacity = gameState.computeCapacity.used < gameState.computeCapacity.maxCapacity;
  const hasAlgorithmProgress = gameState.training.algorithmResearchProgress > 30; // 30% minimum
  const hasBreakthrough = gameState.breakthroughs.some(b => b.unlocked);
  
  return hasComputeCapacity && hasAlgorithmProgress && hasBreakthrough;
}

// Helper function to check for resource imbalances
function checkResourceImbalance(gameState: GameStateType): boolean {
  const { compute, data, algorithm } = gameState.levels;
  
  // Check if any resource is significantly behind others
  const maxLevel = Math.max(compute, data, algorithm);
  const minLevel = Math.min(compute, data, algorithm);
  
  // If the difference is more than 3 levels, consider it imbalanced
  return (maxLevel - minLevel) > 3;
}

export function useNarrativeTriggers({ gameState, onShowMessage }: UseNarrativeTriggersProps) {
  const previousStateRef = useRef<GameStateType | null>(null);

  useEffect(() => {
    const prevState = previousStateRef.current;
    if (!prevState) {
      previousStateRef.current = gameState;
      return;
    }

    // Check for various conditions and trigger appropriate narrative messages

    // 1. Compute Usage Warnings
    if (gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity > 0.9 && 
        !gameState.narrativeFlags.hasSeenComputeWarning) {
      onShowMessage({
        id: 'compute-warning-high',
        title: narrative.COMPUTE_WARNING_HIGH.title,
        content: narrative.COMPUTE_WARNING_HIGH.content,
        context: narrative.COMPUTE_WARNING_HIGH.context,
        timestamp: Date.now(),
        priority: 'high',
        category: 'warning'
      });
    }

    // 2. Critical Compute Overload
    if (gameState.computeCapacity.used > gameState.computeCapacity.maxCapacity && 
        !gameState.narrativeFlags.hasSeenComputeWarning) {
      onShowMessage({
        id: 'compute-warning-critical',
        title: narrative.COMPUTE_WARNING_CRITICAL.title,
        content: narrative.COMPUTE_WARNING_CRITICAL.content,
        context: narrative.COMPUTE_WARNING_CRITICAL.context,
        timestamp: Date.now(),
        priority: 'critical',
        category: 'warning'
      });
    }

    // 3. Low Funds Warning
    if (gameState.money < 1000 && prevState.money >= 1000 && 
        !gameState.narrativeFlags.hasSeenLowFundsWarning) {
      onShowMessage({
        id: 'money-warning-low',
        title: narrative.MONEY_WARNING_LOW.title,
        content: narrative.MONEY_WARNING_LOW.content,
        context: narrative.MONEY_WARNING_LOW.context,
        timestamp: Date.now(),
        priority: 'high',
        category: 'warning'
      });
    }

    // 4. First Training Run Completion with Spark
    if (prevState.training.active && !gameState.training.active && 
        !gameState.narrativeFlags.hasSeenFirstTraining) {
      onShowMessage({
        id: 'training-first-success',
        title: narrative.TRAINING_FIRST_SUCCESS.title,
        content: narrative.TRAINING_FIRST_SUCCESS.content,
        context: narrative.TRAINING_FIRST_SUCCESS.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'achievement',
        speaker: 'spark'
      });
    }

    // 5. First API Revenue (using B2B revenue as proxy for API)
    if (gameState.revenue.b2b > 0 && prevState.revenue.b2b === 0 && 
        !gameState.narrativeFlags.hasSeenFirstRevenue) {
      onShowMessage({
        id: 'revenue-first-api',
        title: narrative.REVENUE_FIRST_API.title,
        content: narrative.REVENUE_FIRST_API.content,
        context: narrative.REVENUE_FIRST_API.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'achievement'
      });
    }

    // 6. First Subscription Revenue (using B2C revenue as proxy for subscriptions)
    if (gameState.revenue.b2c > 0 && prevState.revenue.b2c === 0) {
      onShowMessage({
        id: 'revenue-first-subscription',
        title: narrative.REVENUE_FIRST_SUBSCRIPTION.title,
        content: narrative.REVENUE_FIRST_SUBSCRIPTION.content,
        context: narrative.REVENUE_FIRST_SUBSCRIPTION.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'achievement'
      });
    }

    // 7. Investment Milestones
    if (gameState.narrativeFlags.totalInvestmentAmount >= 1000000 && 
        !gameState.narrativeFlags.hasSeenInvestmentMilestone1M) {
      onShowMessage({
        id: 'investment-milestone-1m',
        title: narrative.INVESTMENT_MILESTONE_1M.title,
        content: narrative.INVESTMENT_MILESTONE_1M.content,
        context: narrative.INVESTMENT_MILESTONE_1M.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'achievement'
      });
    }

    if (gameState.narrativeFlags.totalInvestmentAmount >= 10000000 && 
        !gameState.narrativeFlags.hasSeenInvestmentMilestone10M) {
      onShowMessage({
        id: 'investment-milestone-10m',
        title: narrative.INVESTMENT_MILESTONE_10M.title,
        content: narrative.INVESTMENT_MILESTONE_10M.content,
        context: narrative.INVESTMENT_MILESTONE_10M.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'achievement'
      });
    }

    // 8. Resource Balance Advice
    const resourceImbalance = checkResourceImbalance(gameState);
    if (resourceImbalance && !gameState.narrativeFlags.hasSeenBalanceAdvice) {
      onShowMessage({
        id: 'advice-balance-resources',
        title: narrative.ADVICE_BALANCE_RESOURCES.title,
        content: narrative.ADVICE_BALANCE_RESOURCES.content,
        context: narrative.ADVICE_BALANCE_RESOURCES.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'advice'
      });
    }

    // 9. Revenue Focus Advice
    if (gameState.intelligence > 300 && gameState.revenue.b2b === 0 && 
        gameState.revenue.b2c === 0) {
      onShowMessage({
        id: 'advice-revenue-focus',
        title: narrative.ADVICE_REVENUE_FOCUS.title,
        content: narrative.ADVICE_REVENUE_FOCUS.content,
        context: narrative.ADVICE_REVENUE_FOCUS.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'advice'
      });
    }

    // 10. Era Advancements
    if (gameState.currentEra !== prevState.currentEra) {
      const eraKey = `ERA_ADVANCE_${gameState.currentEra}` as keyof typeof narrative;
      if (narrative[eraKey]) {
        onShowMessage({
          id: `era-advance-${gameState.currentEra}`,
          title: narrative[eraKey].title,
          content: narrative[eraKey].content,
          context: narrative[eraKey].context,
          timestamp: Date.now(),
          priority: 'high',
          category: 'achievement'
        });
      }
    }

    // 11. Breakthrough Notifications
    if (gameState.breakthroughs.length > prevState.breakthroughs.length) {
      const newBreakthroughs = gameState.breakthroughs.slice(prevState.breakthroughs.length);
      newBreakthroughs.forEach((breakthrough) => {
        const breakthroughKey = `BREAKTHROUGH_${breakthrough.id}` as keyof typeof narrative;
        if (narrative[breakthroughKey]) {
          onShowMessage({
            id: `breakthrough-${breakthrough.id}`,
            title: narrative[breakthroughKey].title,
            content: narrative[breakthroughKey].content,
            context: narrative[breakthroughKey].context,
            timestamp: Date.now(),
            priority: 'high',
            category: 'breakthrough'
          });
        }
      });
    }

    // 12. Training Strategy Hints
    const totalRevenue = gameState.revenue.b2b + gameState.revenue.b2c + gameState.revenue.investors;
    if (gameState.training.active && totalRevenue > 50000) {
      onShowMessage({
        id: 'training-strategy-hint',
        title: narrative.TRAINING_STRATEGY_HINT.title,
        content: narrative.TRAINING_STRATEGY_HINT.content,
        context: narrative.TRAINING_STRATEGY_HINT.context,
        timestamp: Date.now(),
        priority: 'normal',
        category: 'advice'
      });
    }

    // 13. STUCK DETECTION - Contextual guidance when players appear stuck (with cooldown)
    
    const now = Date.now();
    const stuckHintCooldown = 120000; // 2 minutes between stuck hints
    const canShowStuckHint = now - gameState.narrativeFlags.lastStuckHintAt > stuckHintCooldown;

    if (canShowStuckHint) {
      // Priority order: training-blocked > no-money > no-revenue > no-breakthroughs
      
      // 1. Unable to start training due to prerequisites (highest priority)
      const canStartTraining = checkTrainingPrerequisites(gameState);
      if (!canStartTraining && !gameState.training.active && 
          gameState.intelligence > 150 && !gameState.narrativeFlags.hasSeenStuckTrainingBlocked) {
        gameState.narrativeFlags.hasSeenStuckTrainingBlocked = true;
        gameState.narrativeFlags.lastStuckHintAt = now;
        gameState.narrativeFlags.lastStuckHintId = 'stuck-training-blocked';
        onShowMessage({
          id: 'stuck-training-blocked',
          title: narrative.STUCK_TRAINING_BLOCKED_HINT.title,
          content: narrative.STUCK_TRAINING_BLOCKED_HINT.content,
          context: narrative.STUCK_TRAINING_BLOCKED_HINT.context,
          timestamp: now,
          priority: 'high',
          category: 'advice',
          speaker: 'spark'
        });
      }
      // 2. Stuck with no money and no revenue streams (check for actual revenue vs. enablement)
      else if (gameState.money < 500 && totalRevenue === 0 && 
               !gameState.narrativeFlags.hasSeenStuckNoMoney) {
        gameState.narrativeFlags.hasSeenStuckNoMoney = true;
        gameState.narrativeFlags.lastStuckHintAt = now;
        gameState.narrativeFlags.lastStuckHintId = 'stuck-no-money';
        onShowMessage({
          id: 'stuck-no-money',
          title: narrative.STUCK_NO_MONEY_HINT.title,
          content: narrative.STUCK_NO_MONEY_HINT.content,
          context: narrative.STUCK_NO_MONEY_HINT.context,
          timestamp: now,
          priority: 'high',
          category: 'advice',
          speaker: 'spark'
        });
      }
      // 3. High intelligence but no revenue generation
      else if (gameState.intelligence > 500 && totalRevenue === 0 && 
               !gameState.narrativeFlags.hasSeenStuckNoRevenue) {
        gameState.narrativeFlags.hasSeenStuckNoRevenue = true;
        gameState.narrativeFlags.lastStuckHintAt = now;
        gameState.narrativeFlags.lastStuckHintId = 'stuck-no-revenue';
        onShowMessage({
          id: 'stuck-no-revenue',
          title: narrative.STUCK_NO_REVENUE_HINT.title,
          content: narrative.STUCK_NO_REVENUE_HINT.content,
          context: narrative.STUCK_NO_REVENUE_HINT.context,
          timestamp: now,
          priority: 'high',
          category: 'advice',
          speaker: 'spark'
        });
      }
      // 4. Long periods without breakthrough progress (lowest priority, with time gate)
      else if (gameState.intelligence > 200 && gameState.breakthroughs.filter(b => b.unlocked).length === 0 && 
               gameState.daysElapsed > 5 && !gameState.narrativeFlags.hasSeenStuckNoBreakthroughs) {
        gameState.narrativeFlags.hasSeenStuckNoBreakthroughs = true;
        gameState.narrativeFlags.lastStuckHintAt = now;
        gameState.narrativeFlags.lastStuckHintId = 'stuck-no-breakthroughs';
        onShowMessage({
          id: 'stuck-no-breakthroughs',
          title: narrative.STUCK_NO_BREAKTHROUGHS_HINT.title,
          content: narrative.STUCK_NO_BREAKTHROUGHS_HINT.content,
          context: narrative.STUCK_NO_BREAKTHROUGHS_HINT.context,
          timestamp: now,
          priority: 'high',
          category: 'advice',
          speaker: 'spark'
        });
      }
    }

    previousStateRef.current = gameState;
  }, [gameState, onShowMessage]);
}



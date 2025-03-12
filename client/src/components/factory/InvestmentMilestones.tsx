import React from 'react';
import { Progress } from "../ui/progress";
import { Era, GameStateType, InvestmentMilestone } from '../../lib/gameState';
import { ResourceTooltip } from '../ui/educational-tooltip';
import { formatCurrency } from '../../lib/utils';

interface InvestmentMilestonesProps {
  gameState: GameStateType;
}

export default function InvestmentMilestones({ gameState }: InvestmentMilestonesProps) {
  const { investmentMilestones, intelligence, nextMilestoneId } = gameState;

  // Get the next milestone
  const nextMilestone = investmentMilestones.find(m => m.id === nextMilestoneId);
  
  // Calculate progress percentage to next milestone
  const calculateProgress = () => {
    if (!nextMilestone) return 100; // All milestones complete
    
    const previousMilestone = investmentMilestones.find(m => m.id === nextMilestoneId - 1);
    const previousThreshold = previousMilestone ? previousMilestone.requiredIntelligence : 0;
    
    // Calculate progress between previous milestone and next milestone
    const totalRange = nextMilestone.requiredIntelligence - previousThreshold;
    const currentProgress = intelligence - previousThreshold;
    
    return Math.min(Math.max((currentProgress / totalRange) * 100, 0), 100);
  };

  const getEraColor = (era: Era): string => {
    switch (era) {
      case Era.GNT2: return 'text-blue-300';
      case Era.GNT3: return 'text-green-300';
      case Era.GNT4: return 'text-amber-300';
      case Era.GNT5: return 'text-purple-300';
      case Era.GNT6: return 'text-red-300';
      case Era.GNT7: return 'text-emerald-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Investment Rounds</h3>
        <span className="text-sm text-gray-300">
          Intelligence: <span className="text-amber-300 font-medium">{intelligence.toFixed(1)}</span>
        </span>
      </div>
      
      {nextMilestone ? (
        <>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="font-medium">Progress to {nextMilestone.name}</span>
              <span className={`${getEraColor(nextMilestone.era)}`}>
                {intelligence.toFixed(1)} / {nextMilestone.requiredIntelligence}
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          
          <div className="bg-gray-800 p-3 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className={`font-medium ${getEraColor(nextMilestone.era)}`}>
                  {nextMilestone.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {nextMilestone.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-amber-300 font-medium">
                  ${formatCurrency(nextMilestone.funding)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Unlocks at {nextMilestone.requiredIntelligence} intelligence
                </div>
              </div>
            </div>
          </div>
          
          <ResourceTooltip
            content={nextMilestone.realWorldParallel}
            resourceType="intelligence"
          >
            <button className="text-xs text-amber-300 hover:underline w-full text-center">
              Why does this matter?
            </button>
          </ResourceTooltip>
        </>
      ) : (
        <div className="text-center py-3 text-gray-400">
          All investment rounds completed!
        </div>
      )}

      {/* Recently Completed Milestones */}
      {investmentMilestones.filter(m => m.unlocked).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Completed Rounds</h4>
          <div className="space-y-2">
            {investmentMilestones
              .filter(m => m.unlocked)
              .slice(-2) // Show only the last two completed milestones
              .map((milestone) => (
                <div key={milestone.id} className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full bg-amber-400 mr-2`}></div>
                    <span className={`${getEraColor(milestone.era)}`}>{milestone.name}</span>
                  </div>
                  <span className="text-amber-300">${formatCurrency(milestone.funding)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
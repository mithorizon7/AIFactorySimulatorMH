import { Era, GameStateType, InvestmentMilestone } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";

interface InvestmentMilestonesProps {
  gameState: GameStateType;
}

export default function InvestmentMilestones({ gameState }: InvestmentMilestonesProps) {
  const { investmentMilestones, intelligence, nextMilestoneId } = gameState;
  
  // Get the next milestone
  const nextMilestone = investmentMilestones.find(milestone => milestone.id === nextMilestoneId);
  
  // Calculate progress to next milestone if there is one
  const progress = nextMilestone 
    ? Math.min(100, (intelligence / nextMilestone.requiredIntelligence) * 100) 
    : 100;

  const getEraColor = (era: Era): string => {
    switch (era) {
      case Era.GNT2: return "text-blue-400";
      case Era.GNT3: return "text-green-400";
      case Era.GNT4: return "text-purple-400";
      case Era.GNT5: return "text-amber-400";
      case Era.GNT6: return "text-red-400";
      case Era.GNT7: return "text-cyan-400";
      default: return "text-gray-400";
    }
  };

  const getBadgeVariant = (unlocked: boolean): "default" | "outline" | "secondary" | "destructive" => {
    return unlocked ? "default" : "secondary";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        Investment Milestones
        <ResourceTooltip 
          content="As your AI advances, you'll attract more investment. Each funding round provides a significant cash injection." 
          resourceColor="amber-400"
        >
          <span className="ml-1 text-xs text-amber-300 underline cursor-help">ⓘ</span>
        </ResourceTooltip>
      </h2>
      
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm">Progress to {nextMilestone.name}</div>
            <div className="text-sm">{Math.round(progress)}%</div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-amber-300 mt-1">
            Intelligence: {Math.round(intelligence)} / {nextMilestone.requiredIntelligence} required
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {investmentMilestones.map((milestone) => (
          <div key={milestone.id} className="flex justify-between items-center p-2 rounded bg-gray-700">
            <div>
              <div className="flex items-center mb-1">
                <Badge variant={getBadgeVariant(milestone.unlocked)} className="mr-2">
                  {milestone.name}
                </Badge>
                <span className={`text-xs ${getEraColor(milestone.era)}`}>
                  {milestone.era}
                </span>
              </div>
              <div className="text-xs text-gray-400">{milestone.description}</div>
            </div>
            <div className={`font-bold ${milestone.unlocked ? 'text-green-400' : 'text-gray-500'}`}>
              ${formatCurrency(milestone.funding)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
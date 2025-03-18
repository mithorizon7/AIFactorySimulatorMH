import { GameStateType } from "@/lib/gameState";

interface BreakthroughSectionProps {
  gameState: GameStateType;
}

export default function BreakthroughSection({ gameState }: BreakthroughSectionProps) {
  const { breakthroughs, currentGoal } = gameState;
  
  const getCurrentBreakthrough = () => {
    return breakthroughs.find(b => b.id === currentGoal.id);
  };
  
  const calculateGoalProgress = () => {
    const currentBreakthrough = getCurrentBreakthrough();
    if (!currentBreakthrough) return 0;
    
    let progress = 0;
    let totalRequirements = 0;
    
    for (const [resource, level] of Object.entries(currentBreakthrough.requiredLevels)) {
      totalRequirements++;
      const currentLevel = gameState.levels[resource as keyof typeof gameState.levels];
      
      if (currentLevel >= level) {
        progress += 1;
      } else {
        // Partial progress
        const progressToNextLevel = Math.min(1, (currentLevel / level));
        progress += progressToNextLevel;
      }
    }
    
    return Math.min(Math.round((progress / totalRequirements) * 100), 100);
  };
  
  const getBreakthroughTypeColor = (type: string) => {
    switch (type) {
      case 'compute': return 'border-[#3B82F6] text-[#3B82F6]';
      case 'data': return 'border-[#10B981] text-[#10B981]';
      case 'algorithm': return 'border-[#8B5CF6] text-[#8B5CF6]';
      case 'combined': return 'border-yellow-500 text-yellow-500';
      default: return 'border-gray-400 text-gray-400';
    }
  };
  
  const getRequirementBadges = (breakthrough: any) => {
    return Object.entries(breakthrough.requiredLevels).map(([resource, level]) => {
      let color;
      switch (resource) {
        case 'compute': color = 'bg-[#3B82F6]'; break;
        case 'data': color = 'bg-[#10B981]'; break;
        case 'algorithm': color = 'bg-[#8B5CF6]'; break;
        default: color = 'bg-gray-500';
      }
      
      return (
        <span key={resource} className={`${color} text-white px-2 py-1 rounded-full`}>
          {`${resource.charAt(0).toUpperCase()}${resource.slice(1)} Level ${level}`}
        </span>
      );
    });
  };
  
  const currentBreakthrough = getCurrentBreakthrough();
  const goalProgress = calculateGoalProgress();
  
  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">AI Breakthroughs</h2>
      
      {/* Current Goal */}
      {currentBreakthrough && (
        <div className="bg-gray-700 rounded-lg p-4 mb-5">
          <h3 className="text-lg font-medium mb-2">Current Goal</h3>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">Achieve {currentBreakthrough.name}</span>
            </div>
            <p className="text-sm text-gray-300">{currentBreakthrough.description}</p>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress:</span>
                <span>{goalProgress}%</span>
              </div>
              <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-400 h-full" style={{ width: `${goalProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Breakthrough History */}
      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {breakthroughs.map(breakthrough => (
          <div 
            key={breakthrough.id}
            className={`breakthrough bg-gray-700 rounded-lg p-4 mb-3 ${
              breakthrough.unlocked 
                ? `border-l-4 ${getBreakthroughTypeColor(breakthrough.type).split(' ')[0]}` 
                : 'opacity-50'
            }`}
          >
            <div className="flex items-center mb-2">
              {breakthrough.unlocked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${getBreakthroughTypeColor(breakthrough.type).split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              <h4 className={`text-base font-medium ${breakthrough.unlocked ? '' : 'text-gray-400'}`}>
                {breakthrough.name}
              </h4>
            </div>
            
            {breakthrough.unlocked ? (
              <>
                <p className="text-sm text-gray-300 ml-7">{breakthrough.description}</p>
                <div className="ml-7 mt-2 bg-gray-600 rounded p-2 text-xs text-gray-300">
                  <span className={`font-medium ${getBreakthroughTypeColor(breakthrough.type).split(' ')[1]}`}>
                    🔍 Real World Parallel:
                  </span> {breakthrough.realWorldParallel}
                </div>
                <div className="ml-7 mt-2 text-xs flex gap-2">
                  {getRequirementBadges(breakthrough)}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 ml-7">
                Unlock this breakthrough by advancing your AI's capabilities.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

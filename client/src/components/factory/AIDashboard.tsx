import { GameStateType } from "@/lib/gameState";

interface AIDashboardProps {
  gameState: GameStateType;
}

export default function AIDashboard({
  gameState,
}: AIDashboardProps) {
  const { intelligence, levels, resources, investCosts, agiThreshold } = gameState;

  const getAIStatus = () => {
    // Calculate status based on percentage progress to AGI
    const progressPercent = (intelligence / agiThreshold) * 100;
    
    if (progressPercent < 20) return "Basic AI";
    if (progressPercent < 50) return "Intermediate AI";
    if (progressPercent < 80) return "Advanced AI";
    if (progressPercent < 100) return "Cutting-Edge AI";
    return "Artificial General Intelligence";
  };

  const getComputeProgress = () => {
    if (levels.compute >= 5) return 100;
    const levelProgress = ((levels.compute - 1) * 20);
    const currentProgress = (resources.compute / investCosts.compute * 20);
    return levelProgress + currentProgress;
  };

  const getDataProgress = () => {
    if (levels.data >= 5) return 100;
    const levelProgress = ((levels.data - 1) * 20);
    const currentProgress = (resources.data / investCosts.data * 20);
    return levelProgress + currentProgress;
  };

  const getAlgorithmProgress = () => {
    if (levels.algorithm >= 5) return 100;
    const levelProgress = ((levels.algorithm - 1) * 20);
    const currentProgress = (resources.algorithm / investCosts.algorithm * 20);
    return levelProgress + currentProgress;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">AI Dashboard</h2>
      
      {/* AI Intelligence Score */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5 text-center">
        <h3 className="text-lg font-medium mb-2">AI Intelligence</h3>
        <div className="text-4xl font-bold text-white mb-2">{intelligence.toFixed(2)}</div>
        <div className="flex flex-col items-center">
          <div className="px-3 py-1 bg-gray-600 rounded-full text-sm mb-2">{getAIStatus()}</div>
          
          {/* AGI Progress Bar */}
          <div className="w-full mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to AGI:</span>
              <span>{Math.min(Math.round((intelligence / agiThreshold) * 100), 100)}%</span>
            </div>
            <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-yellow-400 h-full" 
                style={{ width: `${Math.min((intelligence / agiThreshold) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Capability Levels */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Capability Levels</h3>
        
        {/* Compute Level */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2"></div>
              Compute Power
            </span>
            <span>Level <span>{levels.compute}</span></span>
          </div>
          <div className="tooltip relative group">
            <progress 
              className="w-full [&::-webkit-progress-value]:bg-[#3B82F6] [&::-moz-progress-bar]:bg-[#3B82F6]" 
              value={getComputeProgress()} 
              max="100"
            ></progress>
            <div className="tooltip-text invisible group-hover:visible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md opacity-0 transition-opacity group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
              Compute Power represents how much processing capability your AI has. 
              Higher levels enable faster learning and more complex operations.
            </div>
          </div>
        </div>
        
        {/* Data Level */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#10B981] mr-2"></div>
              Data Quality
            </span>
            <span>Level <span>{levels.data}</span></span>
          </div>
          <div className="tooltip relative group">
            <progress 
              className="w-full [&::-webkit-progress-value]:bg-[#10B981] [&::-moz-progress-bar]:bg-[#10B981]" 
              value={getDataProgress()} 
              max="100"
            ></progress>
            <div className="tooltip-text invisible group-hover:visible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md opacity-0 transition-opacity group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
              Data Quality measures how good your training examples are. 
              Better data leads to more accurate outputs and better understanding.
            </div>
          </div>
        </div>
        
        {/* Algorithm Level */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></div>
              Algorithm Sophistication
            </span>
            <span>Level <span>{levels.algorithm}</span></span>
          </div>
          <div className="tooltip relative group">
            <progress 
              className="w-full [&::-webkit-progress-value]:bg-[#8B5CF6] [&::-moz-progress-bar]:bg-[#8B5CF6]" 
              value={getAlgorithmProgress()} 
              max="100"
            ></progress>
            <div className="tooltip-text invisible group-hover:visible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md opacity-0 transition-opacity group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
              Algorithm Sophistication represents how effectively your AI can learn. 
              Advanced algorithms help extract more value from the same data and compute resources.
            </div>
          </div>
        </div>
      </div>
      
      {/* Compute Allocation Info Panel */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Compute Allocation</h3>
        
        <div className="space-y-3">
          {/* Visualize how compute is being used */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-400">Used in API Services:</span>
              <span className="font-medium">
                {gameState.revenue.apiAvailable && gameState.revenue.apiEnabled ? 
                  Math.round((gameState.computeCapacity.customerUsage || 0) / gameState.computeCapacity.maxCapacity * 100) + "%" 
                  : "0%"}
              </span>
            </div>
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-amber-400">Reserved for Training:</span>
              <span className="font-medium">
                {gameState.training.active ? 
                  Math.round(gameState.training.computeReserved / gameState.computeCapacity.maxCapacity * 100) + "%" 
                  : "0%"}
              </span>
            </div>
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-green-400">Available for Research:</span>
              <span className="font-medium">
                {Math.round((gameState.computeCapacity.freeCompute || 0) / gameState.computeCapacity.maxCapacity * 100) + "%"}
              </span>
            </div>
            
            {/* Progress bar showing allocation */}
            <div className="h-4 w-full bg-gray-700 rounded-full overflow-hidden flex mt-3">
              {/* Customer usage portion */}
              <div 
                className="bg-blue-500 h-full" 
                style={{ 
                  width: `${Math.round((gameState.computeCapacity.customerUsage || 0) / gameState.computeCapacity.maxCapacity * 100)}%` 
                }}
              ></div>
              
              {/* Training portion */}
              <div 
                className="bg-amber-500 h-full" 
                style={{ 
                  width: `${Math.round(gameState.training.active ? 
                    (gameState.training.computeReserved / gameState.computeCapacity.maxCapacity * 100) : 0)}%` 
                }}
              ></div>
              
              {/* Research portion (free compute) */}
              <div 
                className="bg-green-500 h-full" 
                style={{ 
                  width: `${Math.round((gameState.computeCapacity.freeCompute || 0) / gameState.computeCapacity.maxCapacity * 100)}%` 
                }}
              ></div>
            </div>
            
            <div className="mt-3 text-xs text-gray-400">
              Free compute automatically contributes to algorithm research progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

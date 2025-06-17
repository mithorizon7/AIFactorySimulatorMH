import { GameStateType } from "@/lib/gameState";

interface AIDashboardProps {
  gameState: GameStateType;
}

export default function AIDashboard({
  gameState,
}: AIDashboardProps) {
  const { intelligence, levels, resources, agiThreshold } = gameState;

  const getAIStatus = () => {
    // Calculate status based on percentage progress to AGI
    const progressPercent = (intelligence / agiThreshold) * 100;
    
    if (progressPercent < 20) return "Basic AI";
    if (progressPercent < 50) return "Intermediate AI";
    if (progressPercent < 80) return "Advanced AI";
    if (progressPercent < 100) return "Cutting-Edge AI";
    return "Artificial General Intelligence";
  };



  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">System Overview</h2>

      
      {/* Strategic Intelligence Overview */}
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3">Current AI Status</h3>
        <div className="text-center">
          <div className="px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-lg">
            <div className="text-2xl font-bold text-amber-400 mb-1">{getAIStatus()}</div>
            <div className="text-sm text-gray-300">Intelligence Level: {intelligence.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Compute Resource Management */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Compute Resource Management</h3>
        
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-sm text-gray-300 mb-3">
              Total Capacity: <span className="font-medium text-white">{gameState.computeCapacity.maxCapacity.toLocaleString()}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">Customer Services:</span>
                <span className="font-medium">
                  {gameState.revenue.apiAvailable && gameState.revenue.apiEnabled ? 
                    Math.round((gameState.computeCapacity.customerUsage || 0) / gameState.computeCapacity.maxCapacity * 100) + "%" 
                    : "0%"}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-amber-400">Training Reserved:</span>
                <span className="font-medium">
                  {gameState.training.active ? 
                    Math.round(gameState.training.computeReserved / gameState.computeCapacity.maxCapacity * 100) + "%" 
                    : "0%"}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Research Available:</span>
                <span className="font-medium">
                  {Math.round((gameState.computeCapacity.freeCompute || 0) / gameState.computeCapacity.maxCapacity * 100) + "%"}
                </span>
              </div>
            </div>
            
            {/* Visual allocation bar */}
            <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden flex mt-3">
              <div 
                className="bg-blue-500 h-full" 
                style={{ 
                  width: `${Math.round((gameState.computeCapacity.customerUsage || 0) / gameState.computeCapacity.maxCapacity * 100)}%` 
                }}
              ></div>
              <div 
                className="bg-amber-500 h-full" 
                style={{ 
                  width: `${Math.round(gameState.training.active ? 
                    (gameState.training.computeReserved / gameState.computeCapacity.maxCapacity * 100) : 0)}%` 
                }}
              ></div>
              <div 
                className="bg-green-500 h-full" 
                style={{ 
                  width: `${Math.round((gameState.computeCapacity.freeCompute || 0) / gameState.computeCapacity.maxCapacity * 100)}%` 
                }}
              ></div>
            </div>
            
            <div className="mt-2 text-xs text-gray-400">
              Research compute automatically accelerates algorithm development
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

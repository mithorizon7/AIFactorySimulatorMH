import { GameStateType } from "@/lib/gameState";

interface AIDashboardProps {
  gameState: GameStateType;
  investInCompute: () => void;
  investInData: () => void;
  investInAlgorithm: () => void;
}

export default function AIDashboard({
  gameState,
  investInCompute,
  investInData,
  investInAlgorithm,
}: AIDashboardProps) {
  const { smartnessScore, levels, resources, investCosts } = gameState;

  const getAIStatus = () => {
    if (smartnessScore < 200) return "Basic AI";
    if (smartnessScore < 500) return "Intermediate AI";
    if (smartnessScore < 800) return "Advanced AI";
    return "Cutting-Edge AI";
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
      
      {/* AI Smartness Score */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5 text-center">
        <h3 className="text-lg font-medium mb-2">AI Smartness</h3>
        <div className="text-4xl font-bold text-white mb-2">{smartnessScore}</div>
        <div className="flex justify-center">
          <div className="px-3 py-1 bg-gray-600 rounded-full text-sm">{getAIStatus()}</div>
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
      
      {/* AI Investment Actions */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Improve AI Capabilities</h3>
        
        <div className="grid grid-cols-1 gap-2">
          {/* Invest in Compute */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              resources.compute >= investCosts.compute
                ? "bg-gray-600 hover:bg-[#3B82F6] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={investInCompute}
            disabled={resources.compute < investCosts.compute}
          >
            <span className="text-sm">Enhance Processing Power</span>
            <span className="flex items-center text-xs">
              <span className="flex text-[#3B82F6] mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{investCosts.compute}</span>
              </span>
            </span>
          </button>
          
          {/* Invest in Data */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              resources.data >= investCosts.data
                ? "bg-gray-600 hover:bg-[#10B981] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={investInData}
            disabled={resources.data < investCosts.data}
          >
            <span className="text-sm">Improve Learning Examples</span>
            <span className="flex items-center text-xs">
              <span className="flex text-[#10B981] mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span>{investCosts.data}</span>
              </span>
            </span>
          </button>
          
          {/* Invest in Algorithms */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              resources.algorithm >= investCosts.algorithm
                ? "bg-gray-600 hover:bg-[#8B5CF6] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={investInAlgorithm}
            disabled={resources.algorithm < investCosts.algorithm}
          >
            <span className="text-sm">Research Better Methods</span>
            <span className="flex items-center text-xs">
              <span className="flex text-[#8B5CF6] mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>{investCosts.algorithm}</span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

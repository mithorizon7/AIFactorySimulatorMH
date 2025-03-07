import { GameStateType } from "@/lib/gameState";

interface FactorySectionProps {
  gameState: GameStateType;
  upgradeCompute: () => void;
  upgradeData: () => void;
  upgradeAlgorithm: () => void;
}

export default function FactorySection({
  gameState,
  upgradeCompute,
  upgradeData,
  upgradeAlgorithm,
}: FactorySectionProps) {
  const { resources, production, upgradeCosts } = gameState;

  const getComputeBarWidth = () => {
    return Math.min((production.compute / 10) * 100, 100) + "%";
  };

  const getDataBarWidth = () => {
    return Math.min((production.data / 10) * 100, 100) + "%";
  };

  const getAlgorithmBarWidth = () => {
    return Math.min((production.algorithm / 5) * 100, 100) + "%";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">Resource Factories</h2>
      
      {/* Compute Factory */}
      <div className="resource-card bg-gray-700 rounded-lg p-4 mb-4 border-l-4 border-[#3B82F6]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Compute Factory
          </h3>
          <span className="text-[#3B82F6] font-bold">{Math.floor(resources.compute)}</span>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Production Rate:</span>
            <span className="text-[#3B82F6]">{production.compute.toFixed(1)}/s</span>
          </div>
          <div className="tooltip relative">
            <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
              <div className="bg-[#3B82F6] h-full" style={{ width: getComputeBarWidth() }}></div>
            </div>
            <div className="tooltip-text invisible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md bottom-full left-1/2 transform -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:visible mb-2">
              Compute resources represent the processing power available to your AI. More compute means faster training and more complex capabilities.
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <button 
            className={`w-full py-2 px-4 rounded flex justify-between items-center transition ${
              resources.compute >= upgradeCosts.compute
                ? "bg-gray-600 hover:bg-[#3B82F6] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={upgradeCompute}
            disabled={resources.compute < upgradeCosts.compute}
          >
            <span className="text-sm">Upgrade GPUs</span>
            <span className="text-xs bg-gray-800 py-1 px-2 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{upgradeCosts.compute}</span>
            </span>
          </button>
        </div>
      </div>
      
      {/* Data Factory */}
      <div className="resource-card bg-gray-700 rounded-lg p-4 mb-4 border-l-4 border-[#10B981]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            Data Factory
          </h3>
          <span className="text-[#10B981] font-bold">{Math.floor(resources.data)}</span>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Collection Rate:</span>
            <span className="text-[#10B981]">{production.data.toFixed(1)}/s</span>
          </div>
          <div className="tooltip relative">
            <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10B981] h-full" style={{ width: getDataBarWidth() }}></div>
            </div>
            <div className="tooltip-text invisible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md bottom-full left-1/2 transform -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:visible mb-2">
              Data resources represent examples your AI learns from. Better data means better understanding and more accurate outputs.
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <button 
            className={`w-full py-2 px-4 rounded flex justify-between items-center transition ${
              resources.data >= upgradeCosts.data
                ? "bg-gray-600 hover:bg-[#10B981] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={upgradeData}
            disabled={resources.data < upgradeCosts.data}
          >
            <span className="text-sm">Improve Data Quality</span>
            <span className="text-xs bg-gray-800 py-1 px-2 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{upgradeCosts.data}</span>
            </span>
          </button>
        </div>
      </div>
      
      {/* Algorithm Lab */}
      <div className="resource-card bg-gray-700 rounded-lg p-4 border-l-4 border-[#8B5CF6]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Algorithm Lab
          </h3>
          <span className="text-[#8B5CF6] font-bold">{Math.floor(resources.algorithm)}</span>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Research Rate:</span>
            <span className="text-[#8B5CF6]">{production.algorithm.toFixed(1)}/s</span>
          </div>
          <div className="tooltip relative">
            <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
              <div className="bg-[#8B5CF6] h-full" style={{ width: getAlgorithmBarWidth() }}></div>
            </div>
            <div className="tooltip-text invisible absolute z-10 w-64 bg-gray-800 text-white text-center p-2 rounded-md bottom-full left-1/2 transform -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-hover:visible mb-2">
              Algorithm resources represent better ways to teach your AI. Improved algorithms help the AI learn more efficiently from the same data.
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <button 
            className={`w-full py-2 px-4 rounded flex justify-between items-center transition ${
              resources.algorithm >= upgradeCosts.algorithm
                ? "bg-gray-600 hover:bg-[#8B5CF6] text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={upgradeAlgorithm}
            disabled={resources.algorithm < upgradeCosts.algorithm}
          >
            <span className="text-sm">Enhance Training Methods</span>
            <span className="text-xs bg-gray-800 py-1 px-2 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{upgradeCosts.algorithm}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

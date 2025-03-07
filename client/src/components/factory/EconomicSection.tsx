import { GameStateType } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";

interface EconomicSectionProps {
  gameState: GameStateType;
  allocateMoneyToCompute: () => void;
  allocateMoneyToData: () => void;
  allocateMoneyToAlgorithm: () => void;
}

export default function EconomicSection({
  gameState,
  allocateMoneyToCompute,
  allocateMoneyToData,
  allocateMoneyToAlgorithm,
}: EconomicSectionProps) {
  const { money, revenue } = gameState;

  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">Financial Dashboard</h2>
      
      {/* Total Money */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Available Funds
          </h3>
          <span className="text-2xl font-bold text-green-400">${formatCurrency(money)}</span>
        </div>
      </div>
      
      {/* Revenue Streams */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Revenue Streams</h3>
        
        <div className="space-y-3">
          {/* B2B Revenue */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
              <span>API Services (B2B)</span>
            </div>
            <span className="text-blue-400">${formatCurrency(revenue.b2b)}/tick</span>
          </div>
          
          {/* B2C Revenue */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
              <span>Subscriptions (B2C)</span>
            </div>
            <span className="text-purple-400">${formatCurrency(revenue.b2c)}/tick</span>
          </div>
          
          {/* Investor Funding */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-amber-400 mr-2"></div>
              <span>Investor Funding</span>
            </div>
            <span className="text-amber-400">${formatCurrency(revenue.investors)} total</span>
          </div>
        </div>
      </div>
      
      {/* Money Allocation */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Allocate Resources</h3>
        <p className="text-sm text-gray-400 mb-3">
          Invest money to improve your AI capabilities
        </p>
        
        <div className="grid grid-cols-1 gap-2">
          {/* Allocate to Compute */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              money >= 100
                ? "bg-gray-600 hover:bg-blue-600 text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={allocateMoneyToCompute}
            disabled={money < 100}
          >
            <span className="text-sm">Upgrade Computing Infrastructure</span>
            <span className="bg-gray-700 text-blue-400 px-2 py-1 rounded text-xs">$100</span>
          </button>
          
          {/* Allocate to Data */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              money >= 75
                ? "bg-gray-600 hover:bg-green-600 text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={allocateMoneyToData}
            disabled={money < 75}
          >
            <span className="text-sm">Enhance Data Quality</span>
            <span className="bg-gray-700 text-green-400 px-2 py-1 rounded text-xs">$75</span>
          </button>
          
          {/* Allocate to Algorithm */}
          <button 
            className={`py-2 px-4 rounded flex justify-between items-center transition ${
              money >= 125
                ? "bg-gray-600 hover:bg-purple-600 text-white"
                : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={allocateMoneyToAlgorithm}
            disabled={money < 125}
          >
            <span className="text-sm">Research Algorithm Breakthroughs</span>
            <span className="bg-gray-700 text-purple-400 px-2 py-1 rounded text-xs">$125</span>
          </button>
        </div>
      </div>
    </div>
  );
}
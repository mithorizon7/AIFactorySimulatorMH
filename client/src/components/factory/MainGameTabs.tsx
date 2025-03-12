import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Database, BrainCog, BarChart3, Zap, Lightbulb, GanttChart } from "lucide-react";
import { GameStateType } from "@/lib/gameState";

// Import game components
import FactorySection from "./FactorySection";
import AIDashboard from "./AIDashboard";
import EconomicSection from "./EconomicSection";
import BreakthroughSection from "./BreakthroughSection";
import ResourceFlowVisualization from "./ResourceFlowVisualization";
import EraProgressionPanel from "./EraProgressionPanel";
import SynergyDashboard from "./SynergyDashboard";

interface MainGameTabsProps {
  gameState: GameStateType;
  upgradeCompute: () => void;
  upgradeData: () => void;
  upgradeAlgorithm: () => void;
  investInCompute: () => void;
  investInData: () => void;
  investInAlgorithm: () => void;
  allocateMoneyToCompute: () => void;
  allocateMoneyToData: () => void;
  allocateMoneyToAlgorithm: () => void;
  // Advanced inputs
  allocateMoneyToElectricity: () => void;
  allocateMoneyToHardware: () => void;
  allocateMoneyToRegulations: () => void;
  allocateMoneyToDataQuality: () => void;
  allocateMoneyToDataQuantity: () => void;
  allocateMoneyToDataFormats: () => void;
  allocateMoneyToAlgorithmArchitectures: () => void;
  // Revenue service functions
  toggleApiService: () => void;
  toggleChatbotService: () => void;
  setApiRate: (rate: number) => void;
  setMonthlyFee: (fee: number) => void;
  // Revenue enhancement functions
  improveDeveloperTools?: () => void;
  improveChatbot?: () => void;
  runAdvertisingCampaign?: () => void;
}

export default function MainGameTabs({
  gameState,
  upgradeCompute,
  upgradeData,
  upgradeAlgorithm,
  investInCompute,
  investInData,
  investInAlgorithm,
  allocateMoneyToCompute,
  allocateMoneyToData,
  allocateMoneyToAlgorithm,
  // Advanced allocation functions
  allocateMoneyToElectricity,
  allocateMoneyToHardware,
  allocateMoneyToRegulations,
  allocateMoneyToDataQuality,
  allocateMoneyToDataQuantity,
  allocateMoneyToDataFormats,
  allocateMoneyToAlgorithmArchitectures,
  // Revenue service functions
  toggleApiService,
  toggleChatbotService,
  setApiRate,
  setMonthlyFee,
  // Revenue enhancement functions
  improveDeveloperTools,
  improveChatbot,
  runAdvertisingCampaign
}: MainGameTabsProps) {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid grid-cols-5 mb-6">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="resources" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Resources</span>
        </TabsTrigger>
        <TabsTrigger value="economy" className="flex items-center gap-2">
          <GanttChart className="h-4 w-4" />
          <span className="hidden sm:inline">Economy</span>
        </TabsTrigger>
        <TabsTrigger value="breakthroughs" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          <span className="hidden sm:inline">Breakthroughs</span>
        </TabsTrigger>
        <TabsTrigger value="progression" className="flex items-center gap-2">
          <BrainCog className="h-4 w-4" />
          <span className="hidden sm:inline">Progression</span>
        </TabsTrigger>
      </TabsList>
      
      {/* Dashboard Tab - Overview with most important metrics */}
      <TabsContent value="dashboard" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          {/* Big Intelligence Goal Progress */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BrainCog className="text-amber-400 h-6 w-6" /> 
                AGI Progress
              </h2>
              <div className="text-amber-400 font-bold text-xl">
                {gameState.intelligence.toFixed(0)} / {gameState.agiThreshold}
              </div>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-5 mb-4">
              <div 
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (gameState.intelligence / gameState.agiThreshold) * 100)}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-blue-900/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-blue-400 font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> Compute
                  </h3>
                  <span className="text-blue-400 font-bold">Lvl {gameState.levels.compute}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">{gameState.resources.compute.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">+{gameState.production.compute.toFixed(1)}/sec</div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-green-900/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-green-400 font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" /> Data
                  </h3>
                  <span className="text-green-400 font-bold">Lvl {gameState.levels.data}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">{gameState.resources.data.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">+{gameState.production.data.toFixed(1)}/sec</div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-purple-900/50">
                <div className="flex justify-between items-center">
                  <h3 className="text-purple-400 font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Algorithm
                  </h3>
                  <span className="text-purple-400 font-bold">Lvl {gameState.levels.algorithm}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">{gameState.resources.algorithm.toFixed(0)}</div>
                <div className="text-gray-400 text-sm">+{gameState.production.algorithm.toFixed(1)}/sec</div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AIDashboard 
              gameState={gameState}
              investInCompute={investInCompute}
              investInData={investInData}
              investInAlgorithm={investInAlgorithm}
            />
            
            <SynergyDashboard gameState={gameState} />
          </div>
          
          {/* Resource Flow Visualization - Moved to bottom */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-amber-400" />
              Resource Flow Visualization
            </h3>
            <ResourceFlowVisualization gameState={gameState} />
          </div>
        </div>
      </TabsContent>
      
      {/* Resources Tab - Detailed resource management */}
      <TabsContent value="resources" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          <FactorySection 
            gameState={gameState}
            upgradeCompute={upgradeCompute}
            upgradeData={upgradeData}
            upgradeAlgorithm={upgradeAlgorithm}
            allocateMoneyToCompute={allocateMoneyToCompute}
            allocateMoneyToElectricity={allocateMoneyToElectricity}
            allocateMoneyToHardware={allocateMoneyToHardware}
            allocateMoneyToRegulations={allocateMoneyToRegulations}
            allocateMoneyToDataQuality={allocateMoneyToDataQuality}
            allocateMoneyToDataQuantity={allocateMoneyToDataQuantity}
            allocateMoneyToDataFormats={allocateMoneyToDataFormats}
            allocateMoneyToAlgorithmArchitectures={allocateMoneyToAlgorithmArchitectures}
          />
        </div>
      </TabsContent>
      
      {/* Economy Tab */}
      <TabsContent value="economy" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          <EconomicSection 
            gameState={gameState}
            allocateMoneyToCompute={allocateMoneyToCompute}
            allocateMoneyToData={allocateMoneyToData}
            allocateMoneyToAlgorithm={allocateMoneyToAlgorithm}
            toggleApiService={function() { if (toggleApiService) toggleApiService(); }}
            toggleChatbotService={function() { if (toggleChatbotService) toggleChatbotService(); }}
            setApiRate={function(rate: number) { if (setApiRate) setApiRate(rate); }}
            setMonthlyFee={function(fee: number) { if (setMonthlyFee) setMonthlyFee(fee); }}
            improveDeveloperTools={improveDeveloperTools}
            improveChatbot={improveChatbot}
            runAdvertisingCampaign={runAdvertisingCampaign}
          />
        </div>
      </TabsContent>
      
      {/* Breakthroughs Tab */}
      <TabsContent value="breakthroughs" className="mt-0">
        <div className="space-y-6">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">AI Breakthroughs</h2>
            <p className="text-gray-300 mb-4">
              Breakthroughs represent significant advancements in AI development. They unlock
              automatically when you reach certain resource levels, reflecting real-world AI milestones.
            </p>
          </div>
          
          <BreakthroughSection gameState={gameState} />
        </div>
      </TabsContent>
      
      {/* Progression Tab */}
      <TabsContent value="progression" className="mt-0">
        <div className="space-y-6">
          <EraProgressionPanel gameState={gameState} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Database, BrainCog, BarChart3, Zap, Lightbulb, GanttChart, NetworkIcon } from "lucide-react";
import { GameStateType } from "@/lib/gameState";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { resourceDefinitions } from "@/lib/educationalContent";

// Import game components
import FactorySection from "./FactorySection";
import EconomicSection from "./EconomicSection";
import BreakthroughSection from "./BreakthroughSection";
import ResourceFlowVisualization from "./ResourceFlowVisualization";
import EraProgressionPanel from "./EraProgressionPanel";
import SynergyDashboard from "./SynergyDashboard";
import SystemStatusPanel from "./SystemStatusPanel";
import ComputePanel from "./ComputePanel";

interface MainGameTabsProps {
  gameState: GameStateType;
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
  hireResearchEngineer: () => void;
  // Revenue service functions
  toggleApiService: () => void;
  toggleChatbotService: () => void;
  setApiRate: (rate: number) => void;
  setMonthlyFee: (fee: number) => void;
  // Revenue enhancement functions
  improveDeveloperTools?: () => void;
  improveChatbot?: () => void;
  runAdvertisingCampaign?: () => void;
  // Training model function
  trainModel?: () => void;
}

export default function MainGameTabs({
  gameState,
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
  hireResearchEngineer,
  // Revenue service functions
  toggleApiService,
  toggleChatbotService,
  setApiRate,
  setMonthlyFee,
  // Revenue enhancement functions
  improveDeveloperTools,
  improveChatbot,
  runAdvertisingCampaign,
  trainModel
}: MainGameTabsProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Function to handle navigation to resource tabs
  const handleNavigateToResource = (resourceType: 'compute' | 'data' | 'algorithm') => {
    setActiveTab("resources");
    // Small delay to ensure tab change completes before scrolling
    setTimeout(() => {
      const targetId = `${resourceType}-section`;
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add temporary highlight effect
        element.classList.add('ring-2', 'ring-amber-400', 'ring-opacity-50');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-amber-400', 'ring-opacity-50');
        }, 2000);
      }
    }, 100);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex justify-center mb-4">
        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-lg p-2 shadow-xl w-full border-t-2 border-b-2 border-amber-500 max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-5 w-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
              data-tutorial-id="dashboard-tab"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="resources" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
            >
              <Zap className="h-5 w-5" />
              <span className="hidden sm:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger 
              value="economy" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
            >
              <GanttChart className="h-5 w-5" />
              <span className="hidden sm:inline">Economy</span>
            </TabsTrigger>
            <TabsTrigger 
              value="breakthroughs" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
            >
              <Lightbulb className="h-5 w-5" />
              <span className="hidden sm:inline">Breakthroughs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progression" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
            >
              <BrainCog className="h-5 w-5" />
              <span className="hidden sm:inline">Progression</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      
      {/* Dashboard Tab - Overview with most important metrics */}
      <TabsContent value="dashboard" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          {/* Big Intelligence Goal Progress */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <ResourceTooltip 
                resourceType="intelligence"
                content={
                  <div className="space-y-2">
                    <p className="font-bold">Artificial General Intelligence (AGI)</p>
                    <p>
                      AGI represents AI systems that match or exceed human capabilities across virtually all cognitive tasks. 
                      Unlike narrow AI designed for specific tasks, AGI would demonstrate human-like understanding, learning, 
                      reasoning, and problem-solving across diverse domains.
                    </p>
                    <div className="mt-2 p-2 bg-amber-900/30 border border-amber-800/40 rounded-md">
                      <h5 className="text-amber-300 font-medium text-xs">Capabilities & Challenges</h5>
                      <p className="text-xs mt-1">
                        True AGI would require robust common sense, causal reasoning, transfer learning, and potentially 
                        self-improvement capabilities. Its development represents one of humanity's greatest scientific challenges.
                      </p>
                    </div>
                  </div>
                }
              >
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BrainCog className="text-amber-400 h-6 w-6" /> 
                  AGI Progress
                </h2>
              </ResourceTooltip>
              <div className="text-amber-400 font-bold text-xl">
                <AnimatedNumber value={gameState.intelligence.toFixed(0)} /> / <AnimatedNumber value={gameState.agiThreshold} />
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
                  <ResourceTooltip 
                    resourceType="compute"
                    content={
                      <div className="space-y-2">
                        <p className="font-bold">{resourceDefinitions.compute.title}</p>
                        <p>{resourceDefinitions.compute.description}</p>
                        <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/40 rounded-md">
                          <h5 className="text-blue-300 font-medium text-xs">Real World Example</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.compute.realWorldExample}</p>
                        </div>
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-800/30 rounded-md">
                          <h5 className="text-blue-300 font-medium text-xs">Industry Impact</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.compute.industryImpact}</p>
                        </div>
                      </div>
                    }
                  >
                    <h3 className="text-blue-400 font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4" /> Compute
                    </h3>
                  </ResourceTooltip>
                  <span className="text-blue-400 font-bold">Lvl {gameState.levels.compute}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">
                  <AnimatedNumber value={gameState.resources.compute.toFixed(0)} />
                </div>
                <div className="text-gray-400 text-sm">
                  +<AnimatedNumber value={gameState.production.compute.toFixed(1)} />/sec
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-green-900/50">
                <div className="flex justify-between items-center">
                  <ResourceTooltip 
                    resourceType="data"
                    content={
                      <div className="space-y-2">
                        <p className="font-bold">{resourceDefinitions.data.title}</p>
                        <p>{resourceDefinitions.data.description}</p>
                        <div className="mt-2 p-2 bg-green-900/30 border border-green-800/40 rounded-md">
                          <h5 className="text-green-300 font-medium text-xs">Real World Example</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.data.realWorldExample}</p>
                        </div>
                        <div className="mt-2 p-2 bg-green-900/20 border border-green-800/30 rounded-md">
                          <h5 className="text-green-300 font-medium text-xs">Industry Impact</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.data.industryImpact}</p>
                        </div>
                      </div>
                    }
                  >
                    <h3 className="text-green-400 font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" /> Data
                    </h3>
                  </ResourceTooltip>
                  <ResourceTooltip 
                    content="Data Level increases with Data Quality upgrades"
                    resourceType="data"
                    buttonPosition="inline"
                    side="top"
                  >
                    <span className="text-green-400 font-bold cursor-help">Lvl {gameState.levels.data}</span>
                  </ResourceTooltip>
                </div>
                <div className="mt-2 text-xl font-semibold">
                  <AnimatedNumber value={gameState.resources.data.toFixed(0)} />
                </div>
                <div className="text-gray-400 text-sm">
                  +<AnimatedNumber value={gameState.production.data.toFixed(1)} />/sec
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-purple-900/50">
                <div className="flex justify-between items-center">
                  <ResourceTooltip 
                    resourceType="algorithm"
                    content={
                      <div className="space-y-2">
                        <p className="font-bold">{resourceDefinitions.algorithm.title}</p>
                        <p>{resourceDefinitions.algorithm.description}</p>
                        <div className="mt-2 p-2 bg-purple-900/30 border border-purple-800/40 rounded-md">
                          <h5 className="text-purple-300 font-medium text-xs">Real World Example</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.algorithm.realWorldExample}</p>
                        </div>
                        <div className="mt-2 p-2 bg-purple-900/20 border border-purple-800/30 rounded-md">
                          <h5 className="text-purple-300 font-medium text-xs">Industry Impact</h5>
                          <p className="text-xs mt-1">{resourceDefinitions.algorithm.industryImpact}</p>
                        </div>
                      </div>
                    }
                  >
                    <h3 className="text-purple-400 font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" /> Algorithm
                    </h3>
                  </ResourceTooltip>
                  <span className="text-purple-400 font-bold">Lvl {gameState.levels.algorithm}</span>
                </div>
                <div className="mt-2 text-xl font-semibold">
                  <AnimatedNumber value={gameState.resources.algorithm.toFixed(0)} />
                </div>
                <div className="text-gray-400 text-sm">
                  +<AnimatedNumber value={gameState.production.algorithm.toFixed(1)} />/sec
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Training System - Moved right under AGI Progress */}
          <ComputePanel 
            gameState={gameState}
            trainModel={trainModel || (() => {})}
            onNavigateToResource={handleNavigateToResource}
          />
          
          {/* System Status Panel - Shows compute and service health */}
          <SystemStatusPanel gameState={gameState} />
          
          {/* Removed AI Dashboard */}

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
            allocateMoneyToCompute={allocateMoneyToCompute}
            allocateMoneyToElectricity={allocateMoneyToElectricity}
            allocateMoneyToHardware={allocateMoneyToHardware}
            allocateMoneyToRegulations={allocateMoneyToRegulations}
            allocateMoneyToDataQuality={allocateMoneyToDataQuality}
            allocateMoneyToDataQuantity={allocateMoneyToDataQuantity}
            allocateMoneyToDataFormats={allocateMoneyToDataFormats}
            allocateMoneyToAlgorithmArchitectures={allocateMoneyToAlgorithmArchitectures}
            hireResearchEngineer={hireResearchEngineer}
          />
          
          {/* Resource Synergies - Moved from Dashboard tab */}
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <NetworkIcon className="h-4 w-4 mr-2 text-indigo-400" />
              Resource Synergies
            </h3>
            <SynergyDashboard gameState={gameState} />
          </div>
        </div>
      </TabsContent>
      
      {/* Economy Tab */}
      <TabsContent value="economy" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          <EconomicSection 
            gameState={gameState}
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
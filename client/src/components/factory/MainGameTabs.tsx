import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Database, BrainCog, BarChart3, Zap, Lightbulb, GanttChart, NetworkIcon, Clock, Target, AlertTriangle, CheckCircle2, ArrowRight, TrendingUp } from "lucide-react";
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
import DashboardContent from "./DashboardContent";
import { TrainingTab } from "./TrainingTab";

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
  setMonthlyFee: (fee: number) => void;
  // Revenue enhancement functions
  improveDeveloperTools?: () => void;
  improveChatbot?: () => void;
  runAdvertisingCampaign?: () => void;
  // Platform development functions
  buildApiPlatform?: () => void;
  buildChatbotPlatform?: () => void;
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
  setMonthlyFee,
  // Revenue enhancement functions
  improveDeveloperTools,
  improveChatbot,
  runAdvertisingCampaign,
  // Platform development functions
  buildApiPlatform,
  buildChatbotPlatform,
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
          <TabsList className="grid grid-cols-6 w-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg">
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
              value="training" 
              className="flex items-center justify-center gap-2 font-medium py-3 px-3 rounded-md text-white
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 
                data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md
                hover:bg-gray-700 transition-all duration-200"
              data-testid="training-tab-trigger"
            >
              <Target className="h-5 w-5" />
              <span className="hidden sm:inline">Training</span>
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
      
      {/* Dashboard Tab - Clean Command Center */}
      <TabsContent value="dashboard" className="mt-0 space-y-6">
        <DashboardContent 
          gameState={gameState}
          trainModel={trainModel || (() => {})}
          setActiveTab={setActiveTab}
          handleNavigateToResource={handleNavigateToResource}
        />
      </TabsContent>
      
      {/* Training Tab - Era Advancement */}
      <TabsContent value="training" className="mt-0">
        <TrainingTab 
          gameState={gameState}
          onStartTraining={trainModel || (() => {})}
        />
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
            setMonthlyFee={function(fee: number) { if (setMonthlyFee) setMonthlyFee(fee); }}
            improveDeveloperTools={improveDeveloperTools}
            improveChatbot={improveChatbot}
            runAdvertisingCampaign={runAdvertisingCampaign}
            buildApiPlatform={buildApiPlatform}
            buildChatbotPlatform={buildChatbotPlatform}
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
import { useState } from "react";
import { GameStateType } from "@/lib/gameState";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRightIcon, NetworkIcon, BrainCircuitIcon, LightbulbIcon } from "lucide-react";

interface SynergyDashboardProps {
  gameState: GameStateType;
}

export default function SynergyDashboard({ gameState }: SynergyDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("intelligence");
  const { bonuses, intelligence, agiThreshold } = gameState;
  
  // Calculate percent progress toward AGI (intelligence threshold)
  const agiProgress = Math.min(100, Math.round((intelligence / agiThreshold) * 100));
  
  // Format bonus values as percentages with a + sign
  const formatBonus = (bonus: number) => {
    // Subtract 1 to show only the bonus percentage (e.g., 1.15 becomes +15%)
    const percentage = Math.round((bonus - 1) * 100);
    return `+${percentage}%`;
  };
  
  // Color coding for the three primary resources
  const resourceColors = {
    compute: "text-blue-400",
    data: "text-green-400",
    algorithm: "text-purple-400"
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resource Synergies</h2>
        <div className="flex items-center">
          <NetworkIcon className="h-5 w-5 mr-2 text-indigo-400" />
          <span className="text-sm text-gray-300">Effect Network</span>
        </div>
      </div>
      
      {/* AGI Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <BrainCircuitIcon className="h-5 w-5 mr-2 text-amber-400" />
            <span className="text-sm font-medium">Progress to AGI</span>
          </div>
          <span className="text-sm font-medium text-amber-400">{agiProgress}%</span>
        </div>
        <Progress value={agiProgress} className="h-2 [&>div]:bg-amber-400" />
      </div>
      
      {/* Synergy Navigation */}
      <Tabs defaultValue="intelligence" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-5">
          <TabsTrigger 
            value="intelligence" 
            className="data-[state=active]:bg-amber-600 text-xs"
          >
            Intelligence
          </TabsTrigger>
          <TabsTrigger 
            value="compute" 
            className="data-[state=active]:bg-blue-600 text-xs"
          >
            Compute
          </TabsTrigger>
          <TabsTrigger 
            value="data" 
            className="data-[state=active]:bg-green-600 text-xs"
          >
            Data
          </TabsTrigger>
          <TabsTrigger 
            value="algorithm" 
            className="data-[state=active]:bg-purple-600 text-xs"
          >
            Algorithm
          </TabsTrigger>
        </TabsList>
        
        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-amber-400">Intelligence Growth</h3>
            <p className="text-sm text-gray-300 mb-4">
              See how each resource contributes to AGI development.
            </p>
            
            {/* Compute to Intelligence */}
            <div className="bg-gray-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-blue-400 mr-2"></span>
                  <span className="text-sm">Compute</span>
                </div>
                <div className="flex items-center">
                  <ArrowUpRightIcon className="h-4 w-4 mr-1 text-blue-400" />
                  <span className="text-blue-400 font-medium text-sm">
                    {formatBonus(bonuses.computeToIntelligence)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.computeToIntelligence - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-blue-400" />
            </div>
            
            {/* Data to Intelligence */}
            <div className="bg-gray-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-sm">Data</span>
                </div>
                <div className="flex items-center">
                  <ArrowUpRightIcon className="h-4 w-4 mr-1 text-green-400" />
                  <span className="text-green-400 font-medium text-sm">
                    {formatBonus(bonuses.dataToIntelligence)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.dataToIntelligence - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-green-400" />
            </div>
            
            {/* Algorithm to Intelligence */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-purple-400 mr-2"></span>
                  <span className="text-sm">Algorithm</span>
                </div>
                <div className="flex items-center">
                  <ArrowUpRightIcon className="h-4 w-4 mr-1 text-purple-400" />
                  <span className="text-purple-400 font-medium text-sm">
                    {formatBonus(bonuses.algorithmToIntelligence)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.algorithmToIntelligence - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-purple-400" />
            </div>
          </div>
        </TabsContent>
        
        {/* Compute Tab */}
        <TabsContent value="compute" className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-blue-400">Compute Effects</h3>
            <p className="text-sm text-gray-300 mb-4">
              How compute infrastructure improves other resources.
            </p>
            
            {/* Compute to Data */}
            <div className="bg-gray-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-blue-400 mr-2"></span>
                  <span className="text-sm">Compute ➝ Data</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-400 font-medium text-sm">
                    {formatBonus(bonuses.computeToData)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.computeToData - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-blue-400" />
              <p className="text-xs text-gray-400 mt-2">
                Faster compute enables better data processing capabilities
              </p>
            </div>
            
            {/* Compute to Algorithm */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-blue-400 mr-2"></span>
                  <span className="text-sm">Compute ➝ Algorithm</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-400 font-medium text-sm">
                    {formatBonus(bonuses.computeToAlgorithm)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.computeToAlgorithm - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-blue-400" />
              <p className="text-xs text-gray-400 mt-2">
                More compute allows experimentation with larger models
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-green-400">Data Effects</h3>
            <p className="text-sm text-gray-300 mb-4">
              How data quality improves other resources.
            </p>
            
            {/* Data to Compute */}
            <div className="bg-gray-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-sm">Data ➝ Compute</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 font-medium text-sm">
                    {formatBonus(bonuses.dataToCompute)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.dataToCompute - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-green-400" />
              <p className="text-xs text-gray-400 mt-2">
                Better data helps optimize compute usage and training efficiency
              </p>
            </div>
            
            {/* Data to Algorithm */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
                  <span className="text-sm">Data ➝ Algorithm</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 font-medium text-sm">
                    {formatBonus(bonuses.dataToAlgorithm)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.dataToAlgorithm - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-green-400" />
              <p className="text-xs text-gray-400 mt-2">
                Rich, diverse data drives algorithmic innovation and testing
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Algorithm Tab */}
        <TabsContent value="algorithm" className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-3 text-purple-400">Algorithm Effects</h3>
            <p className="text-sm text-gray-300 mb-4">
              How algorithmic advances improve other resources.
            </p>
            
            {/* Algorithm to Compute */}
            <div className="bg-gray-800 p-3 rounded-lg mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-purple-400 mr-2"></span>
                  <span className="text-sm">Algorithm ➝ Compute</span>
                </div>
                <div className="flex items-center">
                  <span className="text-purple-400 font-medium text-sm">
                    {formatBonus(bonuses.algorithmToCompute)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.algorithmToCompute - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-purple-400" />
              <p className="text-xs text-gray-400 mt-2">
                Better algorithms optimize compute usage and efficiency
              </p>
            </div>
            
            {/* Algorithm to Data */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-purple-400 mr-2"></span>
                  <span className="text-sm">Algorithm ➝ Data</span>
                </div>
                <div className="flex items-center">
                  <span className="text-purple-400 font-medium text-sm">
                    {formatBonus(bonuses.algorithmToData)}
                  </span>
                </div>
              </div>
              <Progress value={Math.round((bonuses.algorithmToData - 1) * 100)} 
                className="h-1.5 bg-gray-600 [&>div]:bg-purple-400" />
              <p className="text-xs text-gray-400 mt-2">
                Advanced algorithms improve data extraction and utilization
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Synergy Overview */}
      <div className="mt-5 bg-gray-700 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <LightbulbIcon className="h-4 w-4 mr-1 text-yellow-400" />
            Synergy Insight
          </h3>
        </div>
        <p className="text-xs text-gray-300">
          {activeTab === "intelligence" && "Balanced investment across all three resources accelerates AGI development. Focus on areas with highest bonuses for optimal progress."}
          {activeTab === "compute" && "Compute investment affects your ability to process more data and run larger algorithm experiments. It's the foundation of AI infrastructure."}
          {activeTab === "data" && "Quality data drives both model performance and algorithmic discovery. Better data means more efficient compute usage."}
          {activeTab === "algorithm" && "Algorithmic breakthroughs optimize both compute usage and data utilization. They're the multipliers in your AI system."}
        </p>
      </div>
    </div>
  );
}
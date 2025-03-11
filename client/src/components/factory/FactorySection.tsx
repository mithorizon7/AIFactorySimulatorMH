import { GameStateType } from "@/lib/gameState";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";
import { resourceDefinitions } from "@/lib/educationalContent";
import { formatCurrency } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Cpu, Database, BrainCog, Zap, Server, LightbulbIcon, PlugZap, HardDrive, LayoutGrid, Scale, Boxes, Layers, Workflow } from "lucide-react";

interface FactorySectionProps {
  gameState: GameStateType;
  upgradeCompute: () => void;
  upgradeData: () => void;
  upgradeAlgorithm: () => void;
  // Advanced allocation functions
  allocateMoneyToCompute: () => void;
  allocateMoneyToElectricity: () => void;
  allocateMoneyToHardware: () => void;
  allocateMoneyToRegulations: () => void;
  allocateMoneyToDataQuality: () => void;
  allocateMoneyToDataQuantity: () => void;
  allocateMoneyToDataFormats: () => void;
  allocateMoneyToAlgorithmArchitectures: () => void;
}

export default function FactorySection({
  gameState,
  upgradeCompute,
  upgradeData,
  upgradeAlgorithm,
  allocateMoneyToCompute,
  allocateMoneyToElectricity,
  allocateMoneyToHardware,
  allocateMoneyToRegulations,
  allocateMoneyToDataQuality,
  allocateMoneyToDataQuantity,
  allocateMoneyToDataFormats,
  allocateMoneyToAlgorithmArchitectures,
}: FactorySectionProps) {
  const { resources, production, upgradeCosts, money, computeInputs, dataInputs, algorithmInputs } = gameState;

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resource Factories</h2>
        <div className="font-medium text-green-400">Available: ${formatCurrency(money)}</div>
      </div>
      
      {/* Compute Factory */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="compute" className="border-none">
          <div className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#3B82F6]">
            <div className="flex justify-between items-center mb-2">
              <ResourceTooltip 
                resourceType="compute"
                content={
                  <div className="space-y-2">
                    <p className="font-bold">{resourceDefinitions.compute.title}</p>
                    <p>{resourceDefinitions.compute.description}</p>
                    <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                      <span className="font-semibold">Real-world example:</span> {resourceDefinitions.compute.realWorldExample}
                    </p>
                  </div>
                }
              >
                <h3 className="text-lg font-medium flex items-center">
                  <Cpu className="h-5 w-5 mr-2 text-[#3B82F6]" />
                  Compute Factory
                </h3>
              </ResourceTooltip>
              <span className="text-[#3B82F6] font-bold">{Math.floor(resources.compute)}</span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Production Rate:</span>
                <span className="text-[#3B82F6]">{production.compute.toFixed(1)}/s</span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full" style={{ width: getComputeBarWidth() }}></div>
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
                  <Server className="h-4 w-4 mr-1 text-[#3B82F6]" />
                  <span>{upgradeCosts.compute}</span>
                </span>
              </button>
            </div>
          </div>
          
          <AccordionTrigger className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-blue-400 font-medium">
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Advanced Compute Options
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Direct Compute Investment */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Server className="h-4 w-4 text-blue-400" />
                    <span>Infrastructure</span>
                  </h4>
                  <div className="bg-blue-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {computeInputs.money}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Direct investment in compute infrastructure leads to more powerful hardware.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 100 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={allocateMoneyToCompute}
                  disabled={money < 100}
                >
                  <span>Invest</span>
                  <span className="font-medium">$100</span>
                </button>
              </div>
              
              {/* Electricity */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <PlugZap className="h-4 w-4 text-blue-400" />
                    <span>Power Generation</span>
                  </h4>
                  <div className="bg-blue-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {computeInputs.electricity}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Better power infrastructure enables more energy-efficient compute.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 85 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={allocateMoneyToElectricity}
                  disabled={money < 85}
                >
                  <span>Invest</span>
                  <span className="font-medium">$85</span>
                </button>
              </div>
              
              {/* Hardware */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <HardDrive className="h-4 w-4 text-blue-400" />
                    <span>Hardware Quality</span>
                  </h4>
                  <div className="bg-blue-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {computeInputs.hardware}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Advanced GPU/TPU hardware dramatically increases training capacity.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 150 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={allocateMoneyToHardware}
                  disabled={money < 150}
                >
                  <span>Invest</span>
                  <span className="font-medium">$150</span>
                </button>
              </div>
              
              {/* Regulatory Environment */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Scale className="h-4 w-4 text-blue-400" />
                    <span>Regulation Compliance</span>
                  </h4>
                  <div className="bg-blue-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {computeInputs.regulation}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Compliance investments reduce restrictions on compute usage.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 120 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={allocateMoneyToRegulations}
                  disabled={money < 120}
                >
                  <span>Invest</span>
                  <span className="font-medium">$120</span>
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Data Factory */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="data" className="border-none">
          <div className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#10B981]">
            <div className="flex justify-between items-center mb-2">
              <ResourceTooltip 
                resourceType="data"
                content={
                  <div className="space-y-2">
                    <p className="font-bold">{resourceDefinitions.data.title}</p>
                    <p>{resourceDefinitions.data.description}</p>
                    <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                      <span className="font-semibold">Real-world example:</span> {resourceDefinitions.data.realWorldExample}
                    </p>
                  </div>
                }
              >
                <h3 className="text-lg font-medium flex items-center">
                  <Database className="h-5 w-5 mr-2 text-[#10B981]" />
                  Data Factory
                </h3>
              </ResourceTooltip>
              <span className="text-[#10B981] font-bold">{Math.floor(resources.data)}</span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Collection Rate:</span>
                <span className="text-[#10B981]">{production.data.toFixed(1)}/s</span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full" style={{ width: getDataBarWidth() }}></div>
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
                  <Database className="h-4 w-4 mr-1 text-[#10B981]" />
                  <span>{upgradeCosts.data}</span>
                </span>
              </button>
            </div>
          </div>
          
          <AccordionTrigger className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-green-400 font-medium">
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Advanced Data Options
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Data Quality */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Layers className="h-4 w-4 text-green-400" />
                    <span>Data Quality</span>
                  </h4>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.quality}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Investments in data curation lead to more accurate AI models.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 75 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={allocateMoneyToDataQuality}
                  disabled={money < 75}
                >
                  <span>Invest</span>
                  <span className="font-medium">$75</span>
                </button>
              </div>
              
              {/* Data Quantity */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Boxes className="h-4 w-4 text-green-400" />
                    <span>Data Quantity</span>
                  </h4>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.quantity}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  More data through web scraping and licensing leads to better capabilities.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 60 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={allocateMoneyToDataQuantity}
                  disabled={money < 60}
                >
                  <span>Invest</span>
                  <span className="font-medium">$60</span>
                </button>
              </div>
              
              {/* Data Formats */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <LayoutGrid className="h-4 w-4 text-green-400" />
                    <span>Data Formats</span>
                  </h4>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.formats}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Investment in multimodal data unlocks new AI capabilities.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 90 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={allocateMoneyToDataFormats}
                  disabled={money < 90}
                >
                  <span>Invest</span>
                  <span className="font-medium">$90</span>
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Algorithm Lab */}
      <Accordion type="single" collapsible>
        <AccordionItem value="algorithm" className="border-none">
          <div className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#8B5CF6]">
            <div className="flex justify-between items-center mb-2">
              <ResourceTooltip 
                resourceType="algorithm"
                content={
                  <div className="space-y-2">
                    <p className="font-bold">{resourceDefinitions.algorithm.title}</p>
                    <p>{resourceDefinitions.algorithm.description}</p>
                    <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
                      <span className="font-semibold">Real-world example:</span> {resourceDefinitions.algorithm.realWorldExample}
                    </p>
                  </div>
                }
              >
                <h3 className="text-lg font-medium flex items-center">
                  <BrainCog className="h-5 w-5 mr-2 text-[#8B5CF6]" />
                  Algorithm Lab
                </h3>
              </ResourceTooltip>
              <span className="text-[#8B5CF6] font-bold">{Math.floor(resources.algorithm)}</span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Research Rate:</span>
                <span className="text-[#8B5CF6]">{production.algorithm.toFixed(1)}/s</span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#8B5CF6] h-full" style={{ width: getAlgorithmBarWidth() }}></div>
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
                  <LightbulbIcon className="h-4 w-4 mr-1 text-[#8B5CF6]" />
                  <span>{upgradeCosts.algorithm}</span>
                </span>
              </button>
            </div>
          </div>
          
          <AccordionTrigger className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-purple-400 font-medium">
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Advanced Algorithm Options
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Model Architectures */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Workflow className="h-4 w-4 text-purple-400" />
                    <span>Model Architectures</span>
                  </h4>
                  <div className="bg-purple-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {algorithmInputs.architectures}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Research into novel architectures that fundamentally change AI capabilities.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 125 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  onClick={allocateMoneyToAlgorithmArchitectures}
                  disabled={money < 125}
                >
                  <span>Invest</span>
                  <span className="font-medium">$125</span>
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

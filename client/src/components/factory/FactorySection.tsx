import { GameStateType, Era } from "@/lib/gameState";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { resourceDefinitions } from "@/lib/educationalContent";
import { formatCurrency } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Cpu, Database, BrainCog, Zap, Server, LightbulbIcon, PlugZap, HardDrive, LayoutGrid, Scale, Boxes, Layers, Workflow, GraduationCap, Info, Users, Brain, FileText, Globe, Lightbulb, PauseCircle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGamePause } from "@/contexts/GamePauseContext";
import { useEffect, useState } from "react";

interface FactorySectionProps {
  gameState: GameStateType;
  // Advanced allocation functions
  allocateMoneyToCompute: () => void;
  allocateMoneyToElectricity: () => void;
  allocateMoneyToHardware: () => void;
  allocateMoneyToRegulations: () => void;
  allocateMoneyToDataQuality: () => void;
  allocateMoneyToDataQuantity: () => void;
  allocateMoneyToDataFormats: () => void;
  allocateMoneyToAlgorithmArchitectures: () => void;
  hireResearchEngineer?: () => void;

}

// Learning Dialog Component for Advanced Options
interface LearningDialogProps {
  title: string;
  description: string;
  realWorldExample: string;
  importance: string;
  category: "compute" | "data" | "algorithm";
}

function LearningDialog({ title, description, realWorldExample, importance, category }: LearningDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Safe access to game pause context
  let gamePause;
  try {
    gamePause = useGamePause();
  } catch (error) {
    // If context is not available, provide no-op functions
    gamePause = {
      isPausedForLearning: false, 
      pauseForLearning: () => {}, 
      resumeFromLearning: () => {},
      pauseGameEngine: () => {},
      resumeGameEngine: () => {}
    };
  }
  const categoryColors = {
    compute: "text-blue-400",
    data: "text-green-400", 
    algorithm: "text-purple-400"
  };
  
  const categoryBgColors = {
    compute: "bg-blue-900/20",
    data: "bg-green-900/20",
    algorithm: "bg-purple-900/20"
  };

  // Production-safe LearningDialog color mappings
  const dialogTriggerColors = {
    compute: "bg-blue-900/30 hover:bg-blue-900/50 border-blue-500/40",
    data: "bg-green-900/30 hover:bg-green-900/50 border-green-500/40", 
    algorithm: "bg-purple-900/30 hover:bg-purple-900/50 border-purple-500/40"
  };

  const dialogContentColors = {
    compute: "bg-blue-900/20 border-blue-600/50",
    data: "bg-green-900/20 border-green-600/50",
    algorithm: "bg-purple-900/20 border-purple-600/50"
  };

  const dialogIconBgColors = {
    compute: "bg-blue-900/50",
    data: "bg-green-900/50", 
    algorithm: "bg-purple-900/50"
  };

  // Production-safe color mappings for educational panels
  const eraColorClasses = {
    foundation: {
      text: "text-green-200",
      accent: "text-amber-200",
      icon: "text-green-400"
    },
    scaling: {
      text: "text-green-200", 
      accent: "text-amber-200",
      icon: "text-green-400"
    },
    advanced: {
      text: "text-green-200",
      accent: "text-purple-200", 
      icon: "text-green-400"
    }
  };

  const algorithmColorClasses = {
    foundation: {
      text: "text-purple-200",
      accent: "text-amber-200",
      progress: "text-gray-400",
      icon: "text-purple-400"
    },
    innovation: {
      text: "text-purple-200",
      accent: "text-amber-200", 
      progress: "text-gray-400",
      icon: "text-purple-400"
    },
    agi: {
      text: "text-purple-200",
      accent: "text-cyan-200",
      progress: "text-cyan-300",
      icon: "text-purple-400"
    }
  };
  
  // Use effect to pause/resume game when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
      gamePause.pauseForLearning();
    } else {
      gamePause.resumeFromLearning();
    }
  }, [isDialogOpen]);
  
  // Handle dialog open/close events
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`text-xs px-2 py-1 h-auto ml-2 inline-flex items-center ${dialogTriggerColors[category]} rounded-md`}
        >
          <Info className={`h-3.5 w-3.5 mr-1 ${categoryColors[category]}`} />
          What is this?
        </Button>
      </DialogTrigger>
      <DialogContent className={`${dialogContentColors[category]} shadow-lg`}>
        <DialogHeader className="p-2 mb-2 bg-gray-900/50 rounded-lg border-b border-gray-700">
          <DialogTitle className={`${categoryColors[category]} flex items-center gap-2 text-xl font-bold`}>
            <div className={`p-1.5 rounded-full ${dialogIconBgColors[category]}`}>
              <Info className="h-5 w-5" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm mt-1 italic font-light ml-9">
            Learn how this works in real AI development
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2 p-4 bg-gray-800/80 rounded-lg border border-gray-700 shadow-inner">
            <h4 className={`${categoryColors[category]} font-medium flex items-center gap-2`}>
              <FileText className="h-4 w-4" />
              <span>Description</span>
            </h4>
            <div className="bg-gray-900/40 p-3 rounded-md">
              <p className="text-gray-200 text-sm leading-relaxed">{description}</p>
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-gray-800/80 rounded-lg border border-gray-700 shadow-inner">
            <h4 className={`${categoryColors[category]} font-medium flex items-center gap-2`}>
              <Globe className="h-4 w-4" />
              <span>Real World Example</span>
            </h4>
            <div className={`${category === "compute" ? "bg-blue-900/20" : category === "data" ? "bg-green-900/20" : "bg-purple-900/20"} p-3 rounded-md border-l-4 ${category === "compute" ? "border-blue-500/50" : category === "data" ? "border-green-500/50" : "border-purple-500/50"}`}>
              <p className="text-gray-200 text-sm leading-relaxed">{realWorldExample}</p>
            </div>
          </div>
          
          <div className="space-y-2 p-4 bg-gray-800/80 rounded-lg border border-gray-700 shadow-inner">
            <h4 className={`${categoryColors[category]} font-medium flex items-center gap-2`}>
              <Lightbulb className="h-4 w-4" />
              <span>Why It Matters</span>
            </h4>
            <div className="bg-gray-900/40 p-3 rounded-md">
              <p className="text-gray-200 text-sm leading-relaxed italic">{importance}</p>
            </div>
          </div>
          
          {/* Pause indicator */}
          {gamePause.isPausedForLearning && (
            <div className="mt-4 px-4 py-2 bg-yellow-900/40 border border-yellow-500/40 rounded-lg shadow-inner text-yellow-300 text-xs flex items-center">
              <div className="p-1.5 bg-yellow-500/20 rounded-full mr-2">
                <PauseCircle className="w-3 h-3" />
              </div>
              <span className="font-medium">Game timer paused while learning</span>
            </div>
          )}
        </div>
        <DialogFooter className="p-2 mt-2 bg-gray-900/50 rounded-lg border-t border-gray-700">
          <DialogClose asChild>
            <Button variant="outline" className={`${category === "compute" ? "bg-blue-900/30 hover:bg-blue-800/50 border-blue-700" : category === "data" ? "bg-green-900/30 hover:bg-green-800/50 border-green-700" : "bg-purple-900/30 hover:bg-purple-800/50 border-purple-700"} text-white`}>
              <span className="mr-2">Continue Building</span>
              <Server className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FactorySection({
  gameState,
  allocateMoneyToCompute,
  allocateMoneyToElectricity,
  allocateMoneyToHardware,
  allocateMoneyToRegulations,
  allocateMoneyToDataQuality,
  allocateMoneyToDataQuantity,
  allocateMoneyToDataFormats,
  allocateMoneyToAlgorithmArchitectures,
  hireResearchEngineer,
}: FactorySectionProps) {
  // Color class definitions moved to component scope to fix undefined variable errors
  const eraColorClasses = {
    foundation: {
      text: "text-green-200",
      accent: "text-amber-200",
      icon: "text-green-400"
    },
    scaling: {
      text: "text-green-200", 
      accent: "text-amber-200",
      icon: "text-green-400"
    },
    advanced: {
      text: "text-green-200",
      accent: "text-purple-200", 
      icon: "text-green-400"
    }
  };

  const algorithmColorClasses = {
    foundation: {
      text: "text-purple-200",
      accent: "text-amber-200",
      progress: "text-gray-400",
      icon: "text-purple-400"
    },
    innovation: {
      text: "text-purple-200",
      accent: "text-amber-200", 
      progress: "text-gray-400",
      icon: "text-purple-400"
    },
    agi: {
      text: "text-purple-200",
      accent: "text-cyan-200",
      progress: "text-cyan-300",
      icon: "text-purple-400"
    }
  };

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
        <div className="font-medium text-green-400">Available: $<AnimatedNumber value={formatCurrency(money)} /></div>
      </div>
      
      {/* Compute Factory */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="compute" className="border-none">
          <div id="compute-section" className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#3B82F6]" data-tutorial-id="compute-factory-card">
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
              <span className="text-[#3B82F6] font-bold">
                <AnimatedNumber value={Math.floor(resources.compute)} />
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Production Rate:</span>
                <span className="text-[#3B82F6]">
                  <AnimatedNumber value={production.compute.toFixed(1)} />
                  /s
                </span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#3B82F6] h-full" style={{ width: getComputeBarWidth() }}></div>
                </div>
              </div>
            </div>
            
            {/* System Status Section */}
            <div className="my-3 bg-gray-700 rounded-md p-2 border border-gray-600">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">System Status</span>
                <div className="flex items-center">
                  {gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity >= 0.95 ? (
                    <span className="text-xs text-red-400 flex items-center">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Critical
                    </span>
                  ) : gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity >= 0.9 ? (
                    <span className="text-xs text-amber-400 flex items-center">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Warning
                    </span>
                  ) : (
                    <span className="text-xs text-green-400 flex items-center">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Nominal
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-center mb-1">
                <div className="bg-gray-800 rounded p-1">
                  <div className="text-[0.65rem] text-gray-400">Available</div>
                  <div className="text-xs font-medium text-blue-400">{gameState.computeCapacity.available}</div>
                </div>
                <div className="bg-gray-800 rounded p-1">
                  <div className="text-[0.65rem] text-gray-400">Used</div>
                  <div className="text-xs font-medium text-orange-400">{gameState.computeCapacity.used}</div>
                </div>
                <div className="bg-gray-800 rounded p-1">
                  <div className="text-[0.65rem] text-gray-400">Total</div>
                  <div className="text-xs font-medium text-purple-400">{gameState.computeCapacity.maxCapacity}</div>
                </div>
              </div>
              
              {/* Usage bar */}
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity >= 0.95 
                      ? 'bg-red-500 animate-pulse' 
                      : gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity >= 0.9
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`} 
                  style={{ width: `${Math.min(100, (gameState.computeCapacity.used / gameState.computeCapacity.maxCapacity) * 100)}%` }}
                ></div>
              </div>
            </div>
            

          </div>
          
          <AccordionTrigger 
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-blue-400 font-medium border border-gray-600 hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-md data-[state=open]:border-blue-500 data-[state=open]:bg-gray-700"
          >
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Advanced Compute Options</span>
              <span className="ml-auto text-xs text-gray-500 group-hover:text-blue-400">Click to expand</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Direct Compute Investment */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Server className="h-4 w-4 text-blue-400" />
                      <span>Compute Level</span>
                    </h4>
                    <LearningDialog
                      title="Computing Infrastructure"
                      category="compute"
                      description="Computing infrastructure refers to the servers, clusters, and datacenters that provide raw computational power for AI training and inference. Increasing this resource directly improves the amount and speed of neural network operations."
                      realWorldExample="Companies like OpenAI spent an estimated $100M+ on computing infrastructure for training GPT-4, utilizing thousands of high-end GPUs/TPUs in specialized datacenters. Google's TPU v4 pods represent some of the largest AI computing clusters, with some containing over 4,000 chips."
                      importance="More computing power allows for larger models with more parameters to be trained faster. The improvements in recent large language models (LLMs) directly correlate with exponential increases in computing power—GPT-4 used approximately 10x the computing resources of GPT-3."
                    />
                  </div>
                  <div className="bg-blue-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {computeInputs.money}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Invests money to increase Compute Level for training requirements and computing capacity.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 100 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={allocateMoneyToCompute}
                  disabled={money < 100}
                  data-tutorial-id="compute-level-upgrade"
                >
                  <span>Invest in Compute Infrastructure</span>
                  <span className="font-medium">$100</span>
                </button>
              </div>
              
              {/* Electricity */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">

                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <PlugZap className="h-4 w-4 text-blue-400" />
                      <span>Power Generation</span>
                    </h4>
                    <LearningDialog
                      title="Power Generation & Efficiency"
                      category="compute"
                      description="Energy consumption is a critical factor in AI development. As models grow larger, their electricity requirements increase dramatically. Innovations in power infrastructure and efficiency directly impact AI costs and environmental footprint."
                      realWorldExample="A single training run for a large language model can consume as much electricity as 100+ U.S. homes use in a year. Companies like Microsoft and Google have invested in renewable energy plants specifically to power their AI datacenters, while others use specialized cooling systems to reduce power needs."
                      importance="Power efficiency determines not only operating costs but also the practical limits of model size. Google's TPUs, for instance, were designed to be 15-30x more energy efficient than contemporary GPUs for machine learning workloads. Sustainable AI requires continued innovation in power technology."
                    />
                  </div>
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
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">

                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <HardDrive className="h-4 w-4 text-blue-400" />
                      <span>Hardware Quality</span>
                    </h4>
                    <LearningDialog
                      title="Specialized AI Hardware"
                      category="compute"
                      description="Modern AI relies on specialized hardware accelerators designed specifically for neural network operations. These include GPUs, TPUs, and custom ASICs that dramatically outperform general-purpose CPUs for machine learning tasks."
                      realWorldExample="NVIDIA's H100 GPUs represent the current state-of-the-art in commercial AI hardware, with 80 billion transistors and specialized Tensor Cores. Google's TPU v4 chips and Meta's Research SuperCluster use custom interconnects to allow thousands of processors to work together on a single AI model."
                      importance="Hardware innovations enable entirely new classes of AI models. The shift from CPUs to GPUs enabled deep learning; the shift to specialized AI chips enabled trillion-parameter models. Hardware design decisions directly influence what architectures are practical and how efficiently they can train and operate."
                    />
                  </div>
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
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Scale className="h-4 w-4 text-blue-400" />
                      <span>Regulation Compliance</span>
                    </h4>
                    <LearningDialog
                      title="Regulatory Compliance & Ethics"
                      category="compute"
                      description="AI development operates within a complex regulatory landscape that controls how computing resources can be deployed, especially for high-risk applications. Different countries impose varying restrictions on AI development and export."
                      realWorldExample="Export controls limit which countries can access the most advanced AI chips, with regulations like ITAR in the US restricting high-end GPU exports. In the EU, the AI Act classifies systems by risk level and imposes restrictions on how computing can be used for systems deemed 'high risk'."
                      importance="Regulatory compliance affects not just where AI can be developed but how. Requirements for transparency, fairness testing, and impact assessments may add computational overhead. Companies must balance rapid development with ensuring their systems meet evolving regulatory standards."
                    />
                  </div>
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
          <div id="data-section" className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#10B981]" data-tutorial-id="data-factory-card">
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
              <span className="text-[#10B981] font-bold">
                <AnimatedNumber value={Math.floor(resources.data)} />
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Collection Rate:</span>
                <span className="text-[#10B981]">
                  <AnimatedNumber value={production.data.toFixed(1)} />
                  /s
                </span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full" style={{ width: getDataBarWidth() }}></div>
                </div>
              </div>
            </div>

            {/* Dynamic Data Factory Educational Content */}
            <div className="mt-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0">📊</div>
                <div>
                  <h5 className="text-xs font-medium text-green-300 mb-2">Data Development Focus</h5>
                  <div className="text-xs text-gray-300 space-y-2">
                    {(() => {
                      const currentEra = gameState.currentEra;
                      const dataLevel = gameState.levels.data;
                      
                      if (currentEra === Era.GNT2 || currentEra === Era.GNT3) {
                        const colors = eraColorClasses.foundation;
                        return (
                          <>
                            <div>🔍 <strong>Foundation Phase:</strong> Building basic data pipelines and establishing quality standards</div>
                            <div className={`${colors.text} italic`}>Like early AI labs collecting web scrapes and academic papers - quality matters more than quantity at this stage</div>
                            {dataLevel < 3 && (
                              <div className={colors.accent}>💡 <strong>Next Step:</strong> Focus on Data Quality improvements to establish robust collection processes</div>
                            )}
                          </>
                        );
                      } else if (currentEra === Era.GNT4 || currentEra === Era.GNT5) {
                        const colors = eraColorClasses.scaling;
                        return (
                          <>
                            <div>📈 <strong>Scaling Phase:</strong> Massively expanding data collection while maintaining high standards</div>
                            <div className={`${colors.text} italic`}>Modern AI companies process trillions of tokens - like how GPT models trained on the entire internet</div>
                            {dataLevel < 5 && (
                              <div className={colors.accent}>💡 <strong>Next Step:</strong> Balance Data Quantity scaling with Quality improvements for optimal training</div>
                            )}
                          </>
                        );
                      } else {
                        const colors = eraColorClasses.advanced;
                        return (
                          <>
                            <div>🚀 <strong>Advanced Phase:</strong> Specialized datasets and multimodal data integration for AGI capabilities</div>
                            <div className={`${colors.text} italic`}>Cutting-edge research requires diverse, high-quality datasets across text, images, code, and reasoning tasks</div>
                            <div className={colors.accent}>💡 <strong>AGI Focus:</strong> Multimodal data formats become critical for general intelligence</div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
            

          </div>
          
          <AccordionTrigger 
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-green-400 font-medium border border-gray-600 hover:border-green-500/50 transition-all duration-200 shadow-sm hover:shadow-md data-[state=open]:border-green-500 data-[state=open]:bg-gray-700"
          >
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Advanced Data Options</span>
              <span className="ml-auto text-xs text-gray-500 group-hover:text-green-400">Click to expand</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Data Quality */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Layers className="h-4 w-4 text-green-400" />
                      <span>Data Quality</span>
                    </h4>
                    <LearningDialog
                      title="Data Quality & Curation"
                      category="data"
                      description="Data quality refers to how accurate, relevant, and reliable the information used to train AI models is. This includes how well-labeled, diverse, and free from biases the data is. High-quality data directly translates to more accurate and reliable AI behaviors."
                      realWorldExample="When GPT-4 was trained, OpenAI invested heavily in data curation, including having humans review and rate outputs for harmfulness and accuracy. Similarly, Google's Palm 2 required extensive curation of 'high-quality' internet data to avoid learning harmful content."
                      importance="The GIGO principle ('Garbage In, Garbage Out') applies strongly to AI. Better data quality means fewer hallucinations, more accurate responses, and better understanding of complex concepts. A model trained on higher quality data will consistently outperform an identical model trained on poor quality data."
                    />
                  </div>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.quality}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  <strong className="text-green-300">⭐ Raises Data Level</strong> - Investments in data curation lead to more accurate AI models and unlock training prerequisites.
                </p>
                <button 
                  className={`w-full py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                    money < 75 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  onClick={allocateMoneyToDataQuality}
                  disabled={money < 75}
                  data-tutorial-id="data-quality-upgrade"
                >
                  <span>Invest</span>
                  <span className="font-medium">$75</span>
                </button>
              </div>
              
              {/* Data Quantity */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Boxes className="h-4 w-4 text-green-400" />
                      <span>Data Quantity</span>
                    </h4>
                    <LearningDialog
                      title="Data Scale & Quantity"
                      category="data"
                      description="The sheer volume of training data is critical for AI development. Modern language models require trillions of tokens (words or word-pieces) to learn language patterns effectively. The scale of data directly influences what an AI can learn."
                      realWorldExample="OpenAI's GPT models have been trained on progressively larger datasets; GPT-3 used hundreds of billions of tokens, while GPT-4 likely used trillions. Google's PaLM model was trained on 780 billion tokens across 339 billion words from diverse sources including web documents, books, code, and conversations."
                      importance="More data allows AI to encounter more diverse examples, learn rare patterns, and develop more nuanced understandings. The 'scaling law' phenomenon observed in AI research suggests that performance continues to improve predictably as data quantity increases, though with diminishing returns."
                    />
                  </div>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.quantity}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  <strong className="text-amber-400">⚡ Boosts Production</strong> - More data through web scraping and licensing leads to better capabilities. <em className="text-gray-500">Quality upgrades needed for Data Level.</em>
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
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <LayoutGrid className="h-4 w-4 text-green-400" />
                      <span>Data Formats</span>
                    </h4>
                    <LearningDialog
                      title="Multimodal Data Formats"
                      category="data"
                      description="Multimodal AI development requires training on diverse data types beyond text: images, audio, video, code, structured data, and more. Each new data format enables new capabilities and applications for AI systems."
                      realWorldExample="OpenAI's DALL-E and Midjourney were trained on billions of image-text pairs. GPT-4V's visual capabilities came from incorporating image data alongside text. Google's Gemini was trained from the start on multiple modalities including text, images, audio, and video."
                      importance="Expanding to new data formats allows AI to understand and generate new types of content. Text-only models can't truly 'see' or 'hear' - each new modality provides a different way of understanding the world. Models trained on diverse formats can make connections between concepts across different modalities."
                    />
                  </div>
                  <div className="bg-green-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {dataInputs.formats}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  <strong className="text-amber-400">⚡ Boosts Production</strong> - Investment in multimodal data unlocks new AI capabilities. <em className="text-gray-500">Quality upgrades needed for Data Level.</em>
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
          <div id="algorithm-section" className="resource-card bg-gray-700 rounded-lg p-4 mb-2 border-l-4 border-[#8B5CF6]" data-tutorial-id="algorithm-factory-card">
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
              <span className="text-[#8B5CF6] font-bold">
                <AnimatedNumber value={Math.floor(resources.algorithm)} />
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Research Rate:</span>
                <span className="text-[#8B5CF6]">
                  <AnimatedNumber value={production.algorithm.toFixed(1)} />
                  /s
                </span>
              </div>
              <div className="relative">
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#8B5CF6] h-full" style={{ width: getAlgorithmBarWidth() }}></div>
                </div>
              </div>
            </div>

            {/* Dynamic Algorithm Lab Educational Content */}
            <div className="mt-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0">🧠</div>
                <div>
                  <h5 className="text-xs font-medium text-purple-300 mb-2">Algorithm Research Focus</h5>
                  <div className="text-xs text-gray-300 space-y-2">
                    {(() => {
                      const currentEra = gameState.currentEra;
                      const algorithmLevel = gameState.levels.algorithm;
                      const researchProgress = gameState.training.algorithmResearchProgress;
                      
                      if (currentEra === Era.GNT2 || currentEra === Era.GNT3) {
                        const colors = algorithmColorClasses.foundation;
                        return (
                          <>
                            <div>🔬 <strong>Foundation Research:</strong> Developing core neural network architectures and training methods</div>
                            <div className={`${colors.text} italic`}>Early stages focus on proving basic concepts - like how attention mechanisms revolutionized NLP in 2017</div>
                            {algorithmLevel < 3 && (
                              <div className={colors.accent}>💡 <strong>Next Step:</strong> Hire Research Engineers to accelerate architectural breakthroughs</div>
                            )}
                            <div className={`mt-1 text-xs ${colors.progress}`}>Research Progress: {researchProgress.toFixed(1)}% toward next breakthrough</div>
                          </>
                        );
                      } else if (currentEra === Era.GNT4 || currentEra === Era.GNT5) {
                        const colors = algorithmColorClasses.innovation;
                        return (
                          <>
                            <div>⚡ <strong>Innovation Phase:</strong> Advanced architectures and training optimizations for massive scale</div>
                            <div className={`${colors.text} italic`}>Focus shifts to scaling architectures efficiently - like how GPT-4 optimized training for trillion-parameter models</div>
                            {algorithmLevel < 5 && (
                              <div className={colors.accent}>💡 <strong>Next Step:</strong> Balance architectural improvements with research talent acquisition</div>
                            )}
                            <div className={`mt-1 text-xs ${colors.progress}`}>Research Progress: {researchProgress.toFixed(1)}% - approaching major architectural leap</div>
                          </>
                        );
                      } else {
                        const colors = algorithmColorClasses.agi;
                        return (
                          <>
                            <div>🚀 <strong>AGI Research:</strong> Novel architectures for general intelligence and reasoning capabilities</div>
                            <div className={`${colors.text} italic`}>Cutting-edge research into unified architectures that can handle any task - the holy grail of AI</div>
                            <div className={colors.accent}>💡 <strong>AGI Focus:</strong> Research engineers become critical for breakthrough discoveries</div>
                            <div className={`mt-1 text-xs ${colors.progress}`}>Research Progress: {researchProgress.toFixed(1)}% - pushing the boundaries of what's possible</div>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
            

          </div>
          
          <AccordionTrigger 
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-purple-400 font-medium border border-gray-600 hover:border-purple-500/50 transition-all duration-200 shadow-sm hover:shadow-md data-[state=open]:border-purple-500 data-[state=open]:bg-gray-700"
          >
            <span className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Advanced Algorithm Options</span>
              <span className="ml-auto text-xs text-gray-500 group-hover:text-purple-400">Click to expand</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Research Engineers */}
              <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>Research Engineers</span>
                    </h4>
                    <LearningDialog
                      title="Research Engineers & Architectures"
                      category="algorithm"
                      description="A team of top-tier AI research engineers is crucial for developing novel model architectures. They determine how information flows through models and what kinds of patterns can be learned. The best engineers have been responsible for architectures that enabled many of the most significant breakthroughs in AI."
                      realWorldExample="OpenAI, Anthropic, and other leading AI companies compete fiercely to hire the best research engineers. Engineers like those who created the Transformer architecture in 2017 revolutionized NLP and enabled models like GPT. Elite talent is often paid >$1M annually due to their outsized impact."
                      importance="Top research talent is often the true bottleneck to AI progress. Their insights can unlock capabilities that were previously impossible regardless of scale or compute. Without elite research teams, companies struggle to innovate beyond simply scaling up existing architectures."
                    />
                  </div>
                  <div className="bg-purple-900/60 px-2 py-0.5 rounded-full text-xs">
                    Level: {algorithmInputs.researchEngineers || 0}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mb-2">
                  Hire more of the best engineers to accelerate research and develop novel architectures.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                      money < 125 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                    onClick={allocateMoneyToAlgorithmArchitectures}
                    disabled={money < 125}
                    data-tutorial-id="algorithm-architecture-upgrade"
                  >
                    <span>Improve Architectures</span>
                    <span className="font-medium">${gameState.algorithmInputs.architectures > 0 ? 
                      Math.floor(125 * (1 + (gameState.algorithmInputs.architectures * 0.1))) : 
                      125}</span>
                  </button>
                  
                  {hireResearchEngineer && (
                    <button 
                      className={`py-1.5 px-3 rounded text-sm flex justify-between items-center ${
                        money < 175 ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                      onClick={hireResearchEngineer}
                      disabled={money < 175}
                    >
                      <span>Hire Engineers</span>
                      <span className="font-medium">$175</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

import React from 'react';
import { CpuIcon, ZapIcon, BrainIcon, TimerIcon, LockIcon, PlayCircleIcon, CheckCircleIcon, AlertTriangleIcon, ChevronRightIcon, RouteIcon, AwardIcon, RocketIcon, GraduationCapIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResourceTooltip } from '@/components/ui/educational-tooltip';
import { formatCurrency } from '@/lib/utils';
import { GameStateType, Era, TrainingStatus } from '@/lib/gameState';
import { resourceDefinitions, enablingInputs } from '@/lib/educationalContent';

interface ComputePanelProps {
  gameState: GameStateType;
  trainModel: () => void;
}

export default function ComputePanel({ gameState, trainModel }: ComputePanelProps) {
  const { computeCapacity } = gameState;
  
  // Helper function to get next era
  const getNextEra = (currentEra: Era): Era => {
    switch (currentEra) {
      case Era.GNT2: return Era.GNT3;
      case Era.GNT3: return Era.GNT4;
      case Era.GNT4: return Era.GNT5;
      case Era.GNT5: return Era.GNT6;
      case Era.GNT6: return Era.GNT7;
      case Era.GNT7: return Era.GNT7; // Already at max
    }
  };
  
  // Determine the next era that we're working towards
  const nextEra = getNextEra(gameState.currentEra);
  
  // Get the training run data for the next era if it exists
  const targetTrainingRun = Object.prototype.hasOwnProperty.call(gameState.training.runs, nextEra) ? 
    gameState.training.runs[nextEra as keyof typeof gameState.training.runs] : null;
  
  // Get active training run status if any
  const isTrainingActive = gameState.training.active;
  const trainingStatus = targetTrainingRun?.status || TrainingStatus.LOCKED;
  const trainingProgress = isTrainingActive && targetTrainingRun ? 
    Math.round(((targetTrainingRun.daysRequired - gameState.training.daysRemaining) / targetTrainingRun.daysRequired) * 100) : 
    0;
  
  // Calculate algorithm research progress
  const algorithmResearchProgress = Math.round(gameState.training.algorithmResearchProgress);
  
  // Function to get status badge styling
  const getStatusBadge = (status: TrainingStatus) => {
    switch (status) {
      case TrainingStatus.LOCKED:
        return { 
          bg: "bg-gray-700", 
          text: "text-gray-400", 
          icon: <LockIcon className="h-3 w-3 mr-1" />,
          label: "Locked"
        };
      case TrainingStatus.AVAILABLE:
        return { 
          bg: "bg-green-700", 
          text: "text-green-300", 
          icon: <PlayCircleIcon className="h-3 w-3 mr-1" />,
          label: "Ready"
        };
      case TrainingStatus.IN_PROGRESS:
        return { 
          bg: "bg-blue-700", 
          text: "text-blue-300", 
          icon: <TimerIcon className="h-3 w-3 mr-1" />,
          label: "Training"
        };
      case TrainingStatus.COMPLETE:
        return { 
          bg: "bg-purple-700", 
          text: "text-purple-300", 
          icon: <CheckCircleIcon className="h-3 w-3 mr-1" />,
          label: "Complete"
        };
    }
  };
  
  // Get badge for current training run
  const statusBadge = getStatusBadge(trainingStatus);
  
  // Get all prerequisites for the training run with current and required values
  const getAllPrerequisites = () => {
    if (!targetTrainingRun) return [];
    
    const prereqs = targetTrainingRun.prerequisites;
    const prerequisites = [
      { 
        name: "Compute Level", 
        current: gameState.levels.compute, 
        required: prereqs.compute,
        isMet: gameState.levels.compute >= prereqs.compute,
        icon: <CpuIcon className="h-3 w-3" />,
        category: "compute",
        colorClass: "text-blue-400"
      },
      { 
        name: "Data Quality", 
        current: gameState.dataInputs.quality, 
        required: prereqs.data.quality,
        isMet: gameState.dataInputs.quality >= prereqs.data.quality,
        icon: <AwardIcon className="h-3 w-3" />,
        category: "data",
        colorClass: "text-green-400"
      },
      { 
        name: "Data Quantity", 
        current: gameState.dataInputs.quantity, 
        required: prereqs.data.quantity,
        isMet: gameState.dataInputs.quantity >= prereqs.data.quantity,
        icon: <ZapIcon className="h-3 w-3" />,
        category: "data",
        colorClass: "text-green-400"
      },
      { 
        name: "Data Formats", 
        current: gameState.dataInputs.formats, 
        required: prereqs.data.formats,
        isMet: gameState.dataInputs.formats >= prereqs.data.formats,
        icon: <RouteIcon className="h-3 w-3" />,
        category: "data",
        colorClass: "text-green-400"
      },
      { 
        name: "Algorithm Architectures", 
        current: gameState.algorithmInputs.architectures, 
        required: prereqs.algorithm.architectures,
        isMet: gameState.algorithmInputs.architectures >= prereqs.algorithm.architectures,
        icon: <BrainIcon className="h-3 w-3" />,
        category: "algorithm",
        colorClass: "text-purple-400"
      },
      { 
        name: "Algorithm Research", 
        current: Math.floor(gameState.training.algorithmResearchProgress), 
        required: prereqs.algorithm.researchProgress,
        isMet: gameState.training.algorithmResearchProgress >= prereqs.algorithm.researchProgress,
        icon: <GraduationCapIcon className="h-3 w-3" />,
        category: "algorithm",
        colorClass: "text-purple-400",
        isPercentage: true
      },
      { 
        name: "Electricity", 
        current: gameState.computeInputs.electricity, 
        required: prereqs.computeInputs.electricity,
        isMet: gameState.computeInputs.electricity >= prereqs.computeInputs.electricity,
        icon: <ZapIcon className="h-3 w-3" />,
        category: "compute",
        colorClass: "text-blue-400"
      },
      { 
        name: "Hardware", 
        current: gameState.computeInputs.hardware, 
        required: prereqs.computeInputs.hardware,
        isMet: gameState.computeInputs.hardware >= prereqs.computeInputs.hardware,
        icon: <CpuIcon className="h-3 w-3" />,
        category: "compute",
        colorClass: "text-blue-400"
      },
      { 
        name: "Regulatory Compliance", 
        current: gameState.computeInputs.regulation, 
        required: prereqs.computeInputs.regulation,
        isMet: gameState.computeInputs.regulation >= prereqs.computeInputs.regulation,
        icon: <CheckCircleIcon className="h-3 w-3" />,
        category: "compute",
        colorClass: "text-blue-400"
      }
    ];
    
    return prerequisites;
  };
  
  // Get all prerequisites
  const allPrerequisites = getAllPrerequisites();
  
  // Get only missing prerequisites
  const missingPrerequisites = allPrerequisites.filter(prereq => !prereq.isMet);
  
  // Count met prerequisites by category
  const metPrereqsByCategory = {
    compute: allPrerequisites.filter(p => p.category === "compute" && p.isMet).length,
    data: allPrerequisites.filter(p => p.category === "data" && p.isMet).length,
    algorithm: allPrerequisites.filter(p => p.category === "algorithm" && p.isMet).length
  };
  
  // Count total prerequisites by category
  const totalPrereqsByCategory = {
    compute: allPrerequisites.filter(p => p.category === "compute").length,
    data: allPrerequisites.filter(p => p.category === "data").length,
    algorithm: allPrerequisites.filter(p => p.category === "algorithm").length
  };
  
  // Calculate category completion percentages
  const categoryCompletion = {
    compute: Math.round((metPrereqsByCategory.compute / totalPrereqsByCategory.compute) * 100),
    data: Math.round((metPrereqsByCategory.data / totalPrereqsByCategory.data) * 100),
    algorithm: Math.round((metPrereqsByCategory.algorithm / totalPrereqsByCategory.algorithm) * 100)
  };
  
  // Calculate overall completion percentage
  const metPrereqs = allPrerequisites.filter(p => p.isMet).length;
  const overallCompletionPercent = Math.round((metPrereqs / allPrerequisites.length) * 100);
  
  // Check if there's enough compute for the training run
  const hasEnoughCompute = computeCapacity.available >= (targetTrainingRun?.computeRequired || 0);
  
  // Determine if the button should be enabled
  const canStartTraining = trainingStatus === TrainingStatus.AVAILABLE && 
                          !isTrainingActive && 
                          hasEnoughCompute;
                          
  // Function to provide educational content for each prerequisite
  const getPrerequisiteEducation = (prereqName: string) => {
    // Map names to their educational content
    switch(prereqName) {
      case "Compute Level":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{resourceDefinitions.compute.title}</h4>
            <p>{resourceDefinitions.compute.description}</p>
            <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/40 rounded-md">
              <h5 className="text-blue-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{resourceDefinitions.compute.realWorldExample}</p>
            </div>
          </div>
        );
      case "Data Quality":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.quality.title}</h4>
            <p>{enablingInputs.quality.description}</p>
            <div className="mt-2 p-2 bg-green-900/30 border border-green-800/40 rounded-md">
              <h5 className="text-green-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.quality.realWorldExample}</p>
            </div>
          </div>
        );
      case "Data Quantity":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.quantity.title}</h4>
            <p>{enablingInputs.quantity.description}</p>
            <div className="mt-2 p-2 bg-green-900/30 border border-green-800/40 rounded-md">
              <h5 className="text-green-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.quantity.realWorldExample}</p>
            </div>
          </div>
        );
      case "Data Formats":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.formats.title}</h4>
            <p>{enablingInputs.formats.description}</p>
            <div className="mt-2 p-2 bg-green-900/30 border border-green-800/40 rounded-md">
              <h5 className="text-green-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.formats.realWorldExample}</p>
            </div>
          </div>
        );
      case "Algorithm Architectures":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.architectures.title}</h4>
            <p>{enablingInputs.architectures.description}</p>
            <div className="mt-2 p-2 bg-purple-900/30 border border-purple-800/40 rounded-md">
              <h5 className="text-purple-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.architectures.realWorldExample}</p>
            </div>
          </div>
        );
      case "Algorithm Research":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Algorithm Research Progress</h4>
            <p>Research progress represents the cumulative knowledge and experimentation required to develop a model architecture that can handle the next level of capabilities. This includes testing various approaches, running experiments, and iteratively improving designs.</p>
            <div className="mt-2 p-2 bg-purple-900/30 border border-purple-800/40 rounded-md">
              <h5 className="text-purple-300 font-medium text-xs">Importance</h5>
              <p className="text-xs mt-1">Progress can accelerate with more compute dedicated to research efforts and with a higher quality foundation of algorithms and architectures.</p>
            </div>
          </div>
        );
      case "Electricity":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.electricity.title}</h4>
            <p>{enablingInputs.electricity.description}</p>
            <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/40 rounded-md">
              <h5 className="text-blue-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.electricity.realWorldExample}</p>
            </div>
          </div>
        );
      case "Hardware":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.hardware.title}</h4>
            <p>{enablingInputs.hardware.description}</p>
            <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/40 rounded-md">
              <h5 className="text-blue-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.hardware.realWorldExample}</p>
            </div>
          </div>
        );
      case "Regulatory Compliance":
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{enablingInputs.regulation.title}</h4>
            <p>{enablingInputs.regulation.description}</p>
            <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/40 rounded-md">
              <h5 className="text-blue-300 font-medium text-xs">Real World Example</h5>
              <p className="text-xs mt-1">{enablingInputs.regulation.realWorldExample}</p>
            </div>
          </div>
        );
      default:
        return <div>Information about {prereqName} will help you understand its importance in AI development.</div>;
    }
  };
  
  return (
    <Card className="bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700 shadow-lg overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-b border-gray-700">
        <CardTitle className="text-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BrainIcon className="h-5 w-5 text-amber-400" />
            <span className="text-white">AI Training System</span>
          </div>
          <ResourceTooltip 
            content={
              <div className="space-y-2 max-w-xs">
                <p>The Training System is the core mechanic for advancing your AI to new eras.</p>
                <p>Each training run requires meeting specific infrastructure requirements.</p>
                <p>Successful training advances your AI's capabilities to the next era level.</p>
              </div>
            }
            resourceType="compute"
          >
            <span className="sr-only">Learn about the training system</span>
          </ResourceTooltip>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {/* Era Transition Visualization - Simplified but Elegant */}
        <div className="relative flex items-center justify-center mb-4 mt-2">
          {/* Background Track */}
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            {/* Progress Bar */}
            <div 
              className="h-full bg-blue-500"
              style={{ 
                width: `${overallCompletionPercent}%`, 
                transition: 'width 0.5s ease-out'
              }}
            ></div>
          </div>
          
          {/* Era Labels */}
          <div className="absolute flex justify-between w-full">
            <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center font-medium -translate-y-3 shadow-sm">
              {gameState.currentEra}
            </div>
            <div className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full flex items-center font-medium -translate-y-3 shadow-sm border border-gray-700">
              <ChevronRightIcon className="h-3 w-3 mr-1" />
              {nextEra}
            </div>
          </div>
          
          {/* Progress Indicator (only shows if in progress) */}
          {overallCompletionPercent > 0 && overallCompletionPercent < 100 && (
            <div 
              className="absolute bg-amber-500 text-black text-xs px-1.5 rounded-sm font-medium shadow-sm"
              style={{ 
                left: `${overallCompletionPercent}%`, 
                top: '0.125rem',
                transform: 'translateX(-50%)',
                transition: 'left 0.5s ease-out'
              }}
            >
              {overallCompletionPercent}%
            </div>
          )}
        </div>
        
        {/* Current Training Run Status */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-900 rounded-lg border border-gray-700 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg text-white font-medium flex items-center gap-2">
                <RocketIcon className="h-4 w-4 text-amber-400" />
                {targetTrainingRun?.name || `${nextEra} Training`}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{targetTrainingRun?.description || "Advance to the next AI capability level"}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs flex items-center ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          </div>

          {/* For in-progress training, show prominent progress bar */}
          {trainingStatus === TrainingStatus.IN_PROGRESS && (
            <div className="mt-4 bg-gray-800 p-3 rounded-md border border-blue-800/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-400">Training Progress</span>
                <span className="text-blue-300 font-bold">{trainingProgress}%</span>
              </div>
              <Progress 
                value={trainingProgress} 
                className="h-3 bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-blue-600 [&>div]:to-blue-400"
              />
              <div className="mt-3 text-sm flex justify-between">
                <div className="flex items-center">
                  <TimerIcon className="h-4 w-4 mr-1 text-blue-400" />
                  <span className="text-blue-300">{gameState.training.daysRemaining} days remaining</span>
                </div>
                <div className="flex items-center">
                  <BrainIcon className="h-4 w-4 mr-1 text-amber-400" />
                  <span className="text-amber-300">+{targetTrainingRun?.intelligenceGain.toLocaleString()} Intelligence</span>
                </div>
              </div>
            </div>
          )}
          
          {/* For not-yet-started training, show prerequisites status */}
          {(trainingStatus === TrainingStatus.LOCKED || trainingStatus === TrainingStatus.AVAILABLE) && !isTrainingActive && (
            <div className="mt-3">
              {/* Overall Completion */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-amber-400">Overall Readiness</span>
                  <span className="text-xs font-medium text-amber-300">{metPrereqs}/{allPrerequisites.length} complete</span>
                </div>
                <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 h-full ${
                      overallCompletionPercent === 100 
                        ? "bg-gradient-to-r from-green-500 to-green-400" 
                        : "bg-gradient-to-r from-amber-600 to-amber-400"
                    }`}
                    style={{ width: `${overallCompletionPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Resource Category Completion */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-800 p-1 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-blue-400">Compute</span>
                    <span className="text-[10px] text-blue-400">{metPrereqsByCategory.compute}/{totalPrereqsByCategory.compute}</span>
                  </div>
                  <Progress 
                    value={categoryCompletion.compute} 
                    className="h-1.5 bg-gray-700 [&>div]:bg-blue-500" 
                  />
                </div>
                <div className="bg-gray-800 p-1 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-green-400">Data</span>
                    <span className="text-[10px] text-green-400">{metPrereqsByCategory.data}/{totalPrereqsByCategory.data}</span>
                  </div>
                  <Progress 
                    value={categoryCompletion.data} 
                    className="h-1.5 bg-gray-700 [&>div]:bg-green-500" 
                  />
                </div>
                <div className="bg-gray-800 p-1 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-purple-400">Algorithm</span>
                    <span className="text-[10px] text-purple-400">{metPrereqsByCategory.algorithm}/{totalPrereqsByCategory.algorithm}</span>
                  </div>
                  <Progress 
                    value={categoryCompletion.algorithm} 
                    className="h-1.5 bg-gray-700 [&>div]:bg-purple-500" 
                  />
                </div>
              </div>

              {/* Detailed Prerequisites Visualization - Organized by Category */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white mb-3">Training Prerequisites</h4>
                
                {/* Categories Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Compute Prerequisites */}
                  <div className="bg-gradient-to-b from-blue-900/20 to-blue-900/10 border border-blue-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <CpuIcon className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">Compute</span>
                      </div>
                      <span className="text-[10px] bg-blue-900/30 rounded-full px-2 py-0.5 text-blue-300">
                        {metPrereqsByCategory.compute}/{totalPrereqsByCategory.compute}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {allPrerequisites
                        .filter(prereq => prereq.category === 'compute')
                        .map((prereq, index) => (
                          <div key={index} className="bg-gray-800/60 rounded-md p-2 border border-gray-700/70">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center">
                                <span className={`mr-1.5 ${prereq.isMet ? 'text-green-400' : 'text-amber-400'}`}>
                                  {prereq.isMet ? 
                                    <CheckCircleIcon className="h-3 w-3" /> : 
                                    <LockIcon className="h-3 w-3" />
                                  }
                                </span>
                                <ResourceTooltip 
                                  content={getPrerequisiteEducation(prereq.name)}
                                  resourceType="compute"
                                  buttonPosition="inline"
                                  side="top"
                                >
                                  <span className="flex items-center text-xs text-blue-400">
                                    {prereq.icon}
                                    <span className="ml-1 font-medium">{prereq.name}</span>
                                  </span>
                                </ResourceTooltip>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs mt-1">
                              <span className={prereq.isMet ? 'text-green-400' : 'text-gray-400'}>
                                {prereq.current}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <span className="text-gray-500 mx-1">/</span>
                              <span className="text-gray-400">
                                {prereq.required}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <div className="flex-1 ml-2">
                                <Progress 
                                  value={Math.min(100, (prereq.current / prereq.required) * 100)} 
                                  className={`h-1.5 bg-gray-700/80 [&>div]:${prereq.isMet ? 'bg-green-500' : 'bg-blue-500'}`} 
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  {/* Data Prerequisites */}
                  <div className="bg-gradient-to-b from-green-900/20 to-green-900/10 border border-green-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <ZapIcon className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-xs font-medium text-green-300">Data</span>
                      </div>
                      <span className="text-[10px] bg-green-900/30 rounded-full px-2 py-0.5 text-green-300">
                        {metPrereqsByCategory.data}/{totalPrereqsByCategory.data}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {allPrerequisites
                        .filter(prereq => prereq.category === 'data')
                        .map((prereq, index) => (
                          <div key={index} className="bg-gray-800/60 rounded-md p-2 border border-gray-700/70">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center">
                                <span className={`mr-1.5 ${prereq.isMet ? 'text-green-400' : 'text-amber-400'}`}>
                                  {prereq.isMet ? 
                                    <CheckCircleIcon className="h-3 w-3" /> : 
                                    <LockIcon className="h-3 w-3" />
                                  }
                                </span>
                                <ResourceTooltip 
                                  content={getPrerequisiteEducation(prereq.name)}
                                  resourceType="data"
                                  buttonPosition="inline"
                                  side="top"
                                >
                                  <span className="flex items-center text-xs text-green-400">
                                    {prereq.icon}
                                    <span className="ml-1 font-medium">{prereq.name}</span>
                                  </span>
                                </ResourceTooltip>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs mt-1">
                              <span className={prereq.isMet ? 'text-green-400' : 'text-gray-400'}>
                                {prereq.current}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <span className="text-gray-500 mx-1">/</span>
                              <span className="text-gray-400">
                                {prereq.required}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <div className="flex-1 ml-2">
                                <Progress 
                                  value={Math.min(100, (prereq.current / prereq.required) * 100)} 
                                  className={`h-1.5 bg-gray-700/80 [&>div]:${prereq.isMet ? 'bg-green-500' : 'bg-green-500'}`} 
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  {/* Algorithm Prerequisites */}
                  <div className="bg-gradient-to-b from-purple-900/20 to-purple-900/10 border border-purple-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <BrainIcon className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs font-medium text-purple-300">Algorithm</span>
                      </div>
                      <span className="text-[10px] bg-purple-900/30 rounded-full px-2 py-0.5 text-purple-300">
                        {metPrereqsByCategory.algorithm}/{totalPrereqsByCategory.algorithm}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {allPrerequisites
                        .filter(prereq => prereq.category === 'algorithm')
                        .map((prereq, index) => (
                          <div key={index} className="bg-gray-800/60 rounded-md p-2 border border-gray-700/70">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center">
                                <span className={`mr-1.5 ${prereq.isMet ? 'text-green-400' : 'text-amber-400'}`}>
                                  {prereq.isMet ? 
                                    <CheckCircleIcon className="h-3 w-3" /> : 
                                    <LockIcon className="h-3 w-3" />
                                  }
                                </span>
                                <ResourceTooltip 
                                  content={getPrerequisiteEducation(prereq.name)}
                                  resourceType="algorithm"
                                  buttonPosition="inline"
                                  side="top"
                                >
                                  <span className="flex items-center text-xs text-purple-400">
                                    {prereq.icon}
                                    <span className="ml-1 font-medium">{prereq.name}</span>
                                  </span>
                                </ResourceTooltip>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-xs mt-1">
                              <span className={prereq.isMet ? 'text-green-400' : 'text-gray-400'}>
                                {prereq.current}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <span className="text-gray-500 mx-1">/</span>
                              <span className="text-gray-400">
                                {prereq.required}{prereq.isPercentage ? '%' : ''}
                              </span>
                              <div className="flex-1 ml-2">
                                <Progress 
                                  value={Math.min(100, (prereq.current / prereq.required) * 100)} 
                                  className={`h-1.5 bg-gray-700/80 [&>div]:${prereq.isMet ? 'bg-green-500' : 'bg-purple-500'}`} 
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Algorithm Research Progress Section */}
              {(trainingStatus === TrainingStatus.LOCKED || trainingStatus === TrainingStatus.AVAILABLE) && !isTrainingActive && (
                <div className="mt-3">
                  <div className="bg-gray-800 rounded-md p-3 border border-purple-900/40">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <BrainIcon className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Algorithm Research</span>
                      </div>
                      <div className="px-2 py-0.5 bg-purple-900/30 rounded-full text-xs text-purple-300 font-medium">
                        {algorithmResearchProgress}%
                      </div>
                    </div>
                    
                    <Progress 
                      value={algorithmResearchProgress} 
                      className="h-2.5 bg-gray-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-purple-400" 
                    />
                    
                    <div className="mt-2 text-xs flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <ZapIcon className="h-3 w-3 mr-1 text-green-400" />
                        <span>Free Compute: {computeCapacity.freeCompute || 0} units</span>
                      </div>
                      <div className="text-gray-400">
                        Rate: +{gameState.training.algorithmResearchRate.toFixed(2)}/day
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Training Resources Required */}
              {trainingStatus === TrainingStatus.AVAILABLE && !isTrainingActive && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-800 p-3 rounded border border-gray-700">
                    <span className="text-xs font-medium text-gray-300">Compute Required</span>
                    <div className={`mt-1 text-lg font-bold flex items-center ${hasEnoughCompute ? 'text-green-400' : 'text-red-400'}`}>
                      <CpuIcon className="h-4 w-4 mr-1" />
                      {targetTrainingRun?.computeRequired.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {hasEnoughCompute 
                        ? "✓ Sufficient compute available" 
                        : `⚠ Need ${(targetTrainingRun?.computeRequired || 0) - computeCapacity.available} more compute`}
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded border border-gray-700">
                    <span className="text-xs font-medium text-gray-300">Intelligence Gain</span>
                    <div className="mt-1 text-lg font-bold text-amber-400 flex items-center">
                      <BrainIcon className="h-4 w-4 mr-1" />
                      +{targetTrainingRun?.intelligenceGain.toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {Math.round((targetTrainingRun?.intelligenceGain || 0) / gameState.agiThreshold * 100)}% toward AGI threshold
                    </div>
                  </div>
                </div>
              )}
              
              {/* Start Training Button */}
              {(trainingStatus === TrainingStatus.AVAILABLE || trainingStatus === TrainingStatus.LOCKED) && !isTrainingActive && (
                <button 
                  className={`w-full mt-4 py-3 px-4 rounded-md flex justify-center items-center gap-2 font-medium text-base ${
                    canStartTraining
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md"
                      : "bg-gray-700 opacity-70 cursor-not-allowed text-gray-300"
                  }`}
                  onClick={trainModel}
                  disabled={!canStartTraining}
                >
                  {canStartTraining ? <RocketIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                  {trainingStatus === TrainingStatus.AVAILABLE 
                    ? "Begin Training Run" 
                    : `Complete ${missingPrerequisites.length} Missing Prerequisites`}
                </button>
              )}
            </div>
          )}
          
          {/* If training is complete, show completion status */}
          {trainingStatus === TrainingStatus.COMPLETE && (
            <div className="mt-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700 rounded-lg p-3">
              <div className="flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-purple-400" />
                <span className="text-purple-300 font-medium">Training Complete!</span>
              </div>
              <div className="text-center mt-2 text-sm text-gray-300">
                You have successfully advanced to <span className="text-purple-300 font-medium">{nextEra}</span>
              </div>
              <div className="flex justify-center mt-3">
                <div className="bg-purple-900/40 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs text-gray-400">Intelligence Gained</div>
                  <div className="text-lg font-bold text-purple-300">+{targetTrainingRun?.intelligenceGain.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Educational Content */}
        <div className="text-xs text-gray-400 p-3 rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700">
          <p className="mb-2">
            Training runs are the key mechanism for advancing your AI to new eras. Each successful training unlocks new capabilities, higher revenue potential, and brings you closer to AGI.
          </p>
          <p>
            The scale of training grows exponentially: each era's training run requires 10× more compute and more advanced infrastructure across all resources.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
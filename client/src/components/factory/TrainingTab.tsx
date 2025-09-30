import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EducationalTooltip } from "@/components/ui/educational-tooltip";
import { 
  Target, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Clock, 
  TrendingUp,
  Brain,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { GameStateType, Era, TrainingStatus } from "@/lib/gameState";

interface TrainingTabProps {
  gameState: GameStateType;
  onStartTraining: () => void;
}

export function TrainingTab({ gameState, onStartTraining }: TrainingTabProps) {
  const { training, currentEra, intelligence, levels, dataInputs, algorithmInputs, computeCapacity } = gameState;

  // Determine the next era
  const getNextEra = (currentEra: Era): Era => {
    const eraOrder = [Era.GNT2, Era.GNT3, Era.GNT4, Era.GNT5, Era.GNT6, Era.GNT7];
    const currentIndex = eraOrder.indexOf(currentEra);
    return currentIndex < eraOrder.length - 1 ? eraOrder[currentIndex + 1] : Era.GNT7;
  };

  const nextEra = getNextEra(currentEra);
  const nextTrainingRun = training.runs[nextEra as keyof typeof training.runs];
  
  // Check prerequisites
  const checkPrerequisites = () => {
    if (!nextTrainingRun) return { met: false, details: [] };
    
    const prereqs = nextTrainingRun.prerequisites;
    const details = [
      {
        label: "Compute Level",
        current: levels.compute,
        required: prereqs.compute,
        met: levels.compute >= prereqs.compute
      },
      {
        label: "Data Quality",
        current: dataInputs.quality,
        required: prereqs.data.quality,
        met: dataInputs.quality >= prereqs.data.quality
      },
      {
        label: "Data Quantity",
        current: dataInputs.quantity,
        required: prereqs.data.quantity,
        met: dataInputs.quantity >= prereqs.data.quantity
      },
      {
        label: "Data Formats",
        current: dataInputs.formats,
        required: prereqs.data.formats,
        met: dataInputs.formats >= prereqs.data.formats
      },
      {
        label: "Algorithm Architectures",
        current: algorithmInputs.architectures,
        required: prereqs.algorithm.architectures,
        met: algorithmInputs.architectures >= prereqs.algorithm.architectures
      },
      {
        label: "Research Progress",
        current: Math.round(training.algorithmResearchProgress),
        required: 100,
        met: training.algorithmResearchProgress >= 100,
        isPercentage: true
      }
    ];
    
    return {
      met: details.every(d => d.met),
      details
    };
  };

  const prerequisites = checkPrerequisites();
  
  // Determine if training can be started
  const canStartTraining = 
    nextTrainingRun && 
    nextTrainingRun.status === TrainingStatus.AVAILABLE && 
    !training.active &&
    prerequisites.met &&
    gameState.money >= nextTrainingRun.moneyCost &&
    computeCapacity.available >= nextTrainingRun.computeRequired;

  // Era progression data
  const eraProgression = [
    { era: Era.GNT2, name: "GNT-2", completed: currentEra !== Era.GNT2 || training.runs[Era.GNT3]?.status === TrainingStatus.COMPLETE },
    { era: Era.GNT3, name: "GNT-3", completed: training.runs[Era.GNT3]?.status === TrainingStatus.COMPLETE },
    { era: Era.GNT4, name: "GNT-4", completed: training.runs[Era.GNT4]?.status === TrainingStatus.COMPLETE },
    { era: Era.GNT5, name: "GNT-5", completed: training.runs[Era.GNT5]?.status === TrainingStatus.COMPLETE },
    { era: Era.GNT6, name: "GNT-6", completed: training.runs[Era.GNT6]?.status === TrainingStatus.COMPLETE },
    { era: Era.GNT7, name: "GNT-7", completed: training.runs[Era.GNT7]?.status === TrainingStatus.COMPLETE || currentEra === Era.GNT7 },
    { era: "AGI" as any, name: "AGI", completed: intelligence >= 1000 }
  ];

  return (
    <div className="space-y-6 p-6" data-testid="training-tab">
      {/* Hero Card - Start Training CTA */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40 border-purple-500/50">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">
                  {training.active ? "Training in Progress" : nextTrainingRun ? nextTrainingRun.name : "Era Training"}
                </h2>
              </div>
              <p className="text-gray-300 text-lg">
                {training.active 
                  ? `Your AI is evolving toward ${nextEra}. Training will complete in ${training.daysRemaining} days.`
                  : nextTrainingRun && nextTrainingRun.status === TrainingStatus.COMPLETE
                  ? "Training complete! Continue advancing your AI toward the next era."
                  : nextTrainingRun && nextTrainingRun.status === TrainingStatus.AVAILABLE
                  ? `Ready to advance from ${currentEra} to ${nextEra}. This training run will transform your AI's capabilities.`
                  : nextTrainingRun && nextTrainingRun.status === TrainingStatus.LOCKED
                  ? "Complete prerequisites to unlock this training run."
                  : currentEra === Era.GNT7 
                  ? "You've reached the final era. Focus on achieving AGI!"
                  : "Continue research and resource development to unlock training."}
              </p>
            </div>
            
            {nextTrainingRun && !training.active && nextTrainingRun.status !== TrainingStatus.COMPLETE && (
              <div className="flex flex-col gap-3">
                <EducationalTooltip content="Training runs are major milestone events that advance your AI to the next era, unlocking new capabilities and revenue streams. Each run requires significant compute resources and takes 30 days to complete.">
                  <Button
                    size="lg"
                    data-testid="start-training-button"
                    onClick={onStartTraining}
                    disabled={!canStartTraining}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg px-8 py-6 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-6 w-6 mr-2" />
                    Start Training Run
                  </Button>
                </EducationalTooltip>
                
                {!canStartTraining && nextTrainingRun.status === TrainingStatus.AVAILABLE && (
                  <div className="text-sm text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {!prerequisites.met ? "Prerequisites not met" :
                     gameState.money < nextTrainingRun.moneyCost ? "Insufficient funds" :
                     "Insufficient compute capacity"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Training Progress */}
          {training.active && nextTrainingRun && (
            <div className="bg-black/30 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-semibold">Training Progress</span>
                </div>
                <Badge variant="secondary" className="bg-purple-600/50 text-white">
                  {training.daysRemaining} days remaining
                </Badge>
              </div>
              
              <Progress 
                value={((nextTrainingRun.daysRequired - training.daysRemaining) / nextTrainingRun.daysRequired) * 100} 
                className="h-3"
              />
              
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Day {nextTrainingRun.daysRequired - training.daysRemaining} of {nextTrainingRun.daysRequired}</span>
                <span>{Math.round(((nextTrainingRun.daysRequired - training.daysRemaining) / nextTrainingRun.daysRequired) * 100)}% complete</span>
              </div>
              
              <div className="pt-2 flex items-center gap-2 text-gray-300">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">{training.computeReserved.toLocaleString()} compute reserved for training</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Era Progression Timeline */}
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Era Progression</h3>
          </div>
          
          <div className="space-y-3">
            {eraProgression.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3" data-testid={`era-milestone-${item.name}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  item.completed 
                    ? 'bg-green-900/50 border-green-500' 
                    : item.era === currentEra 
                    ? 'bg-purple-900/50 border-purple-500 animate-pulse' 
                    : 'bg-gray-800/50 border-gray-600'
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : item.era === currentEra ? (
                    <Target className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      item.completed ? 'text-green-400' :
                      item.era === currentEra ? 'text-purple-400' :
                      'text-gray-500'
                    }`}>
                      {item.name}
                    </span>
                    {item.era === currentEra && !item.completed && (
                      <Badge variant="secondary" className="bg-purple-600/50 text-white text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {item.completed ? 'Complete' :
                     item.era === currentEra ? 'In Development' :
                     'Locked'}
                  </span>
                </div>
                
                {index < eraProgression.length - 1 && (
                  <div className={`absolute left-[1.25rem] w-0.5 h-8 mt-10 ${
                    item.completed ? 'bg-green-500/50' : 'bg-gray-600/50'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Prerequisites Checklist */}
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Training Prerequisites</h3>
          </div>
          
          {nextTrainingRun ? (
            <div className="space-y-4">
              <div className="bg-black/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Training Cost</span>
                  <span className={`font-bold ${
                    gameState.money >= nextTrainingRun.moneyCost ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${nextTrainingRun.moneyCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Compute Required</span>
                  <span className={`font-bold ${
                    computeCapacity.available >= nextTrainingRun.computeRequired ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {nextTrainingRun.computeRequired.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Duration</span>
                  <span className="text-white font-bold">{nextTrainingRun.daysRequired} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Intelligence Gain</span>
                  <span className="text-purple-400 font-bold">+{nextTrainingRun.intelligenceGain}</span>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Prerequisites Status</h4>
                {prerequisites.details.map((prereq) => (
                  <div 
                    key={prereq.label} 
                    className="flex items-center justify-between p-2 rounded bg-black/20"
                    data-testid={`prereq-${prereq.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="flex items-center gap-2">
                      {prereq.met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      )}
                      <span className={`text-sm ${prereq.met ? 'text-gray-300' : 'text-amber-300'}`}>
                        {prereq.label}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${prereq.met ? 'text-green-400' : 'text-gray-400'}`}>
                      {prereq.current}{prereq.isPercentage ? '%' : ''} / {prereq.required}{prereq.isPercentage ? '%' : ''}
                    </span>
                  </div>
                ))}
              </div>

              {!prerequisites.met && (
                <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-300">Prerequisites Not Met</p>
                      <p className="text-xs text-amber-200/80 mt-1">
                        Continue developing your infrastructure and research to unlock this training run.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>You've reached the maximum era.</p>
              <p className="text-sm mt-1">Focus on achieving AGI!</p>
            </div>
          )}
        </Card>
      </div>

      {/* Educational Context */}
      <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700/50">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Why Training Matters</h3>
            <p className="text-gray-300 leading-relaxed">
              Training runs are transformational moments in AI development. Each successful training advances your AI to the next era, 
              unlocking new capabilities, better revenue streams, and bringing you closer to Artificial General Intelligence. 
              Training requires dedicating significant compute resources for 30 days, but the intelligence gains and capability 
              improvements make it the most impactful investment you can make in your AI's evolution.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

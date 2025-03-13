import React from 'react';
import { CpuIcon, ZapIcon, ServerIcon, CircuitBoardIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResourceTooltip } from '@/components/ui/educational-tooltip';
import { formatCurrency } from '@/lib/utils';
import { GameStateType } from '@/lib/gameState';

interface ComputePanelProps {
  gameState: GameStateType;
  trainModel: () => void;
}

export default function ComputePanel({ gameState, trainModel }: ComputePanelProps) {
  const { computeCapacity, money } = gameState;
  
  // Calculate percentage of compute capacity being used
  const computeUsagePercent = Math.min(100, Math.round((computeCapacity.used / computeCapacity.maxCapacity) * 100));
  const computeAvailablePercent = Math.min(100, Math.round((computeCapacity.available / computeCapacity.maxCapacity) * 100));
  
  // Calculate training costs based on game progression (era)
  const eraMultiplier = {
    'GNT-2': 1.0,
    'GNT-3': 1.8,
    'GNT-4': 3.0,
    'GNT-5': 5.0,
    'GNT-6': 8.0,
    'GNT-7': 12.0
  };
  
  const currentMultiplier = eraMultiplier[gameState.currentEra];
  
  // Base requirements that scale with era
  const baseComputeRequired = 300;
  const baseMoneyCost = 25000;
  
  // Scale costs with era
  const computeRequired = Math.ceil(baseComputeRequired * currentMultiplier);
  const moneyCost = Math.ceil(baseMoneyCost * Math.sqrt(currentMultiplier)); // Money scales more slowly
  
  // Calculate expected intelligence gain
  const dataQualityBonus = 1 + (gameState.dataInputs.quality * 0.05); // 5% per level
  const algorithmBonus = 1 + (gameState.levels.algorithm * 0.08); // 8% per level
  const dataQuantityBonus = 1 + (gameState.dataInputs.quantity * 0.03); // 3% per level
  const baseIntelligenceGain = 150;
  
  const intelligenceGain = Math.ceil(
    baseIntelligenceGain * currentMultiplier * dataQualityBonus * algorithmBonus * dataQuantityBonus
  );
  
  // Check if player has enough resources to train
  const canTrain = computeCapacity.available >= computeRequired && money >= moneyCost;
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CpuIcon className="h-5 w-5 text-blue-400" />
            <span className="text-white">Compute Capacity</span>
          </div>
          <ResourceTooltip 
            content={
              <div className="space-y-2 max-w-xs">
                <p>Compute capacity represents your AI infrastructure's processing power.</p>
                <p>It recharges over time and can be increased by investing in hardware and compute resources.</p>
                <p>Use available compute capacity to run training jobs that significantly boost intelligence.</p>
              </div>
            }
            resourceType="compute"
          >
            <span className="sr-only">Learn about compute capacity</span>
          </ResourceTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compute Capacity Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Available</div>
            <div className="font-semibold text-blue-400 flex justify-center items-center gap-1">
              <ZapIcon className="h-3 w-3" />
              {computeCapacity.available.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Used</div>
            <div className="font-semibold text-orange-400 flex justify-center items-center gap-1">
              <ServerIcon className="h-3 w-3" />
              {computeCapacity.used.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Maximum</div>
            <div className="font-semibold text-purple-400 flex justify-center items-center gap-1">
              <CircuitBoardIcon className="h-3 w-3" />
              {computeCapacity.maxCapacity.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Usage Progress Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400">Available Capacity</span>
              <span>{computeAvailablePercent}%</span>
            </div>
            <Progress 
              value={computeAvailablePercent} 
              className="h-2 bg-gray-700 [&>div]:bg-blue-500" 
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-orange-400">Used Capacity</span>
              <span>{computeUsagePercent}%</span>
            </div>
            <Progress 
              value={computeUsagePercent} 
              className="h-2 bg-gray-700 [&>div]:bg-orange-500" 
            />
          </div>
        </div>
        
        {/* Train Model Button */}
        <div className="pt-2">
          <button 
            className={`w-full py-3 px-4 rounded-md flex justify-between items-center transition ${
              canTrain
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 opacity-70 cursor-not-allowed text-gray-300"
            }`}
            onClick={trainModel}
            disabled={!canTrain}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Train AI Model</span>
              <span className="text-xs opacity-80">Gains +{intelligenceGain} Intelligence</span>
            </div>
            <div className="flex flex-col items-end text-xs">
              <div className={`flex items-center ${canTrain ? 'text-blue-200' : 'text-gray-400'}`}>
                <ZapIcon className="h-3 w-3 mr-1" />
                <span>{computeRequired.toLocaleString()}</span>
              </div>
              <div className={`flex items-center ${canTrain ? 'text-blue-200' : 'text-gray-400'}`}>
                <span>$</span>
                <span>{formatCurrency(moneyCost)}</span>
              </div>
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
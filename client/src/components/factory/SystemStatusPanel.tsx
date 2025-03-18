import { GameStateType } from "@/lib/gameState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, ServerIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";

interface SystemStatusPanelProps {
  gameState: GameStateType;
}

export default function SystemStatusPanel({ gameState }: SystemStatusPanelProps) {
  const { computeCapacity } = gameState;
  
  // Calculate percentages for visualization
  const computeUsagePercent = Math.round((computeCapacity.used / computeCapacity.maxCapacity) * 100);
  const computeAvailablePercent = Math.round((computeCapacity.available / computeCapacity.maxCapacity) * 100);
  
  // Determine system health status
  const isCritical = computeUsagePercent >= 95;
  const isWarning = computeUsagePercent >= 90 && computeUsagePercent < 95;
  const isHealthy = computeUsagePercent < 90;
  
  // Calculate impact on services
  const getServiceImpact = () => {
    if (isCritical) {
      return {
        apiImpact: "Severe (50% revenue loss, customer churn)",
        chatbotImpact: "Severe (50% revenue loss, customer churn)",
        trainingImpact: "Unable to start new training runs",
        researchImpact: "Significantly reduced progress",
      };
    } else if (isWarning) {
      return {
        apiImpact: "Degraded (25% revenue reduction)",
        chatbotImpact: "Degraded (25% revenue reduction)",
        trainingImpact: "Available but risky",
        researchImpact: "Reduced progress",
      };
    } else {
      return {
        apiImpact: "Normal",
        chatbotImpact: "Normal",
        trainingImpact: "Available",
        researchImpact: "Optimal",
      };
    }
  };
  
  const serviceImpact = getServiceImpact();
  
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium flex items-center">
          <ServerIcon className="h-5 w-5 mr-2 text-blue-400" />
          System Status
          <ResourceTooltip 
            content="Monitors the health of your AI infrastructure and shows impact on services."
            resourceColor="blue-400"
          >Learn</ResourceTooltip>
        </h3>
        <div className="flex items-center gap-2">
          {isCritical && (
            <span className="text-xs rounded-full px-2 py-1 bg-red-900/30 border border-red-800 text-red-300 flex items-center">
              <div className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              Critical
            </span>
          )}
          {isWarning && (
            <span className="text-xs rounded-full px-2 py-1 bg-amber-900/30 border border-amber-800 text-amber-300 flex items-center">
              <AlertTriangleIcon className="h-3 w-3 mr-1" />
              Warning
            </span>
          )}
          {isHealthy && (
            <span className="text-xs rounded-full px-2 py-1 bg-green-900/30 border border-green-800 text-green-300 flex items-center">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Healthy
            </span>
          )}
        </div>
      </div>
      
      {/* System Health Alert */}
      {isCritical && (
        <Alert className="mb-4 bg-red-900/30 border border-red-800 text-red-300">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Critical System Overload</AlertTitle>
          <AlertDescription>
            Your system is under extreme load and experiencing significant service degradation. 
            Customers are leaving and revenue is severely impacted. Immediate action required.
          </AlertDescription>
        </Alert>
      )}
      
      {isWarning && (
        <Alert className="mb-4 bg-amber-900/30 border border-amber-800 text-amber-300">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertTitle>High System Load</AlertTitle>
          <AlertDescription>
            Your system is experiencing high load with intermittent service issues.
            Revenue growth and service quality are affected. Consider expanding capacity.
          </AlertDescription>
        </Alert>
      )}
      
      {/* System Metrics */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className={`${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-400'} flex items-center`}>
              {isCritical ? (
                <>
                  <AlertCircleIcon className="h-3 w-3 mr-1" />
                  System Load (Critical)
                </>
              ) : isWarning ? (
                <>
                  <AlertTriangleIcon className="h-3 w-3 mr-1" />
                  System Load (High)
                </>
              ) : (
                'System Load'
              )}
            </span>
            <span className={isCritical ? 'text-red-400 font-bold' : isWarning ? 'text-amber-400' : ''}>{computeUsagePercent}%</span>
          </div>
          <Progress 
            value={computeUsagePercent} 
            className={`h-2 bg-gray-700 ${
              isCritical ? '[&>div]:bg-red-500 animate-pulse' : 
              isWarning ? '[&>div]:bg-amber-500' : 
              '[&>div]:bg-blue-500'
            }`} 
          />
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Total Compute</span>
            <span>{computeCapacity.used} / {computeCapacity.maxCapacity}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-purple-400">Customer Usage</span>
            <span>{computeCapacity.customerUsage || 0} units</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-amber-400">Training Reserved</span>
            <span>{gameState.training.computeReserved || 0} units</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Free for Research</span>
            <span>{computeCapacity.freeCompute || 0} units</span>
          </div>
        </div>
      </div>
      
      {/* Service Impact Table */}
      <div className="bg-gray-900 rounded-md p-3 border border-gray-700">
        <h4 className="text-sm font-medium mb-2 text-gray-300">Service Impact</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800 p-2 rounded">
            <span className="text-gray-400">API Service:</span>
            <div className={`font-medium mt-1 ${
              isCritical ? 'text-red-400' : 
              isWarning ? 'text-amber-400' : 
              'text-green-400'
            }`}>{serviceImpact.apiImpact}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <span className="text-gray-400">Chatbot Service:</span>
            <div className={`font-medium mt-1 ${
              isCritical ? 'text-red-400' : 
              isWarning ? 'text-amber-400' : 
              'text-green-400'
            }`}>{serviceImpact.chatbotImpact}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <span className="text-gray-400">Training Capability:</span>
            <div className={`font-medium mt-1 ${
              isCritical ? 'text-red-400' : 
              isWarning ? 'text-amber-400' : 
              'text-green-400'
            }`}>{serviceImpact.trainingImpact}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <span className="text-gray-400">Research Progress:</span>
            <div className={`font-medium mt-1 ${
              isCritical ? 'text-red-400' : 
              isWarning ? 'text-amber-400' : 
              'text-green-400'
            }`}>{serviceImpact.researchImpact}</div>
          </div>
        </div>
      </div>
      
      {/* Recovery Recommendations */}
      {(isCritical || isWarning) && (
        <div className="mt-4 bg-gray-900 rounded-md p-3 border border-gray-700">
          <h4 className="text-sm font-medium mb-2 text-gray-300">Recommended Actions</h4>
          <ul className="text-xs space-y-1.5">
            <li className="flex items-start">
              <span className="text-blue-400 mr-1.5">•</span>
              <span>Upgrade Compute infrastructure to increase maximum capacity</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-1.5">•</span>
              <span>Upgrade Hardware to increase efficiency</span>
            </li>
            {isCritical && (
              <li className="flex items-start">
                <span className="text-red-400 mr-1.5">•</span>
                <span>Consider temporarily disabling services to reduce load</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
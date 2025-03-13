import React, { useEffect, useRef, useState } from "react";
import { GameStateType } from "@/lib/gameState";
import { motion } from "framer-motion";
import { EducationalTooltip, ResourceTooltip } from "@/components/ui/educational-tooltip";
import { resourceDefinitions, synergyEffects } from "@/lib/educationalContent";
import "./resourceFlow.css";

// Types for node positions
interface NodePosition {
  x: number;
  y: number;
}

// Types for flow animation states
interface FlowAnimation {
  active: boolean;
  progress: number;
  speed: number;
}

interface ResourceFlowVisualizationProps {
  gameState: GameStateType;
}

export default function ResourceFlowVisualization({ gameState }: ResourceFlowVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Node positions (dynamic based on container size)
  const [nodePositions, setNodePositions] = useState({
    compute: { x: 50, y: 50 },
    data: { x: 250, y: 50 },
    algorithm: { x: 150, y: 200 },
    intelligence: { x: 150, y: 100 },
  });
  
  // Flow animation states
  const [flows, setFlows] = useState({
    computeToData: { active: true, progress: 0, speed: 0.5 },
    dataToAlgorithm: { active: true, progress: 0, speed: 0.7 },
    algorithmToCompute: { active: true, progress: 0, speed: 0.6 },
    computeToIntelligence: { active: true, progress: 0, speed: 0.4 },
    dataToIntelligence: { active: true, progress: 0, speed: 0.45 },
    algorithmToIntelligence: { active: true, progress: 0, speed: 0.5 },
  });

  // Update container size on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (!containerRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
      
      // Update node positions based on container size - improved spacing to avoid overlaps
      setNodePositions({
        compute: { x: width * 0.2, y: height * 0.3 },
        data: { x: width * 0.8, y: height * 0.3 },
        algorithm: { x: width * 0.5, y: height * 0.6 },
        intelligence: { x: width * 0.5, y: height * 0.12 },
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);
  
  // Animation loop for flow animations
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setFlows(prevFlows => ({
        computeToData: {
          ...prevFlows.computeToData,
          progress: (prevFlows.computeToData.progress + prevFlows.computeToData.speed / 100) % 1
        },
        dataToAlgorithm: {
          ...prevFlows.dataToAlgorithm,
          progress: (prevFlows.dataToAlgorithm.progress + prevFlows.dataToAlgorithm.speed / 100) % 1
        },
        algorithmToCompute: {
          ...prevFlows.algorithmToCompute,
          progress: (prevFlows.algorithmToCompute.progress + prevFlows.algorithmToCompute.speed / 100) % 1
        },
        computeToIntelligence: {
          ...prevFlows.computeToIntelligence,
          progress: (prevFlows.computeToIntelligence.progress + prevFlows.computeToIntelligence.speed / 100) % 1
        },
        dataToIntelligence: {
          ...prevFlows.dataToIntelligence,
          progress: (prevFlows.dataToIntelligence.progress + prevFlows.dataToIntelligence.speed / 100) % 1
        },
        algorithmToIntelligence: {
          ...prevFlows.algorithmToIntelligence,
          progress: (prevFlows.algorithmToIntelligence.progress + prevFlows.algorithmToIntelligence.speed / 100) % 1
        },
      }));
    });
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [flows]);
  
  // Update flow speeds based on game state
  useEffect(() => {
    setFlows(prevFlows => ({
      ...prevFlows,
      computeToData: {
        ...prevFlows.computeToData,
        speed: gameState.bonuses.computeToData * 0.5,
        active: gameState.bonuses.computeToData > 0.1
      },
      dataToAlgorithm: {
        ...prevFlows.dataToAlgorithm,
        speed: gameState.bonuses.dataToAlgorithm * 0.7,
        active: gameState.bonuses.dataToAlgorithm > 0.1
      },
      algorithmToCompute: {
        ...prevFlows.algorithmToCompute,
        speed: gameState.bonuses.algorithmToCompute * 0.6,
        active: gameState.bonuses.algorithmToCompute > 0.1
      },
      computeToIntelligence: {
        ...prevFlows.computeToIntelligence,
        speed: gameState.bonuses.computeToIntelligence * 0.4,
        active: gameState.bonuses.computeToIntelligence > 0.1
      },
      dataToIntelligence: {
        ...prevFlows.dataToIntelligence,
        speed: gameState.bonuses.dataToIntelligence * 0.45,
        active: gameState.bonuses.dataToIntelligence > 0.1
      },
      algorithmToIntelligence: {
        ...prevFlows.algorithmToIntelligence,
        speed: gameState.bonuses.algorithmToIntelligence * 0.5,
        active: gameState.bonuses.algorithmToIntelligence > 0.1
      },
    }));
  }, [gameState.bonuses]);

  // Helper function to draw a curved path between two points
  const getCurvedPath = (start: NodePosition, end: NodePosition, pathId: string): string => {
    const controlPointX = (start.x + end.x) / 2;
    
    // Different curve shapes based on path type to avoid overlaps
    let heightFactor = 0;
    let controlPointY = 0;
    
    // Custom path adjustments based on which nodes are being connected
    if (pathId.includes('compute-to-data')) {
      // Compute to Data (horizontal, curve up)
      heightFactor = 80;
      controlPointY = (start.y + end.y) / 2 - heightFactor;
    } 
    else if (pathId.includes('algorithm-to-compute')) {
      // Algorithm to Compute (diagonal, curve right)
      heightFactor = 60;
      controlPointY = (start.y + end.y) / 2 - heightFactor;
      // Adjust x for better appearance
      const controlPointXOffset = 40;
      return `M ${start.x} ${start.y} Q ${controlPointX - controlPointXOffset} ${controlPointY}, ${end.x} ${end.y}`;
    }
    else if (pathId.includes('data-to-algorithm')) {
      // Data to Algorithm (diagonal, curve left)
      heightFactor = 40;
      controlPointY = (start.y + end.y) / 2 - heightFactor;
      // Adjust x for better appearance
      const controlPointXOffset = 40;
      return `M ${start.x} ${start.y} Q ${controlPointX + controlPointXOffset} ${controlPointY}, ${end.x} ${end.y}`;
    }
    else if (pathId.includes('-to-intelligence')) {
      // Anything to Intelligence (vertical, spread out)
      if (pathId.includes('compute-to-intelligence')) {
        // Curve to the left
        return `M ${start.x} ${start.y} Q ${start.x - 50} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`;
      } else if (pathId.includes('data-to-intelligence')) {
        // Curve to the right
        return `M ${start.x} ${start.y} Q ${start.x + 50} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`;
      } else {
        // Algorithm to Intelligence (center path)
        heightFactor = 50;
        controlPointY = (start.y + end.y) / 2 + heightFactor; // Curve down instead of up
        return `M ${start.x} ${start.y} Q ${controlPointX} ${controlPointY}, ${end.x} ${end.y}`;
      }
    }
    
    // Default fallback for any other paths
    controlPointY = (start.y + end.y) / 2 - 50;
    return `M ${start.x} ${start.y} Q ${controlPointX} ${controlPointY}, ${end.x} ${end.y}`;
  };
  
  // Helper function to get point along a curved path at a specific percentage
  const getPointOnCurve = (path: SVGPathElement, percent: number): { x: number, y: number } => {
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * percent);
    return { x: point.x, y: point.y };
  };
  
  // Helper function to get relationship explanation
  const getRelationshipLabel = (sourceType: string, targetType: string): string => {
    if (targetType === 'intelligence') {
      return `Improves ${sourceType === 'compute' ? 'model scale' : 
              sourceType === 'data' ? 'model knowledge' : 'model capabilities'}`;
    }
    
    if (sourceType === 'compute' && targetType === 'data') {
      return 'Accelerates data processing';
    }
    
    if (sourceType === 'data' && targetType === 'algorithm') {
      return 'Enables model improvements';
    }
    
    if (sourceType === 'algorithm' && targetType === 'compute') {
      return 'Optimizes compute efficiency';
    }
    
    return '';
  };
  
  // Get importance based on bonus value
  const getFlowImportance = (bonusValue: number): number => {
    return Math.min(Math.max(bonusValue * 3, 0.5), 3); // Scale between 0.5 and 3
  };
  
  // Render a flow line with animated particles
  const renderFlowLine = (
    id: string, 
    startNode: keyof typeof nodePositions, 
    endNode: keyof typeof nodePositions, 
    flow: FlowAnimation,
    color: string
  ) => {
    if (!flow.active) return null;
    
    const start = nodePositions[startNode];
    const end = nodePositions[endNode];
    const pathId = `path-${id}`;
    const path = getCurvedPath(start, end, id);
    
    // Get bonus value for this relationship
    const getBonusValue = () => {
      if (startNode === 'compute') {
        if (endNode === 'data') return gameState.bonuses.computeToData;
        if (endNode === 'intelligence') return gameState.bonuses.computeToIntelligence;
      } else if (startNode === 'data') {
        if (endNode === 'algorithm') return gameState.bonuses.dataToAlgorithm;
        if (endNode === 'intelligence') return gameState.bonuses.dataToIntelligence;
      } else if (startNode === 'algorithm') {
        if (endNode === 'compute') return gameState.bonuses.algorithmToCompute;
        if (endNode === 'intelligence') return gameState.bonuses.algorithmToIntelligence;
      }
      return 0;
    };
    
    // Calculate line thickness based on importance
    const strokeWidth = getFlowImportance(getBonusValue());
    
    // Calculate midpoint for placing the label, with better positioning for the taller container
    const midX = (start.x + end.x) / 2;
    // Adjust label position based on the connection type
    let verticalOffset = 15;
    
    // For connections to Intelligence, place labels higher
    if (endNode === 'intelligence' || startNode === 'intelligence') {
      verticalOffset = 25;
    }
    
    const midY = (start.y + end.y) / 2 - verticalOffset;
    
    // Get label for this relationship
    const relationshipLabel = getRelationshipLabel(startNode, endNode);
    
    // Number of particles scales with flow importance
    const particleCount = Math.max(2, Math.floor(getBonusValue() * 5));
    
    return (
      <g key={id}>
        <path
          id={pathId}
          d={path}
          stroke={`${color}30`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Flow label */}
        <g transform={`translate(${midX}, ${midY})`} className="flow-label">
          <rect
            x={-60}
            y={-12}
            width={120}
            height={16}
            rx={4}
            fill={`${color}20`}
            stroke={`${color}40`}
            strokeWidth={1}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            className="text-[8px]"
          >
            {relationshipLabel}
          </text>
        </g>
        
        {/* Animated particles */}
        {Array.from({ length: particleCount }, (_, i) => {
          const offset = i / particleCount;
          const particlePos = (flow.progress + offset) % 1;
          const particleSize = 2 + getBonusValue(); // Larger particles for important flows
          
          return (
            <circle
              key={`particle-${id}-${i}`}
              className="flow-particle"
              r={particleSize}
              fill={color}
              opacity={0.7}
              // Use Framer Motion for smooth animation
              style={{
                offsetPath: `path('${path}')`,
                offsetDistance: `${particlePos * 100}%`,
              }}
            />
          );
        })}
      </g>
    );
  };
  
  // Resource node component
  const ResourceNode = ({ 
    type, 
    position, 
    color, 
    iconPath 
  }: { 
    type: 'compute' | 'data' | 'algorithm' | 'intelligence',
    position: NodePosition, 
    color: string,
    iconPath: string
  }) => {
    const isIntelligence = type === 'intelligence';
    // Make intelligence node clearly larger but adjust for smaller container
    const nodeSize = isIntelligence ? 60 : 45;
    
    // Get resource values for display
    const getResourceValue = () => {
      if (isIntelligence) {
        return Math.floor(gameState.intelligence);
      }
      return Math.floor(gameState.resources[type]);
    };
    
    // Get production rate for display
    const getProductionRate = () => {
      if (isIntelligence) {
        // Calculate intelligence growth from all sources
        const totalGrowth = 
          gameState.bonuses.computeToIntelligence + 
          gameState.bonuses.dataToIntelligence + 
          gameState.bonuses.algorithmToIntelligence;
        return `+${(totalGrowth * 10).toFixed(1)}/min`;
      }
      return `+${gameState.production[type].toFixed(1)}/min`;
    };
    
    // Educational content for tooltips with more focused explanation
    const getTooltipContent = () => {
      if (type === 'intelligence') {
        return (
          <div className="space-y-2">
            <p className="font-bold">Intelligence Score: {Math.floor(gameState.intelligence)}</p>
            <p>The culmination of your Compute, Data, and Algorithm investments. This is your main goal metric.</p>
            <p className="mt-1">
              <span className="font-semibold">Current Growth:</span> {getProductionRate()}
            </p>
            <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
              <span className="font-semibold">Real-world parallel:</span> The performance metrics used to evaluate AI systems like accuracy, reasoning ability, and general capabilities.
            </p>
            <p className="text-xs mt-1 text-amber-400">
              <span className="font-semibold">Goal:</span> Reach {gameState.agiThreshold} to achieve AGI
            </p>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <p className="font-bold">{resourceDefinitions[type].title}: {getResourceValue()}</p>
          <p>{resourceDefinitions[type].description}</p>
          <p className="mt-1">
            <span className="font-semibold">Production:</span> {getProductionRate()}
          </p>
          <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
            <span className="font-semibold">Real-world example:</span> {resourceDefinitions[type].realWorldExample}
          </p>
        </div>
      );
    };
    
    // Get level-based stroke width to indicate importance
    const getStrokeWidth = () => {
      if (isIntelligence) return 3;
      return 1 + (gameState.levels[type] * 0.3); // Scale stroke width with level importance
    };
    
    // Determine node fill based on progress and type
    const getNodeFill = () => {
      if (isIntelligence) {
        // Calculate progress to AGI
        const progress = gameState.intelligence / gameState.agiThreshold;
        return `url(#intelligenceGradient-${Math.min(Math.floor(progress * 5), 4)})`;
      }
      return `${color}20`;
    };
    
    return (
      <g transform={`translate(${position.x - nodeSize/2}, ${position.y - nodeSize/2})`}>
        {isIntelligence ? (
          <ResourceTooltip
            resourceType="intelligence"
            content={getTooltipContent()}
          >
            <g className="cursor-pointer">
              {/* Intelligence node has a gradient fill to show progress */}
              <defs>
                {[0, 1, 2, 3, 4].map(level => (
                  <radialGradient
                    key={`intelligenceGradient-${level}`}
                    id={`intelligenceGradient-${level}`}
                    cx="50%"
                    cy="50%"
                    r="50%"
                    fx="50%"
                    fy="50%"
                  >
                    <stop offset="0%" stopColor="#FFC107" stopOpacity={(level + 1) * 0.15} />
                    <stop offset="70%" stopColor="#FFC107" stopOpacity={(level + 1) * 0.1} />
                    <stop offset="100%" stopColor="#FFC107" stopOpacity={(level + 1) * 0.05} />
                  </radialGradient>
                ))}
              </defs>
              
              {/* Pulsing outer ring to draw attention */}
              <circle 
                cx={nodeSize/2} 
                cy={nodeSize/2} 
                r={nodeSize/2 + 5}
                fill="none"
                stroke="#FFC10740"
                strokeWidth={1}
                className="animate-pulse"
              />
              
              <circle 
                cx={nodeSize/2} 
                cy={nodeSize/2} 
                r={nodeSize/2} 
                fill={getNodeFill()}
                stroke="#FFC107"
                strokeWidth={getStrokeWidth()}
              />
              
              {/* AGI progress circle */}
              <circle
                cx={nodeSize/2}
                cy={nodeSize/2}
                r={nodeSize/2 - 5}
                fill="none"
                stroke="#FFC107"
                strokeWidth={2}
                strokeDasharray={`${(gameState.intelligence / gameState.agiThreshold) * (2 * Math.PI * (nodeSize/2 - 5))} ${2 * Math.PI * (nodeSize/2 - 5)}`}
                strokeDashoffset="0"
                transform={`rotate(-90 ${nodeSize/2} ${nodeSize/2})`}
                className="progress-ring"
              />
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 - 5} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-base font-bold text-amber-400"
              >
                {Math.floor(gameState.intelligence)}
              </text>
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 13} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[9px] text-amber-200"
              >
                Intelligence
              </text>
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 25} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[8px] text-amber-400/80"
              >
                {getProductionRate()}
              </text>
            </g>
          </ResourceTooltip>
        ) : (
          <ResourceTooltip
            resourceType={type}
            content={getTooltipContent()}
          >
            <g className="cursor-pointer resource-node">
              <circle 
                cx={nodeSize/2} 
                cy={nodeSize/2} 
                r={nodeSize/2} 
                fill={getNodeFill()}
                stroke={color}
                strokeWidth={getStrokeWidth()}
              />
              
              {/* Resource level indicator */}
              <circle
                cx={nodeSize/2}
                cy={nodeSize/2}
                r={nodeSize/2 - 4}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={`${(gameState.levels[type] / 10) * (2 * Math.PI * (nodeSize/2 - 4))} ${2 * Math.PI * (nodeSize/2 - 4)}`}
                strokeDashoffset="0"
                transform={`rotate(-90 ${nodeSize/2} ${nodeSize/2})`}
                strokeLinecap="round"
                className="progress-ring"
              />
              
              <path 
                d={iconPath} 
                fill="none" 
                stroke={color} 
                strokeWidth="1.5"
                transform={`translate(${nodeSize/2 - 12}, ${nodeSize/2 - 22}) scale(1)`}
              />
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 3} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-sm font-medium"
                fill={color}
              >
                {getResourceValue()}
              </text>
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 18} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[9px]"
                fill={color}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </text>
              
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 28} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[8px] opacity-80"
                fill={color}
              >
                {getProductionRate()}
              </text>
            </g>
          </ResourceTooltip>
        )}
      </g>
    );
  };
  
  // Generate persistent node labels
  const renderNodeLabels = () => {
    return (
      <>
        {/* Label styles simplified for more compact display */}
        {/* Compute Label */}
        <div 
          className="absolute font-bold uppercase text-blue-500 bg-blue-900/80 px-1.5 py-0 rounded text-[10px] tracking-wide shadow-md shadow-blue-900/30 z-20"
          style={{ 
            left: `${nodePositions.compute.x - 25}px`, 
            top: `${nodePositions.compute.y - 35}px`,
          }}
        >
          Compute
        </div>
        
        {/* Data Label */}
        <div 
          className="absolute font-bold uppercase text-green-500 bg-green-900/80 px-1.5 py-0 rounded text-[10px] tracking-wide shadow-md shadow-green-900/30 z-20"
          style={{ 
            left: `${nodePositions.data.x - 17}px`, 
            top: `${nodePositions.data.y - 35}px`,
          }}
        >
          Data
        </div>
        
        {/* Algorithm Label */}
        <div 
          className="absolute font-bold uppercase text-purple-500 bg-purple-900/80 px-1.5 py-0 rounded text-[10px] tracking-wide shadow-md shadow-purple-900/30 z-20"
          style={{ 
            left: `${nodePositions.algorithm.x - 28}px`, 
            top: `${nodePositions.algorithm.y - 35}px`,
          }}
        >
          Algorithm
        </div>
        
        {/* Intelligence Label */}
        <div 
          className="absolute font-bold uppercase text-amber-400 bg-amber-900/80 px-1.5 py-0 rounded text-[10px] tracking-wide shadow-md shadow-amber-900/30 z-20"
          style={{ 
            left: `${nodePositions.intelligence.x - 34}px`, 
            top: `${nodePositions.intelligence.y - 38}px`,
          }}
        >
          Intelligence
        </div>
      </>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-[500px] bg-gray-800 rounded-lg p-6 overflow-hidden border border-gray-700 shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Resource Interactions</h2>
        
        {/* Help tooltip */}
        <div className="bg-gray-700 p-2 rounded text-xs text-gray-300 max-w-xs">
          <span className="font-semibold text-amber-400">Goal:</span> Reach {gameState.agiThreshold} Intelligence to achieve AGI
          <div className="mt-1 text-[10px] border-t border-gray-600 pt-1">
            Resources flow between systems and intelligence. Stronger connections improve production rates.
          </div>
        </div>
      </div>
      
      {/* Fixed Resource Labels */}
      {renderNodeLabels()}
      
      <svg width="100%" height="100%" className="absolute top-0 left-0 pt-10">
        {/* Flow connections */}
        {renderFlowLine(
          'compute-to-data', 
          'compute', 
          'data', 
          flows.computeToData, 
          '#3B82F6' // blue
        )}
        
        {renderFlowLine(
          'data-to-algorithm', 
          'data', 
          'algorithm', 
          flows.dataToAlgorithm, 
          '#10B981' // green
        )}
        
        {renderFlowLine(
          'algorithm-to-compute', 
          'algorithm', 
          'compute', 
          flows.algorithmToCompute, 
          '#8B5CF6' // purple
        )}
        
        {renderFlowLine(
          'compute-to-intelligence', 
          'compute', 
          'intelligence', 
          flows.computeToIntelligence, 
          '#3B82F6' // blue
        )}
        
        {renderFlowLine(
          'data-to-intelligence', 
          'data', 
          'intelligence', 
          flows.dataToIntelligence, 
          '#10B981' // green
        )}
        
        {renderFlowLine(
          'algorithm-to-intelligence', 
          'algorithm', 
          'intelligence', 
          flows.algorithmToIntelligence, 
          '#8B5CF6' // purple
        )}
        
        {/* Resource nodes */}
        <ResourceNode 
          type="compute" 
          position={nodePositions.compute} 
          color="#3B82F6" 
          iconPath="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" 
        />
        
        <ResourceNode 
          type="data" 
          position={nodePositions.data}
          color="#10B981"
          iconPath="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
        
        <ResourceNode 
          type="algorithm" 
          position={nodePositions.algorithm}
          color="#8B5CF6"
          iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
        
        <ResourceNode 
          type="intelligence" 
          position={nodePositions.intelligence}
          color="#FFC107"
          iconPath=""
        />
      </svg>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-sm text-gray-300 mb-2">Resource synergy effects:</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {/* Compute Effects Group */}
          <div className="space-y-1">
            <div className="text-blue-400 font-medium mb-1">Compute Effects:</div>
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.computeToData.title}</p>
                  <p>{synergyEffects.computeToData.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.computeToData.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-blue-400/20 px-2 py-1 rounded text-blue-400 cursor-help inline-block">
                → Data: {(gameState.bonuses.computeToData * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.computeToAlgorithm.title}</p>
                  <p>{synergyEffects.computeToAlgorithm.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.computeToAlgorithm.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-blue-400/20 px-2 py-1 rounded text-blue-400 cursor-help inline-block">
                → Algorithm: {(gameState.bonuses.computeToAlgorithm * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.computeToIntelligence.title}</p>
                  <p>{synergyEffects.computeToIntelligence.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.computeToIntelligence.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-blue-400/20 px-2 py-1 rounded text-blue-400 cursor-help inline-block">
                → Intelligence: {(gameState.bonuses.computeToIntelligence * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
          </div>
          
          {/* Data Effects Group */}
          <div className="space-y-1">
            <div className="text-green-400 font-medium mb-1">Data Effects:</div>
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.dataToCompute.title}</p>
                  <p>{synergyEffects.dataToCompute.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.dataToCompute.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-green-400/20 px-2 py-1 rounded text-green-400 cursor-help inline-block">
                → Compute: {(gameState.bonuses.dataToCompute * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.dataToAlgorithm.title}</p>
                  <p>{synergyEffects.dataToAlgorithm.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.dataToAlgorithm.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-green-400/20 px-2 py-1 rounded text-green-400 cursor-help inline-block">
                → Algorithm: {(gameState.bonuses.dataToAlgorithm * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.dataToIntelligence.title}</p>
                  <p>{synergyEffects.dataToIntelligence.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.dataToIntelligence.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-green-400/20 px-2 py-1 rounded text-green-400 cursor-help inline-block">
                → Intelligence: {(gameState.bonuses.dataToIntelligence * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
          </div>
          
          {/* Algorithm Effects Group */}
          <div className="space-y-1">
            <div className="text-purple-400 font-medium mb-1">Algorithm Effects:</div>
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.algorithmToCompute.title}</p>
                  <p>{synergyEffects.algorithmToCompute.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.algorithmToCompute.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-purple-400/20 px-2 py-1 rounded text-purple-400 cursor-help inline-block">
                → Compute: {(gameState.bonuses.algorithmToCompute * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.algorithmToData.title}</p>
                  <p>{synergyEffects.algorithmToData.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.algorithmToData.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-purple-400/20 px-2 py-1 rounded text-purple-400 cursor-help inline-block">
                → Data: {(gameState.bonuses.algorithmToData * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
            
            <EducationalTooltip
              content={
                <div className="space-y-1">
                  <p className="font-medium">{synergyEffects.algorithmToIntelligence.title}</p>
                  <p>{synergyEffects.algorithmToIntelligence.description}</p>
                  <p className="text-xs mt-1 italic text-gray-400">
                    Example: {synergyEffects.algorithmToIntelligence.realWorldExample}
                  </p>
                </div>
              }
              side="top"
            >
              <div className="bg-purple-400/20 px-2 py-1 rounded text-purple-400 cursor-help inline-block">
                → Intelligence: {(gameState.bonuses.algorithmToIntelligence * 100).toFixed(0)}%
              </div>
            </EducationalTooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
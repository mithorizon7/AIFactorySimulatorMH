import React, { useEffect, useRef, useState } from "react";
import { GameStateType } from "@/lib/gameState";
import { motion } from "framer-motion";
import { EducationalTooltip, ResourceTooltip } from "@/components/ui/educational-tooltip";
import { resourceDefinitions } from "@/lib/educationalContent";

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
      
      // Update node positions based on container size
      setNodePositions({
        compute: { x: width * 0.2, y: height * 0.3 },
        data: { x: width * 0.8, y: height * 0.3 },
        algorithm: { x: width * 0.5, y: height * 0.7 },
        intelligence: { x: width * 0.5, y: height * 0.2 },
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
  const getCurvedPath = (start: NodePosition, end: NodePosition): string => {
    const controlPointX = (start.x + end.x) / 2;
    const controlPointY = (start.y + end.y) / 2 - 30;
    return `M ${start.x} ${start.y} Q ${controlPointX} ${controlPointY}, ${end.x} ${end.y}`;
  };
  
  // Helper function to get point along a curved path at a specific percentage
  const getPointOnCurve = (path: SVGPathElement, percent: number): { x: number, y: number } => {
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * percent);
    return { x: point.x, y: point.y };
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
    const path = getCurvedPath(start, end);
    
    return (
      <g key={id}>
        <path
          id={pathId}
          d={path}
          stroke={`${color}30`}
          strokeWidth={3}
          fill="none"
        />
        
        {/* Animated particles */}
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((offset, i) => {
          const particlePos = (flow.progress + offset) % 1;
          
          return (
            <circle
              key={`particle-${id}-${i}`}
              className="flow-particle"
              r={3}
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
    const nodeSize = isIntelligence ? 50 : 40;
    
    // Educational content for tooltips
    const getTooltipContent = () => {
      if (type === 'intelligence') {
        return (
          <div className="space-y-2">
            <p className="font-bold">Intelligence Score</p>
            <p>The culmination of your Compute, Data, and Algorithm investments. This represents the AI's overall capabilities.</p>
            <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
              <span className="font-semibold">Real-world parallel:</span> The performance metrics used to evaluate AI systems like accuracy, reasoning ability, and general capabilities.
            </p>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <p className="font-bold">{resourceDefinitions[type].title}</p>
          <p>{resourceDefinitions[type].description}</p>
          <p className="text-xs italic mt-1 border-t border-gray-700 pt-1">
            <span className="font-semibold">Real-world example:</span> {resourceDefinitions[type].realWorldExample}
          </p>
        </div>
      );
    };
    
    return (
      <g transform={`translate(${position.x - nodeSize/2}, ${position.y - nodeSize/2})`}>
        {isIntelligence ? (
          <ResourceTooltip
            resourceType="intelligence"
            content={getTooltipContent()}
          >
            <g className="cursor-pointer">
              <circle 
                cx={nodeSize/2} 
                cy={nodeSize/2} 
                r={nodeSize/2} 
                fill="#FFC107" 
                fillOpacity={0.2}
                stroke="#FFC107"
                strokeWidth={2}
              />
              <text 
                x={nodeSize/2} 
                y={nodeSize/2} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-xs font-bold text-amber-400"
              >
                {Math.floor(gameState.intelligence)}
              </text>
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 16} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[9px] text-amber-200"
              >
                Intelligence
              </text>
            </g>
          </ResourceTooltip>
        ) : (
          <ResourceTooltip
            resourceType={type}
            content={getTooltipContent()}
          >
            <g className="cursor-pointer">
              <circle 
                cx={nodeSize/2} 
                cy={nodeSize/2} 
                r={nodeSize/2} 
                fill={`${color}20`}
                stroke={color}
                strokeWidth={2}
              />
              <path 
                d={iconPath} 
                fill="none" 
                stroke={color} 
                strokeWidth="1.5"
                transform={`translate(${nodeSize/2 - 10}, ${nodeSize/2 - 10}) scale(0.8)`}
              />
              <text 
                x={nodeSize/2} 
                y={nodeSize/2 + 16} 
                textAnchor="middle" 
                dominantBaseline="middle"
                className="text-[9px]"
                fill={color}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </text>
            </g>
          </ResourceTooltip>
        )}
      </g>
    );
  };
  
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-80 bg-gray-800 rounded-lg p-4 overflow-hidden"
    >
      <h2 className="text-xl font-semibold mb-6">Resource Flow Visualization</h2>
      
      <svg width="100%" height="100%" className="absolute top-0 left-0">
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
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-gray-400 mb-1">Resource synergy effects:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-blue-400/20 px-2 py-0.5 rounded text-blue-400">
            Compute → Data: {(gameState.bonuses.computeToData * 100).toFixed(0)}%
          </span>
          <span className="bg-green-400/20 px-2 py-0.5 rounded text-green-400">
            Data → Algorithm: {(gameState.bonuses.dataToAlgorithm * 100).toFixed(0)}%
          </span>
          <span className="bg-purple-400/20 px-2 py-0.5 rounded text-purple-400">
            Algorithm → Compute: {(gameState.bonuses.algorithmToCompute * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
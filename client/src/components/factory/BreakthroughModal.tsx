import React, { useEffect } from 'react';
import { Breakthrough } from '@/lib/gameState';
import { useGamePause } from '@/contexts/GamePauseContext';
import { Button } from '@/components/ui/button';
import { PauseCircle } from 'lucide-react';
import { SparkCharacter } from '@/components/character/SparkCharacter';

interface BreakthroughModalProps {
  breakthrough: Breakthrough;
  onClose: () => void;
}

export default function BreakthroughModal({ breakthrough, onClose }: BreakthroughModalProps) {
  // Safe access to game pause context
  let gamePause;
  try {
    gamePause = useGamePause();
  } catch (error) {
    // If context is not available, provide no-op functions
    gamePause = {
      isPausedForLearning: true, 
      pauseForLearning: () => {}, 
      resumeFromLearning: () => {},
      pauseGameEngine: () => {},
      resumeGameEngine: () => {}
    };
  }
  
  // Use effect to ensure game is paused when breakthrough modal is shown
  useEffect(() => {
    gamePause.pauseForLearning();
    
    // Resume game when component unmounts
    return () => {
      gamePause.resumeFromLearning();
    };
  }, []);
  
  // Production-safe color mappings
  const breakthroughTypeColors = {
    compute: 'bg-blue-600 text-blue-400',
    data: 'bg-green-600 text-green-400',
    algorithm: 'bg-purple-600 text-purple-400',
    combined: 'bg-yellow-500 text-yellow-500',
    default: 'bg-gray-400 text-gray-400'
  };
  
  const getBreakthroughTypeColor = (type: string) => {
    return breakthroughTypeColors[type as keyof typeof breakthroughTypeColors] || breakthroughTypeColors.default;
  };
  
  const getNextChallengeHint = () => {
    switch (breakthrough.id) {
      case 1:
        return "Continue scaling compute and data to enable larger language models. The transformer architecture you've discovered will be the foundation for everything to come.";
      case 2:
        return "Focus on gathering diverse, high-quality data and improving training techniques. Large-scale models will exhibit surprising emergent capabilities.";
      case 3:
        return "Specialized data collection and fine-tuning will unlock powerful new applications like code generation and scientific reasoning.";
      case 4:
        return "Explore human feedback and alignment techniques to make your AI more helpful and controllable for consumer applications.";
      case 5:
        return "Scale up to enable multimodal capabilities - combining text, images, and other data types for richer AI interactions.";
      case 6:
        return "Push the boundaries of reasoning with advanced algorithms that can solve complex multi-step problems independently.";
      case 7:
        return "Combine all your capabilities to create autonomous agents that can operate independently in the real world.";
      default:
        return "You're at the cutting edge of AI development! Continue pushing all three pillars to achieve artificial general intelligence.";
    }
  };
  
  const getBgColor = getBreakthroughTypeColor(breakthrough.type).split(' ')[0];
  const getTextColor = getBreakthroughTypeColor(breakthrough.type).split(' ')[1];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-blue-500 rounded-lg max-w-3xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
        <SparkCharacter
          position="corner"
          size="small"
        />
        
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="pr-16 mb-6">
          <div className="text-center mb-6">
            <div className={`${getBgColor} rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg`}>
              <span className="text-white text-3xl font-bold">🚀</span>
            </div>
            
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-3 ${getBreakthroughTypeColor(breakthrough.type)} border-2`}>
              {breakthrough.type.toUpperCase()} BREAKTHROUGH!
            </div>
            
            <h2 className="text-3xl font-bold mb-3 text-white">{breakthrough.name}</h2>
            <p className="text-gray-300 text-lg leading-relaxed">{breakthrough.description}</p>
          </div>
          
          {/* What Led to This Breakthrough */}
          <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-5 mb-5">
            <h3 className="font-bold mb-3 text-purple-300 flex items-center gap-2 text-lg">
              🔬 What Made This Possible
            </h3>
            <p className="text-purple-100 leading-relaxed">{breakthrough.contributingFactors}</p>
          </div>
          
          {/* Game Impact */}
          <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-5 mb-5">
            <h3 className="font-bold mb-3 text-green-300 flex items-center gap-2 text-lg">
              ⚡ Impact on Your AI Factory
            </h3>
            <p className="text-green-100 leading-relaxed">{breakthrough.gameEffect}</p>
          </div>
          
          {/* Real-World Context */}
          <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-5 mb-5">
            <h3 className="font-bold mb-3 text-blue-300 flex items-center gap-2 text-lg">
              🌍 Real-World Timeline
            </h3>
            <p className="text-blue-100 leading-relaxed">{breakthrough.realWorldParallel}</p>
          </div>
          
          {/* Next Steps Hint */}
          <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-5 mb-6">
            <h3 className="font-bold mb-3 text-yellow-300 flex items-center gap-2 text-lg">
              💡 What's Next?
            </h3>
            <p className="text-yellow-100 leading-relaxed">{getNextChallengeHint()}</p>
          </div>
          
          {/* Pause indicator */}
          {gamePause.isPausedForLearning && (
            <div className="mb-4 px-3 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-400 text-sm flex items-center justify-center">
              <PauseCircle className="w-4 h-4 mr-2" />
              Game timer paused while learning
            </div>
          )}
          
          <button 
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg"
            onClick={onClose}
          >
            Thanks, Spark! Let's keep building! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
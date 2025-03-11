import { GameStateType } from "@/lib/gameState";
import { Button } from "@/components/ui/button";

interface GameSummaryModalProps {
  gameState: GameStateType;
  onClose: () => void;
  onReset: () => void;
}

export default function GameSummaryModal({ gameState, onClose, onReset }: GameSummaryModalProps) {
  const unlockedBreakthroughs = gameState.breakthroughs.filter(b => b.unlocked);
  
  const getBreakthroughTypeColor = (type: string) => {
    switch (type) {
      case 'compute': return 'text-[#3B82F6]';
      case 'data': return 'text-[#10B981]';
      case 'algorithm': return 'text-[#8B5CF6]';
      case 'combined': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-center mb-6">AI Factory Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Final AI Status</h3>
            
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{gameState.intelligence.toFixed(0)}</div>
                <div className="text-sm text-gray-300">Intelligence Score</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#3B82F6] mr-2"></div>
                  Compute Level
                </span>
                <span className="font-medium">{gameState.levels.compute}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#10B981] mr-2"></div>
                  Data Level
                </span>
                <span className="font-medium">{gameState.levels.data}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-[#8B5CF6] mr-2"></div>
                  Algorithm Level
                </span>
                <span className="font-medium">{gameState.levels.algorithm}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Achievements</h3>
            
            <div className="space-y-2">
              {unlockedBreakthroughs.length > 0 ? (
                unlockedBreakthroughs.map(breakthrough => (
                  <div key={breakthrough.id} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${getBreakthroughTypeColor(breakthrough.type)} shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">{breakthrough.name}</p>
                      <p className="text-xs text-gray-400">
                        {breakthrough.type === 'compute' ? 'Increased Compute Power' :
                         breakthrough.type === 'data' ? 'Improved Data Quality' :
                         breakthrough.type === 'algorithm' ? 'Enhanced Algorithm Methods' :
                         'Combined Data & Algorithm upgrades'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No breakthroughs achieved yet. Keep building!</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">What You've Learned</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6] bg-opacity-20 flex items-center justify-center shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Compute</h4>
                <p className="text-sm text-gray-300">AI gets smarter when it has more powerful computers to use. In the real world, companies like OpenAI and Google build specialized hardware to train increasingly powerful models.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-[#10B981] bg-opacity-20 flex items-center justify-center shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Data</h4>
                <p className="text-sm text-gray-300">AI learns from examples. Better quality, more diverse data helps AI understand the world better. This is why companies invest heavily in gathering and curating high-quality training data.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6] bg-opacity-20 flex items-center justify-center shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium">Algorithms</h4>
                <p className="text-sm text-gray-300">AI improves when researchers discover better ways to train it. Innovations like reinforcement learning from human feedback (RLHF) have made models like ChatGPT much more helpful and safe.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-300 mb-4">The most impressive AI breakthroughs happen when all three factors work together - just like in your AI Factory!</p>
          
          <div className="flex justify-center space-x-4">
            <Button
              className="bg-gray-600 hover:bg-gray-500 text-white font-medium"
              onClick={onReset}
            >
              Play Again
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
              onClick={onClose}
            >
              Finish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

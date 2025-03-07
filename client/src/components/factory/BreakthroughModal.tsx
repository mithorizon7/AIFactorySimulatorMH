import { Breakthrough } from "@/lib/gameState";
import { Button } from "@/components/ui/button";

interface BreakthroughModalProps {
  breakthrough: Breakthrough;
  onClose: () => void;
}

export default function BreakthroughModal({ breakthrough, onClose }: BreakthroughModalProps) {
  const getBreakthroughTypeColor = (type: string) => {
    switch (type) {
      case 'compute': return 'bg-[#3B82F6] text-[#3B82F6]';
      case 'data': return 'bg-[#10B981] text-[#10B981]';
      case 'algorithm': return 'bg-[#8B5CF6] text-[#8B5CF6]';
      case 'combined': return 'bg-yellow-500 text-yellow-500';
      default: return 'bg-gray-400 text-gray-400';
    }
  };
  
  const getNextChallengeHint = () => {
    switch (breakthrough.type) {
      case 'compute':
        return "To achieve advanced reasoning capabilities, you'll need to focus on improving both your data quality and algorithm methods.";
      case 'data':
        return "To achieve mathematical problem-solving, you'll need to focus on developing better algorithms. Improved training methods will help your AI learn to think step by step.";
      case 'algorithm':
        return "To enable image and text integration, you'll need more compute power. Advanced processing capabilities will allow your AI to handle multiple data types simultaneously.";
      default:
        return "You've unlocked all breakthroughs! Keep improving all three factors to maximize your AI's capabilities.";
    }
  };
  
  const getBgColor = getBreakthroughTypeColor(breakthrough.type).split(' ')[0];
  const getTextColor = getBreakthroughTypeColor(breakthrough.type).split(' ')[1];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full ${getBgColor} bg-opacity-20 mb-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${getTextColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold">Breakthrough!</h3>
          <p className={`${getTextColor} font-medium mt-1`}>{breakthrough.name}</p>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            {breakthrough.description} This breakthrough happened because you improved your {
              breakthrough.type === 'compute' ? 'Compute power' : 
              breakthrough.type === 'data' ? 'Data quality' : 
              breakthrough.type === 'algorithm' ? 'Algorithm methods' :
              'combination of factors'
            }.
          </p>
          
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <h4 className="font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${getTextColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Why This Matters
            </h4>
            <p className="text-sm text-gray-300">{breakthrough.realWorldParallel}</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Next Challenge Hint
            </h4>
            <p className="text-sm text-gray-300">{getNextChallengeHint()}</p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button
            className={`${getBgColor} hover:bg-opacity-80 text-white font-medium`}
            onClick={onClose}
          >
            Continue Building
          </Button>
        </div>
      </div>
    </div>
  );
}

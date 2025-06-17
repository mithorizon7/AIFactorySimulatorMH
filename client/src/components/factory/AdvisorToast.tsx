import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useGamePause } from '@/contexts/GamePauseContext';
import { Button } from '@/components/ui/button';

interface AdvisorMessage {
  title: string;
  content: string;
  context: string;
}

interface AdvisorToastProps {
  message: AdvisorMessage;
  onClose: () => void;
}

export default function AdvisorToast({ message, onClose }: AdvisorToastProps) {
  const { pauseForLearning, resumeFromLearning } = useGamePause();

  useEffect(() => {
    // Pause the game when the advisor appears
    pauseForLearning();
    
    // Resume when component unmounts
    return () => {
      resumeFromLearning();
    };
  }, [pauseForLearning, resumeFromLearning]);

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-400/30 rounded-lg shadow-2xl overflow-hidden">
        {/* Header with Spark Avatar */}
        <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-amber-400/20 p-4">
          <div className="flex items-center gap-3">
            {/* Spark Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <img 
                src="/Spark1.svg" 
                alt="Spark AI Advisor" 
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  // Fallback to initials if SVG fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-white font-bold text-lg">S</div>
            </div>
            
            {/* Title and Close Button */}
            <div className="flex-1">
              <h3 className="text-amber-100 font-semibold text-lg leading-tight">
                {message.title}
              </h3>
              <p className="text-amber-200/70 text-sm">Spark AI Advisor</p>
            </div>
            
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Spark's Message */}
          <div className="text-gray-100 leading-relaxed">
            {message.content}
          </div>

          {/* Educational Context */}
          <div className="bg-blue-900/30 border border-blue-400/30 rounded-md p-3">
            <h4 className="text-blue-300 font-medium text-sm mb-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              Real-World Context
            </h4>
            <p className="text-blue-100/90 text-sm leading-relaxed">
              {message.context}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium px-6 py-2 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Got it, Spark!
            </Button>
          </div>
        </div>

        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(251,191,36,0.1)] pointer-events-none"></div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { NarrativeMessage } from '@/hooks/useNarrativeTriggers';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, AlertTriangle, Trophy, Target, Zap } from 'lucide-react';
import SparkCharacter from '@/components/character/SparkCharacter';

interface NarrativeNotificationProps {
  message: NarrativeMessage | null;
  onDismiss: () => void;
}

export function NarrativeNotification({ message, onDismiss }: NarrativeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  const getIcon = () => {
    switch (message.category) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 'breakthrough':
        return <Zap className="h-5 w-5 text-purple-400" />;
      case 'advice':
        return <Target className="h-5 w-5 text-blue-400" />;
      default:
        return <Lightbulb className="h-5 w-5 text-green-400" />;
    }
  };

  const getBorderColor = () => {
    switch (message.priority) {
      case 'critical':
        return 'border-red-500';
      case 'high':
        return 'border-orange-400';
      case 'normal':
        return 'border-blue-400';
      case 'low':
        return 'border-gray-500';
      default:
        return 'border-blue-400';
    }
  };

  const getBackgroundColor = () => {
    switch (message.category) {
      case 'warning':
        return 'bg-orange-900/20';
      case 'achievement':
        return 'bg-yellow-900/20';
      case 'breakthrough':
        return 'bg-purple-900/20';
      case 'advice':
        return 'bg-blue-900/20';
      default:
        return 'bg-gray-900/20';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-4 duration-300">
      {message.speaker === 'spark' ? (
        <div className="bg-gray-900 border-2 border-blue-500 rounded-lg shadow-2xl max-w-lg p-4">
          <SparkCharacter
            message={message.content}
            size="small"
            className="mb-3"
          />
          <div className="bg-black/20 border border-gray-700/50 rounded p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-300 mb-1">Real-World Context</p>
                <p className="text-xs text-blue-200 leading-relaxed">{message.context}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className={`bg-gray-900 border-2 ${getBorderColor()} ${getBackgroundColor()} rounded-lg shadow-2xl max-w-md p-4`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white text-sm">
                  {message.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                {message.content}
              </p>
              
              <div className="bg-black/20 border border-gray-700/50 rounded p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-300 mb-1">Real-World Context</p>
                    <p className="text-xs text-blue-200 leading-relaxed">{message.context}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
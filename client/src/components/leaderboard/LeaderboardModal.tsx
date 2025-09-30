import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, DollarSign, Lightbulb, Users, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useGamePause } from "@/contexts/GamePauseContext";
import type { LeaderboardEntry } from "@shared/schema";

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeaderboardModal({ open, onOpenChange }: LeaderboardModalProps) {
  const { pauseForLearning, resumeFromLearning } = useGamePause();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRequest('GET', '/api/leaderboard?limit=20');
      const data = await response.json();
      setLeaderboard(data.data || data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      pauseForLearning(); // Pause the game when leaderboard opens
      loadLeaderboard();
    } else {
      resumeFromLearning(); // Resume the game when leaderboard closes
    }
  }, [open, pauseForLearning, resumeFromLearning]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getStrategyBadge = (entry: LeaderboardEntry) => {
    if (entry.peakB2BSubscribers > entry.peakB2CSubscribers) {
      return { label: "B2B", color: "bg-blue-900/30 text-blue-300" };
    } else if (entry.peakB2CSubscribers > 0) {
      return { label: "B2C", color: "bg-purple-900/30 text-purple-300" };
    }
    return { label: "Balanced", color: "bg-gray-700/30 text-gray-300" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Trophy className="h-7 w-7 text-yellow-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              AGI Hall of Fame
            </span>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Top AI pioneers who achieved Artificial General Intelligence
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
              <p className="text-red-300">{error}</p>
              <Button 
                onClick={loadLeaderboard}
                variant="outline"
                size="sm"
                className="mt-2 border-red-500/50 hover:border-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No AGI achievements yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to reach the Hall of Fame!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const strategy = getStrategyBadge(entry);
                const rank = index + 1;
                
                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border transition-all ${
                      rank <= 3
                        ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30'
                        : 'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`text-2xl font-bold w-12 text-center ${rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {getRankIcon(rank)}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{entry.playerName}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${strategy.color}`}>
                            {strategy.label}
                          </span>
                          {entry.totalTimeElapsed < 600 && (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-300">
                              ⚡ Speed Run
                            </span>
                          )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Intelligence</div>
                              <div className="text-white font-medium">{entry.finalIntelligence}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Time</div>
                              <div className="text-white font-medium">{formatTime(entry.totalTimeElapsed)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Peak Budget</div>
                              <div className="text-white font-medium">{formatCurrency(entry.peakMoney)}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Peak Users</div>
                              <div className="text-white font-medium">
                                {Math.max(entry.peakB2BSubscribers, entry.peakB2CSubscribers).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <div>
                              <div className="text-gray-400 text-xs">Breakthroughs</div>
                              <div className="text-white font-medium">{entry.breakthroughsUnlocked}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              💡 <strong>Tip:</strong> Achieve AGI (1000 Intelligence) to join the Hall of Fame! 
              Balance compute, data, and algorithms to reach the top of the leaderboard.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { GameStateType } from "@/lib/gameState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SparkCharacter } from "@/components/character/SparkCharacter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Clock, DollarSign, Users, Lightbulb, Target, Medal, Rocket } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";

interface VictoryScreenProps {
  gameState: GameStateType;
  onClose: () => void;
  onReset: () => void;
}

interface PlayerRanking {
  rank: number;
  total: number;
  percentile: number;
}

export default function VictoryScreen({ gameState, onClose, onReset }: VictoryScreenProps) {
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [ranking, setRanking] = useState<PlayerRanking | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isAGIAchieved = gameState.intelligence >= gameState.agiThreshold;
  const unlockedBreakthroughs = gameState.breakthroughs.filter(b => b.unlocked);
  
  // Format time display
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

  // Calculate strategy insights based on game stats
  const getStrategyInsights = () => {
    const insights = [];
    
    if (gameState.victoryStats.peakB2BSubscribers > gameState.victoryStats.peakB2CSubscribers) {
      insights.push("B2B-Focused Strategy");
    } else if (gameState.victoryStats.peakB2CSubscribers > 0) {
      insights.push("Consumer-Oriented Strategy");
    }
    
    if (gameState.victoryStats.breakthroughsUnlocked >= 8) {
      insights.push("Research Excellence");
    }
    
    if (gameState.victoryStats.totalTimeElapsed < 600) { // Less than 10 minutes
      insights.push("Speed Runner");
    } else if (gameState.victoryStats.totalTimeElapsed > 1800) { // More than 30 minutes
      insights.push("Methodical Approach");
    }
    
    if (gameState.victoryStats.peakMoney > 50000) {
      insights.push("Financial Mastermind");
    }
    
    return insights;
  };

  // Submit to leaderboard
  const submitToLeaderboard = async () => {
    if (!playerName.trim() || !isAGIAchieved) return;
    
    setIsSubmitting(true);
    try {
      const leaderboardEntry = {
        playerName: playerName.trim(),
        finalIntelligence: Math.floor(gameState.victoryStats.finalIntelligence),
        totalTimeElapsed: gameState.victoryStats.totalTimeElapsed,
        peakMoney: Math.floor(gameState.victoryStats.peakMoney),
        totalMoneyEarned: Math.floor(gameState.victoryStats.totalMoneyEarned),
        peakB2BSubscribers: gameState.victoryStats.peakB2BSubscribers,
        peakB2CSubscribers: gameState.victoryStats.peakB2CSubscribers,
        breakthroughsUnlocked: gameState.victoryStats.breakthroughsUnlocked,
        erasReached: gameState.victoryStats.erasReached,
        hasAchievedAGI: gameState.victoryStats.hasAchievedAGI
      };

      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderboardEntry)
      });
      
      if (response.ok) {
        // Get player ranking
        const rankResponse = await fetch(`/api/ranking/${Math.floor(gameState.intelligence)}`);
        if (rankResponse.ok) {
          const rankData = await rankResponse.json();
          setRanking(rankData);
        }
        
        // Get updated leaderboard
        const leaderboardResponse = await fetch('/api/leaderboard?limit=10');
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData);
        }
        
        setHasSubmitted(true);
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Failed to submit to leaderboard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-700">
          {isAGIAchieved ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  AGI ACHIEVED!
                </h1>
                <Trophy className="h-8 w-8 text-yellow-400" />
              </div>
              <p className="text-lg text-gray-300">You've built the world's first Artificial General Intelligence!</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">AI Factory Journey Complete</h1>
              <p className="text-gray-300">Here's a summary of your AI development journey</p>
            </div>
          )}
          
          <SparkCharacter position="corner" size="small" />
        </div>

        <div className="p-6 space-y-6">
          {/* Journey Statistics */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-6 w-6 text-blue-400" />
                Your AI Development Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{formatTime(gameState.victoryStats.totalTimeElapsed)}</div>
                  <div className="text-sm text-gray-400">Total Time</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(gameState.victoryStats.peakMoney)}</div>
                  <div className="text-sm text-gray-400">Peak Budget</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Math.max(gameState.victoryStats.peakB2BSubscribers, gameState.victoryStats.peakB2CSubscribers).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Peak Users</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{gameState.intelligence.toFixed(0)}</div>
                  <div className="text-sm text-gray-400">Final Intelligence</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Medal className="h-6 w-6 text-yellow-400" />
                Breakthroughs Achieved ({unlockedBreakthroughs.length}/{gameState.breakthroughs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unlockedBreakthroughs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedBreakthroughs.map(breakthrough => (
                    <div key={breakthrough.id} className="flex items-start gap-3 p-3 bg-gray-600 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        breakthrough.type === 'compute' ? 'bg-blue-400' :
                        breakthrough.type === 'data' ? 'bg-green-400' :
                        breakthrough.type === 'algorithm' ? 'bg-purple-400' :
                        'bg-yellow-400'
                      }`} />
                      <div>
                        <div className="font-medium text-white">{breakthrough.name}</div>
                        <div className="text-sm text-gray-400">{breakthrough.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No breakthroughs achieved yet. Keep building!</p>
              )}
            </CardContent>
          </Card>

          {/* Strategy Analysis */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Rocket className="h-6 w-6 text-green-400" />
                Your Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getStrategyInsights().map((strategy, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-900/30 text-green-300">
                    {strategy}
                  </Badge>
                ))}
                {getStrategyInsights().length === 0 && (
                  <span className="text-gray-400">Balanced approach across all areas</span>
                )}
              </div>
              
              <Separator className="my-4 bg-gray-600" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Era Reached</div>
                  <div className="font-medium text-white">GNT-{gameState.victoryStats.erasReached + 1}</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Revenue</div>
                  <div className="font-medium text-white">{formatCurrency(gameState.victoryStats.totalMoneyEarned)}</div>
                </div>
                <div>
                  <div className="text-gray-400">B2B vs B2C Focus</div>
                  <div className="font-medium text-white">
                    {gameState.victoryStats.peakB2BSubscribers > gameState.victoryStats.peakB2CSubscribers ? 'Business' : 'Consumer'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Entry (only for AGI achievers) */}
          {isAGIAchieved && (
            <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-yellow-300">
                  <Trophy className="h-6 w-6" />
                  Join the AGI Hall of Fame
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasSubmitted ? (
                  <div className="space-y-4">
                    <p className="text-gray-200">
                      Congratulations! You've achieved AGI and earned a place on the global leaderboard. 
                      Enter your name to see how you rank against other AI pioneers!
                    </p>
                    
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter your name for the leaderboard"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        maxLength={30}
                        disabled={isSubmitting}
                        data-testid="input-player-name"
                      />
                      <Button
                        onClick={submitToLeaderboard}
                        disabled={!playerName.trim() || isSubmitting}
                        className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                        data-testid="button-submit-leaderboard"
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-300 mb-2">
                        🎉 Welcome to the Hall of Fame, {playerName}! 🎉
                      </div>
                      {ranking && (
                        <div className="text-lg text-gray-200">
                          You ranked #{ranking.rank} out of {ranking.total} players 
                          <span className="text-yellow-300 font-bold">
                            ({ranking.percentile}th percentile)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {showLeaderboard && leaderboard.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-yellow-300 mb-3">Top AGI Achievers</h4>
                        <div className="space-y-2">
                          {leaderboard.slice(0, 5).map((entry, index) => (
                            <div key={entry.id} className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                              <div className="flex items-center gap-3">
                                <span className="text-yellow-300 font-bold">#{index + 1}</span>
                                <span className="text-white">{entry.playerName}</span>
                              </div>
                              <div className="text-sm text-gray-300">
                                {entry.finalIntelligence} IQ • {formatTime(entry.totalTimeElapsed)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Educational Context - Your AI Development Journey */}
          <Card className="bg-gray-700 border-gray-600">
            <CardHeader>
              <CardTitle className="text-xl">Your AI Development Journey - Real World Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resource Investment Analysis */}
              <div className="space-y-4">
                <h4 className="font-medium text-white">How Your Investments Shaped AI Progress</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-400 rounded-sm" />
                      </div>
                      <h5 className="font-medium text-blue-300">Compute ({gameState.levels.compute}/10)</h5>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Your Level {gameState.levels.compute} compute infrastructure {gameState.levels.compute >= 5 
                        ? "enabled large-scale AI training" 
                        : "supported basic AI operations"}.
                    </p>
                    <p className="text-xs text-blue-200">
                      Real-world parallel: {gameState.levels.compute >= 7 
                        ? "Like Meta's AI supercomputers or Google's TPU clusters that train frontier models"
                        : gameState.levels.compute >= 4
                        ? "Similar to mid-sized AI companies using cloud GPUs for model training"
                        : "Like startups using basic cloud compute for AI prototypes"}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-green-400 rounded-sm" />
                      </div>
                      <h5 className="font-medium text-green-300">Data ({gameState.levels.data}/10)</h5>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Your Level {gameState.levels.data} data strategy {gameState.levels.data >= 5 
                        ? "provided high-quality, diverse training datasets" 
                        : "gave access to basic training data"}.
                    </p>
                    <p className="text-xs text-green-200">
                      Real-world parallel: {gameState.levels.data >= 7 
                        ? "Like OpenAI's curated datasets or Anthropic's Constitutional AI training data"
                        : gameState.levels.data >= 4
                        ? "Similar to companies using filtered web data and synthetic datasets"
                        : "Like open-source datasets used for research prototypes"}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <div className="w-4 h-4 bg-purple-400 rounded-sm" />
                      </div>
                      <h5 className="font-medium text-purple-300">Algorithms ({gameState.levels.algorithm}/10)</h5>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      Your Level {gameState.levels.algorithm} research {gameState.levels.algorithm >= 5 
                        ? "unlocked advanced AI architectures and training methods" 
                        : "provided foundational AI techniques"}.
                    </p>
                    <p className="text-xs text-purple-200">
                      Real-world parallel: {gameState.levels.algorithm >= 7 
                        ? "Like breakthrough architectures (Transformers, RLHF) that enable GPT-4 and Claude"
                        : gameState.levels.algorithm >= 4
                        ? "Similar to improved training techniques used by AI labs worldwide"
                        : "Like basic neural networks used in early AI applications"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Breakthrough Impact Analysis */}
              {unlockedBreakthroughs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Breakthrough Impact on Your Success</h4>
                  <div className="space-y-2">
                    {unlockedBreakthroughs.slice(0, 3).map(breakthrough => (
                      <div key={breakthrough.id} className="p-3 bg-gray-600/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            breakthrough.type === 'compute' ? 'bg-blue-400' :
                            breakthrough.type === 'data' ? 'bg-green-400' :
                            breakthrough.type === 'algorithm' ? 'bg-purple-400' :
                            'bg-yellow-400'
                          }`} />
                          <div>
                            <div className="font-medium text-white text-sm">{breakthrough.name}</div>
                            <div className="text-xs text-gray-300 mt-1">{breakthrough.realWorldParallel}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Insights */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">Strategic Lessons for Real AI Development</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-600/30 rounded-lg">
                    <h5 className="text-sm font-medium text-yellow-300 mb-2">🎯 What Worked</h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {gameState.levels.compute >= 6 && <li>• Heavy compute investment enabled large-scale training</li>}
                      {gameState.levels.data >= 6 && <li>• Quality data curation improved model performance</li>}
                      {gameState.levels.algorithm >= 6 && <li>• Research breakthroughs unlocked new capabilities</li>}
                      {gameState.victoryStats.peakB2BSubscribers > gameState.victoryStats.peakB2CSubscribers 
                        ? <li>• B2B focus provided stable revenue for R&D</li>
                        : <li>• Consumer adoption drove scale and data collection</li>}
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-gray-600/30 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-300 mb-2">💡 Alternative Strategies</h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {gameState.levels.compute < 6 && <li>• More compute investment could have accelerated training</li>}
                      {gameState.levels.data < 6 && <li>• Better data quality would improve model capabilities</li>}
                      {gameState.levels.algorithm < 6 && <li>• More research could unlock architectural breakthroughs</li>}
                      {unlockedBreakthroughs.length < 3 && <li>• Balancing all three pillars unlocks more breakthroughs</li>}
                    </ul>
                  </div>
                </div>
              </div>
              
              {isAGIAchieved && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-lg">
                  <h4 className="font-bold text-yellow-300 mb-2">🏆 AGI Achievement - The Real Challenge Ahead</h4>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    In this simulation, you balanced compute, data, and algorithms to achieve AGI in {formatTime(gameState.victoryStats.totalTimeElapsed)}. 
                    In reality, companies like OpenAI, Anthropic, and DeepMind are racing toward this goal with investments in the hundreds of billions. 
                    Your strategy of {gameState.levels.compute >= gameState.levels.data && gameState.levels.compute >= gameState.levels.algorithm 
                      ? "compute-first development" 
                      : gameState.levels.data >= gameState.levels.algorithm 
                      ? "data-centric AI" 
                      : "research-driven innovation"} mirrors real approaches used by leading AI labs today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-play-again"
            >
              Play Again
            </Button>
            <Button
              onClick={onClose}
              className={`flex-1 ${isAGIAchieved 
                ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500" 
                : "bg-blue-600 hover:bg-blue-500"
              } text-white font-medium`}
              data-testid="button-close-victory"
            >
              {isAGIAchieved ? "Celebrate Victory" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
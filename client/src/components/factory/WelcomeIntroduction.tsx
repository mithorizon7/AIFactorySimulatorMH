import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Cpu, Database, LightbulbIcon, Sparkles, BrainCircuit } from "lucide-react";
import { Era } from "@/lib/gameState";

interface WelcomeIntroductionProps {
  onClose: () => void;
  currentEra: Era;
}

export default function WelcomeIntroduction({ onClose, currentEra }: WelcomeIntroductionProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gray-900 border-gray-800 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-t-lg">
          <CardTitle className="text-3xl flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-amber-400" />
            Welcome to AI Factory
          </CardTitle>
          <CardDescription className="text-gray-200 text-lg">
            Your journey to build Artificial General Intelligence
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="overview">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="overview">Game Overview</TabsTrigger>
              <TabsTrigger value="resources">Core Resources</TabsTrigger>
              <TabsTrigger value="goals">Your Mission</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="mt-0 px-6">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-amber-400">What is AI Factory?</h3>
                <p className="text-gray-300">
                  AI Factory is an educational simulation that puts you in charge of developing advanced 
                  artificial intelligence. You'll manage resources, make strategic decisions, and witness 
                  how your choices impact AI development - just like real AI companies do.
                </p>
                
                <div className="mt-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h4 className="font-medium text-blue-400 mb-2">How to Play:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Manage three core resources: Compute, Data, and Algorithms</li>
                    <li>Allocate money strategically to grow your AI capabilities</li>
                    <li>Unlock breakthroughs that mirror real-world AI advancements</li>
                    <li>Progress through historical AI eras from GNT-2 to AGI</li>
                    <li>Complete the game by reaching sufficient intelligence within 20 minutes</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800">
                <h4 className="font-medium text-gray-100 flex items-center gap-1 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Currently in: <span className="font-bold text-amber-400">{currentEra} Era</span>
                </h4>
                <p className="text-gray-300 text-sm">
                  Each era represents a historical period in AI development. Progress through them by
                  balancing your resources and making strategic investments.
                </p>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="resources" className="mt-0 px-6">
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-blue-900 shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      Compute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gray-200">The processing power</span> that enables AI to train on massive datasets and run complex calculations.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      "AI gets smarter faster if it has more powerful computers to use."
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-green-900 shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gray-200">The examples and information</span> that AI learns from to understand patterns and improve its capabilities.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      "AI learns from examples. More examples or better examples help AI understand the world better."
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-purple-900 shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-purple-400 flex items-center gap-2">
                      <LightbulbIcon className="h-5 w-5" />
                      Algorithms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gray-200">The methods and techniques</span> used to train AI models efficiently and effectively.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      "AI gets smarter when people invent better ways to teach it or train it."
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resource Synergies</h4>
                <p className="text-sm text-gray-300">
                  Resources work together! Improvements in one resource can enhance the effectiveness 
                  of others. For example, better algorithms can make your compute more efficient.
                </p>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="goals" className="mt-0 px-6">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-amber-400">Your Mission</h3>
                <p className="text-gray-300">
                  Your goal is to develop Artificial General Intelligence (AGI) - AI capable of 
                  understanding, learning, and applying knowledge across a wide range of tasks 
                  at a human level or beyond.
                </p>
                
                <div className="bg-gradient-to-r from-amber-950 to-amber-900 p-4 rounded-lg border border-amber-700">
                  <h4 className="font-medium text-amber-300 mb-2">Primary Objective:</h4>
                  <p className="text-gray-200">
                    Reach <span className="font-bold text-amber-300">1000 Intelligence</span> within the 20-minute time limit by 
                    strategically managing your resources and making wise investments.
                  </p>
                </div>
                
                <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-400 mb-2">You'll Learn:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>How the three core ingredients (Compute, Data, and Algorithms) contribute to AI progress</li>
                    <li>Why certain AI breakthroughs are significant</li>
                    <li>Real-world implications of AI development decisions</li>
                    <li>How to understand AI news and developments in everyday terms</li>
                    <li>Basic AI vocabulary to confidently discuss the field</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="bg-gray-900 p-6 flex justify-end gap-4">
          <Button variant="ghost" onClick={onClose}>
            Skip for Now
          </Button>
          <Button onClick={onClose} className="bg-amber-600 hover:bg-amber-700">
            Start Building <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
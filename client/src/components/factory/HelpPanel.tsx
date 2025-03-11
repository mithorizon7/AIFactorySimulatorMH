import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HelpCircle, 
  BookOpen, 
  Cpu, 
  Database, 
  Lightbulb,
  Sparkles,
  History,
  BarChart4,
  ArrowUpCircle,
} from "lucide-react";
import { Era } from "@/lib/gameState";

interface HelpPanelProps {
  currentEra: Era;
}

export default function HelpPanel({ currentEra }: HelpPanelProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed bottom-6 left-6 bg-gray-800 hover:bg-gray-700 rounded-full h-12 w-12 border-2 border-amber-500"
          >
            <HelpCircle className="h-6 w-6 text-amber-400" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 bg-gray-900 border-gray-700">
          <DialogHeader className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-amber-400" />
              Game Guide
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Everything you need to know about building Artificial General Intelligence
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basics" className="p-6 pt-2">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basics">Game Basics</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="progression">Progression</TabsTrigger>
              <TabsTrigger value="glossary">AI Glossary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basics" className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">How to Play</h3>
                <p className="text-gray-300 mb-4">
                  AI Factory puts you in charge of developing Artificial General Intelligence (AGI). 
                  You have 20 minutes to reach your intelligence goal by managing resources effectively.
                </p>
                
                <h4 className="text-lg font-medium text-gray-200 mb-2">Core Gameplay</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  <li>
                    <span className="font-medium text-white">Manage Resources:</span> Balance your 
                    Compute, Data, and Algorithm resources to increase your AI's intelligence
                  </li>
                  <li>
                    <span className="font-medium text-white">Spend Money:</span> Allocate your budget to 
                    improve different aspects of your AI development
                  </li>
                  <li>
                    <span className="font-medium text-white">Unlock Breakthroughs:</span> Achieve resource 
                    milestones to unlock historical AI breakthroughs
                  </li>
                  <li>
                    <span className="font-medium text-white">Progress Through Eras:</span> Advance from early 
                    AI models to more sophisticated systems
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">Game Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-200 mb-2">Main Tabs</h4>
                    <ul className="space-y-1 text-gray-300">
                      <li className="flex items-center gap-2">
                        <BarChart4 className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Dashboard:</span> Overview of your progress
                      </li>
                      <li className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Resources:</span> Manage and upgrade resources
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart4 className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Economy:</span> Allocate money strategically
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">Breakthroughs:</span> View AI discoveries
                      </li>
                      <li className="flex items-center gap-2">
                        <History className="h-4 w-4 text-amber-400" />
                        <span className="font-medium">Progression:</span> Track your AI's evolution
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium text-gray-200 mb-2">Actions</h4>
                    <ul className="space-y-1 text-gray-300">
                      <li className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Upgrade Resources:</span> Increase levels
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Invest:</span> Boost production rates
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">Allocate Money:</span> Fund specific areas
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-900">
                  <h3 className="text-lg font-medium text-blue-400 flex items-center gap-2 mb-2">
                    <Cpu className="h-5 w-5" />
                    Compute
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    The processing power that enables AI to train on massive datasets and run complex calculations.
                  </p>
                  
                  <h4 className="font-medium text-gray-200 text-sm">Influenced by:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                    <li>Electricity - Power efficiency</li>
                    <li>Hardware - Quality of components</li>
                    <li>Regulation - Access to compute resources</li>
                  </ul>
                  
                  <div className="mt-3 bg-gray-800 p-2 rounded text-xs text-gray-300">
                    <span className="font-semibold text-blue-400">Real-world parallel:</span> 
                    <p className="mt-1">
                      "When companies build bigger or faster computers, AI learns more quickly and can do harder things."
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-900">
                  <h3 className="text-lg font-medium text-green-400 flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5" />
                    Data
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    The examples and information that AI learns from to understand patterns and improve its capabilities.
                  </p>
                  
                  <h4 className="font-medium text-gray-200 text-sm">Influenced by:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                    <li>Quality - Better training examples</li>
                    <li>Quantity - Volume of training data</li>
                    <li>Formats - Variety of data types</li>
                  </ul>
                  
                  <div className="mt-3 bg-gray-800 p-2 rounded text-xs text-gray-300">
                    <span className="font-semibold text-green-400">Real-world parallel:</span> 
                    <p className="mt-1">
                      "AI learns from examples. More examples or better examples help AI understand the world better."
                    </p>
                  </div>
                </div>
                
                <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-900">
                  <h3 className="text-lg font-medium text-purple-400 flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5" />
                    Algorithms
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    The methods and techniques used to train AI models efficiently and effectively.
                  </p>
                  
                  <h4 className="font-medium text-gray-200 text-sm">Influenced by:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-gray-300">
                    <li>Architectures - Model design innovations</li>
                    <li>Training methods - How models learn</li>
                    <li>Optimization techniques - Improving efficiency</li>
                  </ul>
                  
                  <div className="mt-3 bg-gray-800 p-2 rounded text-xs text-gray-300">
                    <span className="font-semibold text-purple-400">Real-world parallel:</span> 
                    <p className="mt-1">
                      "AI gets smarter when people invent better ways to teach it or train it."
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">Resource Synergies</h3>
                <p className="text-gray-300 mb-3">
                  Resources affect each other, creating synergies that multiply their effectiveness.
                  These are the connections you see in the Resource Flow Visualization.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-900 p-2 rounded">
                    <h4 className="font-medium text-blue-400 text-sm">Compute Synergies</h4>
                    <ul className="list-disc pl-4 text-xs text-gray-300">
                      <li>Compute → Data: Processes data faster</li>
                      <li>Compute → Algorithm: Enables complex models</li>
                      <li>Compute → Intelligence: Powers AI thinking</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900 p-2 rounded">
                    <h4 className="font-medium text-green-400 text-sm">Data Synergies</h4>
                    <ul className="list-disc pl-4 text-xs text-gray-300">
                      <li>Data → Compute: Improves efficiency</li>
                      <li>Data → Algorithm: Refines methods</li>
                      <li>Data → Intelligence: Expands knowledge</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900 p-2 rounded">
                    <h4 className="font-medium text-purple-400 text-sm">Algorithm Synergies</h4>
                    <ul className="list-disc pl-4 text-xs text-gray-300">
                      <li>Algorithm → Compute: Optimizes usage</li>
                      <li>Algorithm → Data: Better data utilization</li>
                      <li>Algorithm → Intelligence: Smarter reasoning</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="progression" className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">AI Evolution Eras</h3>
                <p className="text-gray-300 mb-4">
                  Your AI evolves through distinct eras, reflecting the actual historical progression
                  of AI technology from early models to advanced systems.
                </p>
                
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-2' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-2' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-2 Era (~2019)
                    </h4>
                    <p className="text-xs text-gray-400">Early language models with basic capabilities</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-3' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-3' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-3 Era (~2020-2021)
                    </h4>
                    <p className="text-xs text-gray-400">Significantly larger models with improved capabilities</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-4' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-4' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-4 Era (~2022-2023)
                    </h4>
                    <p className="text-xs text-gray-400">Advanced reasoning and multimodal capabilities</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-5' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-5' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-5 Era (Near Future)
                    </h4>
                    <p className="text-xs text-gray-400">Enhanced reasoning and specialized expertise</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-6' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-6' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-6 Era (Future)
                    </h4>
                    <p className="text-xs text-gray-400">Advanced autonomous capabilities approaching AGI</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg border ${currentEra === 'GNT-7' ? 'bg-amber-900/30 border-amber-700' : 'bg-gray-900 border-gray-700'}`}>
                    <h4 className={`font-medium ${currentEra === 'GNT-7' ? 'text-amber-400' : 'text-gray-300'}`}>
                      GNT-7 Era (AGI Threshold)
                    </h4>
                    <p className="text-xs text-gray-400">Artificial General Intelligence achievement</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">Breakthroughs</h3>
                <p className="text-gray-300 mb-3">
                  Breakthroughs represent significant advancements in AI capability. They are unlocked
                  automatically when you reach certain resource level thresholds.
                </p>
                <p className="text-sm text-gray-400">
                  Each breakthrough is based on a real-world AI development milestone, helping you
                  understand how advances in compute, data, and algorithms have shaped AI progress.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="glossary" className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-xl font-medium text-amber-400 mb-2">AI Terminology</h3>
                <p className="text-gray-300 mb-4">
                  Common terms and concepts in AI development explained in simple language.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-200">Core Concepts</h4>
                    <dl className="mt-2 space-y-3">
                      <div>
                        <dt className="font-medium text-blue-400">Artificial General Intelligence (AGI)</dt>
                        <dd className="text-sm text-gray-300">
                          AI that can understand, learn, and apply knowledge across many different tasks
                          at a human level or beyond.
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Machine Learning</dt>
                        <dd className="text-sm text-gray-300">
                          Systems that learn from data rather than being explicitly programmed.
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Neural Network</dt>
                        <dd className="text-sm text-gray-300">
                          Computing systems inspired by the human brain, with layers of connected nodes
                          that process information.
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Training</dt>
                        <dd className="text-sm text-gray-300">
                          The process of teaching an AI model by showing it examples and adjusting
                          its parameters to improve performance.
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-200">Advanced Terms</h4>
                    <dl className="mt-2 space-y-3">
                      <div>
                        <dt className="font-medium text-blue-400">Transformer Architecture</dt>
                        <dd className="text-sm text-gray-300">
                          A neural network design that revolutionized language models by better
                          handling relationships between words.
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Fine-tuning</dt>
                        <dd className="text-sm text-gray-300">
                          Adjusting a pre-trained model for specific tasks or to follow instructions.
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Multimodal</dt>
                        <dd className="text-sm text-gray-300">
                          AI capable of processing multiple types of information (text, images, audio).
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-blue-400">Alignment</dt>
                        <dd className="text-sm text-gray-300">
                          Ensuring AI systems act according to human values and intentions.
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
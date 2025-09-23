import { GameStateType } from "@/lib/gameState";
import { EducationalTooltip } from "@/components/ui/educational-tooltip";
import { InfoIcon } from "lucide-react";

interface BreakthroughSectionProps {
  gameState: GameStateType;
}

export default function BreakthroughSection({ gameState }: BreakthroughSectionProps) {
  const { breakthroughs, currentGoal } = gameState;
  
  const getCurrentBreakthrough = () => {
    return breakthroughs.find(b => b.id === currentGoal.id);
  };
  
  const calculateGoalProgress = () => {
    const currentBreakthrough = getCurrentBreakthrough();
    if (!currentBreakthrough) return 0;
    
    let progress = 0;
    let totalRequirements = 0;
    
    for (const [resource, level] of Object.entries(currentBreakthrough.requiredLevels)) {
      totalRequirements++;
      const currentLevel = gameState.levels[resource as keyof typeof gameState.levels];
      
      if (currentLevel >= level) {
        progress += 1;
      } else {
        // Partial progress
        const progressToNextLevel = Math.min(1, (currentLevel / level));
        progress += progressToNextLevel;
      }
    }
    
    return Math.min(Math.round((progress / totalRequirements) * 100), 100);
  };
  
  // Production-safe color mappings
  const breakthroughTypeColors = {
    compute: 'border-blue-600 text-blue-400',
    data: 'border-green-600 text-green-400',
    algorithm: 'border-purple-600 text-purple-400',
    combined: 'border-yellow-500 text-yellow-500',
    default: 'border-gray-400 text-gray-400'
  };
  
  const getBreakthroughTypeColor = (type: string) => {
    return breakthroughTypeColors[type as keyof typeof breakthroughTypeColors] || breakthroughTypeColors.default;
  };
  
  // Production-safe requirement badge colors
  const requirementBadgeColors = {
    compute: 'bg-blue-600',
    data: 'bg-green-600',
    algorithm: 'bg-purple-600',
    default: 'bg-gray-500'
  };
  
  const getRequirementBadges = (breakthrough: any) => {
    return Object.entries(breakthrough.requiredLevels).map(([resource, level]) => {
      const color = requirementBadgeColors[resource as keyof typeof requirementBadgeColors] || requirementBadgeColors.default;
      const currentLevel = gameState.levels[resource as keyof typeof gameState.levels];
      const levelRequired = level as number;
      const isCompleted = currentLevel >= levelRequired;
      
      return (
        <span key={resource} className={`${color} text-white px-2 py-1 rounded-full text-xs ${
          isCompleted ? 'opacity-100' : 'opacity-60'
        }`}>
          {`${resource.charAt(0).toUpperCase()}${resource.slice(1)} ${currentLevel}/${levelRequired}`}
        </span>
      );
    });
  };

  // Comprehensive educational content for each breakthrough
  const getBreakthroughEducationalContent = (breakthroughId: number) => {
    const contents = {
      1: { // Transformer Architecture
        title: "Transformer Architecture",
        description: "The foundation of modern AI systems, transformers use 'attention mechanisms' to understand relationships between different parts of text or data. This breakthrough replaces older sequential processing with parallel attention, dramatically improving AI's ability to understand context and meaning.",
        realWorldExample: "The 2017 paper 'Attention Is All You Need' by Google researchers introduced transformers, which became the foundation for ChatGPT, GPT-4, BERT, and virtually all modern language models. Every major AI company now builds on this architecture.",
        howToImprove: "Focus on Algorithm research investments. This breakthrough requires Algorithm Level 2 - upgrade your Algorithm Architectures to develop more sophisticated neural network designs. The transformer breakthrough unlocks when your AI research advances sufficiently.",
        industryImpact: "Transformers revolutionized AI by enabling models to process long sequences efficiently, making modern conversational AI and large language models possible. This single architectural innovation underpins the entire current AI revolution.",
        resourceConnection: "Algorithm-focused breakthrough that enhances how your AI processes information across all domains."
      },
      2: { // Unsupervised Pre-training
        title: "Unsupervised Pre-training",
        description: "A training methodology where AI learns language patterns from vast amounts of text without needing human-labeled examples. The AI discovers grammar, facts, reasoning patterns, and world knowledge simply by predicting the next word in billions of sentences.",
        realWorldExample: "GPT models are trained on hundreds of billions of words from books, websites, and articles. The AI learns to complete sentences like 'The capital of France is...' by seeing this pattern millions of times, without being explicitly taught geography.",
        howToImprove: "Invest heavily in Data Quality and Data Quantity. This breakthrough requires Data Level 2 - focus on gathering more diverse, high-quality datasets. Larger and more varied data leads to better unsupervised learning capabilities.",
        industryImpact: "Unsupervised pre-training enables AI to learn from the entire internet, acquiring broad knowledge without expensive human annotation. This made large-scale AI development economically viable and unlocked general-purpose AI capabilities.",
        resourceConnection: "Data-centric breakthrough that improves learning efficiency from all your data sources."
      },
      3: { // Massive Parameter Scaling
        title: "Massive Parameter Scaling",
        description: "Dramatically increasing the number of parameters (learnable weights) in AI models from millions to billions. More parameters allow AI to memorize more patterns, facts, and capabilities, leading to emergent abilities that smaller models cannot achieve.",
        realWorldExample: "GPT-3 with 175 billion parameters showed capabilities that GPT-2 (1.5B parameters) couldn't match - like few-shot learning, basic reasoning, and code generation. The scale itself unlocked new emergent behaviors.",
        howToImprove: "Requires massive Compute investments. This breakthrough needs Compute Level 3 - upgrade Electricity, Hardware, and Regulations to support training larger models. More compute capacity enables handling billions of parameters effectively.",
        industryImpact: "Scaling laws revealed that bigger models consistently perform better, driving an industry arms race for compute resources. Companies now spend hundreds of millions on single training runs to achieve state-of-the-art performance.",
        resourceConnection: "Compute-intensive breakthrough that multiplies the effectiveness of your data and algorithms through sheer scale."
      },
      4: { // Few-Shot Learning
        title: "Few-Shot Learning",
        description: "The ability of AI to learn new tasks from just a few examples provided in the prompt, without additional training. Large-scale models develop this capability as an emergent property of having seen millions of diverse examples during training.",
        realWorldExample: "You can ask GPT-4 to translate between languages it wasn't specifically trained for by showing just 2-3 example translations in your prompt. The model generalizes from these few examples to handle new cases correctly.",
        howToImprove: "Requires balanced Algorithm Level 3 and Data Level 3 investments. Combine sophisticated architecture development with diverse, high-quality datasets. The interaction between advanced algorithms and rich data enables few-shot capabilities.",
        industryImpact: "Few-shot learning made AI systems incredibly versatile, eliminating the need to train separate models for each task. This breakthrough enabled general-purpose AI assistants and dramatically reduced AI deployment costs.",
        resourceConnection: "Combined breakthrough requiring both algorithm sophistication and data diversity to enable flexible task adaptation."
      },
      5: { // Instruction Tuning
        title: "Instruction Tuning",
        description: "Fine-tuning AI models to follow human instructions more reliably and safely. This process trains AI to understand and execute commands while aligning with human values and intentions, making AI systems more helpful and controllable.",
        realWorldExample: "ChatGPT and Claude use instruction tuning to follow commands like 'Explain quantum physics to a 10-year-old' or 'Write a professional email declining a job offer.' Without this training, models would just continue text rather than follow instructions.",
        howToImprove: "Focus on Algorithm Level 4 - advance your Algorithm Architectures to develop more sophisticated training techniques. Instruction tuning requires advanced algorithmic methods for alignment and safety.",
        industryImpact: "Instruction tuning transformed AI from text completion tools into practical assistants. This breakthrough enabled the transition from research curiosities to consumer-ready AI products used by millions.",
        resourceConnection: "Algorithm-focused breakthrough that enhances AI's ability to understand and follow human intentions across all interactions."
      },
      6: { // Multimodal Integration
        title: "Multimodal Integration",
        description: "Enabling AI to process and understand multiple types of data simultaneously - text, images, audio, and video. This creates AI systems that can reason about visual scenes, understand diagrams, and connect information across different modalities.",
        realWorldExample: "GPT-4 with vision can analyze charts, explain memes, read handwritten notes, and describe images in detail. DALL-E creates images from text descriptions. These models understand connections between visual and textual information.",
        howToImprove: "Requires both Compute Level 4 and Data Level 4. Multimodal models need massive compute for processing diverse data types and extensive datasets containing images, text, audio, and video for comprehensive training.",
        industryImpact: "Multimodal AI enables applications like AI-powered design tools, medical image analysis, autonomous vehicles, and educational assistants that can understand visual materials and real-world contexts.",
        resourceConnection: "Combined breakthrough leveraging both computational power and diverse data types to create more comprehensive AI understanding."
      },
      7: { // Advanced Reasoning
        title: "Advanced Reasoning",
        description: "AI's ability to break down complex problems into logical steps, perform multi-step reasoning, and solve problems requiring planning and abstract thinking. This represents a major leap toward human-like cognitive capabilities.",
        realWorldExample: "Future AI systems may solve complex mathematical proofs, design sophisticated engineering systems, or create detailed business strategies by reasoning through multiple steps and considering various constraints simultaneously.",
        howToImprove: "Requires balanced Algorithm Level 5 and Data Level 5. Advanced reasoning emerges from sophisticated architectures trained on diverse reasoning examples - mathematical proofs, logical puzzles, and complex problem-solving scenarios.",
        industryImpact: "Advanced reasoning will enable AI to tackle complex scientific research, engineering design, strategic planning, and other high-level cognitive tasks currently requiring human experts.",
        resourceConnection: "Combined breakthrough requiring both algorithmic sophistication and diverse reasoning datasets to enable complex problem-solving capabilities."
      },
      8: { // Self-Improvement Capabilities
        title: "Self-Improvement Capabilities",
        description: "AI systems that can analyze and improve their own code, architecture, and algorithms. This represents a potential acceleration point where AI development becomes self-reinforcing, with AI helping to design better AI.",
        realWorldExample: "Future AI might analyze its own neural network architecture, identify inefficiencies, and propose improvements to its training process or model design, potentially accelerating AI development exponentially.",
        howToImprove: "Focus intensively on Algorithm Level 6. Self-improvement requires the most advanced algorithmic techniques for self-analysis, code generation, and architectural optimization. This is primarily an algorithm-driven capability.",
        industryImpact: "Self-improving AI could accelerate technological progress across all fields, potentially leading to rapid advances in science, engineering, and AI capabilities themselves. This breakthrough represents a critical threshold toward superintelligence.",
        resourceConnection: "Algorithm-centric breakthrough that could fundamentally accelerate all future AI development and technological progress."
      },
      9: { // Advanced Tool Use
        title: "Advanced Tool Use",
        description: "AI systems that can effectively use external tools, APIs, databases, and services to extend their capabilities beyond their training. This enables AI to interact with the real world and access up-to-date information and specialized functions.",
        realWorldExample: "Future AI assistants might automatically book flights, analyze real-time market data, control smart home devices, run code in development environments, and coordinate with other AI systems to accomplish complex multi-step tasks.",
        howToImprove: "Requires Algorithm Level 7 and Compute Level 6. Tool use demands sophisticated algorithms for planning and coordination, plus substantial compute for managing multiple simultaneous interactions with external systems.",
        industryImpact: "Advanced tool use will enable AI to become autonomous agents capable of handling complex real-world tasks, potentially automating entire workflows across industries and enabling new forms of human-AI collaboration.",
        resourceConnection: "Combined breakthrough requiring algorithmic sophistication for coordination and compute power for managing complex external interactions."
      },
      10: { // General Problem Solving (AGI)
        title: "General Problem Solving (AGI)",
        description: "The ability to solve novel problems across any domain without domain-specific training. This represents true artificial general intelligence - AI that can learn, reason, and adapt to completely new situations as effectively as humans.",
        realWorldExample: "AGI would enable an AI system to excel at scientific research, creative writing, strategic planning, interpersonal communication, and physical manipulation tasks without being specifically trained for each domain.",
        howToImprove: "Requires Algorithm Level 8, Data Level 7, and Compute Level 7. AGI represents the culmination of all three pillars - the most advanced algorithms, comprehensive data from all domains, and massive computational resources.",
        industryImpact: "AGI represents the ultimate goal of AI research - systems that match or exceed human cognitive abilities across all domains. This breakthrough could transform every aspect of human civilization and scientific progress.",
        resourceConnection: "Ultimate combined breakthrough requiring mastery of all three pillars: algorithms, data, and compute working in perfect harmony to achieve human-level general intelligence."
      }
    };

    return contents[breakthroughId as keyof typeof contents] || contents[1];
  };
  
  const currentBreakthrough = getCurrentBreakthrough();
  const goalProgress = calculateGoalProgress();
  
  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">AI Breakthroughs</h2>
      
      {/* Current Goal */}
      {currentBreakthrough && (() => {
        const educationalContent = getBreakthroughEducationalContent(currentBreakthrough.id);
        return (
          <div className="bg-gray-700 rounded-lg p-4 mb-5">
            <h3 className="text-lg font-medium mb-2">Current Goal</h3>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Achieve {currentBreakthrough.name}</span>
                </div>
                <EducationalTooltip
                  content={
                    <div className="space-y-4 max-w-md">
                      <div>
                        <h3 className="font-bold text-lg mb-2">{educationalContent.title}</h3>
                        <p className="text-sm">{educationalContent.description}</p>
                      </div>
                      
                      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                        <h4 className="font-semibold text-blue-300 mb-2">Real World Example</h4>
                        <p className="text-sm text-blue-100">{educationalContent.realWorldExample}</p>
                      </div>
                      
                      <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                        <h4 className="font-semibold text-green-300 mb-2">How to Improve:</h4>
                        <p className="text-sm text-green-100">{educationalContent.howToImprove}</p>
                      </div>
                      
                      <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                        <h4 className="font-semibold text-purple-300 mb-2">Industry Impact</h4>
                        <p className="text-sm text-purple-100">{educationalContent.industryImpact}</p>
                      </div>
                      
                      <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
                        <h4 className="font-semibold text-amber-300 mb-2">Resource Connection</h4>
                        <p className="text-sm text-amber-100">{educationalContent.resourceConnection}</p>
                      </div>
                    </div>
                  }
                  resourceColor="amber-400"
                  buttonPosition="inline"
                >
                  <InfoIcon className="h-4 w-4 text-amber-400 cursor-pointer" />
                </EducationalTooltip>
              </div>
              <p className="text-sm text-gray-300">{currentBreakthrough.description}</p>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress:</span>
                  <span>{goalProgress}%</span>
                </div>
                <div className="bg-gray-600 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full" style={{ width: `${goalProgress}%` }}></div>
                </div>
              </div>
              
              {/* Show specific requirements */}
              <div className="mt-3 text-xs">
                <div className="text-gray-400 mb-1">Requirements:</div>
                <div className="flex gap-2 flex-wrap">
                  {getRequirementBadges(currentBreakthrough)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Breakthrough History */}
      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {breakthroughs.map(breakthrough => (
          <div 
            key={breakthrough.id}
            className={`breakthrough bg-gray-700 rounded-lg p-4 mb-3 ${
              breakthrough.unlocked 
                ? `border-l-4 ${getBreakthroughTypeColor(breakthrough.type).split(' ')[0]}` 
                : 'opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {breakthrough.unlocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${getBreakthroughTypeColor(breakthrough.type).split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                <h4 className={`text-base font-medium ${breakthrough.unlocked ? '' : 'text-gray-400'}`}>
                  {breakthrough.name}
                </h4>
              </div>
              
              {/* Educational tooltip for each breakthrough */}
              {(() => {
                const educationalContent = getBreakthroughEducationalContent(breakthrough.id);
                return (
                  <EducationalTooltip
                    content={
                      <div className="space-y-4 max-w-md">
                        <div>
                          <h3 className="font-bold text-lg mb-2">{educationalContent.title}</h3>
                          <p className="text-sm">{educationalContent.description}</p>
                        </div>
                        
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                          <h4 className="font-semibold text-blue-300 mb-2">Real World Example</h4>
                          <p className="text-sm text-blue-100">{educationalContent.realWorldExample}</p>
                        </div>
                        
                        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                          <h4 className="font-semibold text-green-300 mb-2">How to Improve:</h4>
                          <p className="text-sm text-green-100">{educationalContent.howToImprove}</p>
                        </div>
                        
                        <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                          <h4 className="font-semibold text-purple-300 mb-2">Industry Impact</h4>
                          <p className="text-sm text-purple-100">{educationalContent.industryImpact}</p>
                        </div>
                        
                        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3">
                          <h4 className="font-semibold text-amber-300 mb-2">Resource Connection</h4>
                          <p className="text-sm text-amber-100">{educationalContent.resourceConnection}</p>
                        </div>
                      </div>
                    }
                    resourceColor={breakthrough.unlocked ? "green-400" : "gray-400"}
                    buttonPosition="inline"
                  >
                    <InfoIcon className={`h-4 w-4 cursor-pointer ${
                      breakthrough.unlocked ? 'text-green-400' : 'text-gray-400'
                    }`} />
                  </EducationalTooltip>
                );
              })()}
            </div>
            
            {breakthrough.unlocked ? (
              <>
                <p className="text-sm text-gray-300 ml-7">{breakthrough.description}</p>
                <div className="ml-7 mt-2 bg-gray-600 rounded p-2 text-xs text-gray-300">
                  <span className={`font-medium ${getBreakthroughTypeColor(breakthrough.type).split(' ')[1]}`}>
                    🔍 Real World Parallel:
                  </span> {breakthrough.realWorldParallel}
                </div>
                <div className="ml-7 mt-2 text-xs flex gap-2">
                  {getRequirementBadges(breakthrough)}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 ml-7">
                Unlock this breakthrough by advancing your AI's capabilities.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

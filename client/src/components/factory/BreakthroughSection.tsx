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
        howToImprove: "Focus on Algorithm research investments. This breakthrough requires Algorithm Level 2 - click on the Algorithm section and upgrade 'Algorithm Architectures' to develop more sophisticated neural network designs. The transformer breakthrough unlocks when your AI research advances sufficiently.",
        industryImpact: "Transformers revolutionized AI by enabling models to process long sequences efficiently, making modern conversational AI and large language models possible. This single architectural innovation underpins the entire current AI revolution.",
        resourceConnection: "Algorithm-focused breakthrough that enhances how your AI processes information across all domains."
      },
      2: { // Unsupervised Pre-training
        title: "Unsupervised Pre-training",
        description: "A training methodology where AI learns language patterns from vast amounts of text without needing human-labeled examples. The AI discovers grammar, facts, reasoning patterns, and world knowledge simply by predicting the next word in billions of sentences.",
        realWorldExample: "GPT models are trained on hundreds of billions of words from books, websites, and articles. The AI learns to complete sentences like 'The capital of France is...' by seeing this pattern millions of times, without being explicitly taught geography.",
        howToImprove: "Invest heavily in Data Quality and Data Quantity. This breakthrough requires Data Level 2 - click on the Data section and upgrade both 'Data Quality' and 'Data Quantity' options. Larger and more varied datasets lead to better unsupervised learning capabilities.",
        industryImpact: "Unsupervised pre-training enables AI to learn from the entire internet, acquiring broad knowledge without expensive human annotation. This made large-scale AI development economically viable and unlocked general-purpose AI capabilities.",
        resourceConnection: "Data-centric breakthrough that improves learning efficiency from all your data sources."
      },
      3: { // Massive Parameter Scaling
        title: "Massive Parameter Scaling",
        description: "Dramatically increasing the number of parameters (learnable weights) in AI models from millions to billions. More parameters allow AI to memorize more patterns, facts, and capabilities, leading to emergent abilities that smaller models cannot achieve.",
        realWorldExample: "GPT-3 with 175 billion parameters showed capabilities that GPT-2 (1.5B parameters) couldn't match - like few-shot learning, basic reasoning, and code generation. The scale itself unlocked new emergent behaviors.",
        howToImprove: "Requires massive Compute investments. This breakthrough needs Compute Level 3 - click on the Compute section and upgrade 'Electricity', 'Hardware', and 'Regulations' to support training larger models. More compute capacity enables handling billions of parameters effectively.",
        industryImpact: "Scaling laws revealed that bigger models consistently perform better, driving an industry arms race for compute resources. Companies now spend hundreds of millions on single training runs to achieve state-of-the-art performance.",
        resourceConnection: "Compute-intensive breakthrough that multiplies the effectiveness of your data and algorithms through sheer scale."
      },
      4: { // Few-Shot Learning
        title: "Few-Shot Learning",
        description: "The ability of AI to learn new tasks from just a few examples provided in the prompt, without additional training. Large-scale models develop this capability as an emergent property of having seen millions of diverse examples during training.",
        realWorldExample: "You can ask GPT-4 to translate between languages it wasn't specifically trained for by showing just 2-3 example translations in your prompt. The model generalizes from these few examples to handle new cases correctly.",
        howToImprove: "Requires balanced Algorithm Level 3 and Data Level 3 investments. Click on the Algorithm section to upgrade 'Algorithm Architectures' and the Data section to upgrade both data options. The interaction between advanced algorithms and rich data enables few-shot capabilities.",
        industryImpact: "Few-shot learning made AI systems incredibly versatile, eliminating the need to train separate models for each task. This breakthrough enabled general-purpose AI assistants and dramatically reduced AI deployment costs.",
        resourceConnection: "Combined breakthrough requiring both algorithm sophistication and data diversity to enable flexible task adaptation."
      },
      5: { // Instruction Tuning
        title: "Instruction Tuning",
        description: "Fine-tuning AI models to follow human instructions more reliably and safely. This process trains AI to understand and execute commands while aligning with human values and intentions, making AI systems more helpful and controllable.",
        realWorldExample: "ChatGPT and Claude use instruction tuning to follow commands like 'Explain quantum physics to a 10-year-old' or 'Write a professional email declining a job offer.' Without this training, models would just continue text rather than follow instructions.",
        howToImprove: "Focus on Algorithm Level 4 - click on the Algorithm section and continue upgrading 'Algorithm Architectures' to develop more sophisticated training techniques. Instruction tuning requires advanced algorithmic methods for alignment and safety.",
        industryImpact: "Instruction tuning transformed AI from text completion tools into practical assistants. This breakthrough enabled the transition from research curiosities to consumer-ready AI products used by millions.",
        resourceConnection: "Algorithm-focused breakthrough that enhances AI's ability to understand and follow human intentions across all interactions."
      },
      6: { // Multimodal Integration
        title: "Multimodal Integration",
        description: "Enabling AI to process and understand multiple types of data simultaneously - text, images, audio, and video. This creates AI systems that can reason about visual scenes, understand diagrams, and connect information across different modalities.",
        realWorldExample: "GPT-4 with vision can analyze charts, explain memes, read handwritten notes, and describe images in detail. DALL-E creates images from text descriptions. These models understand connections between visual and textual information.",
        howToImprove: "Requires both Compute Level 4 and Data Level 4. Click on the Compute section to upgrade all compute options and the Data section to upgrade all data options. Multimodal models need massive computational resources and diverse datasets for comprehensive training.",
        industryImpact: "Multimodal AI enables applications like AI-powered design tools, medical image analysis, autonomous vehicles, and educational assistants that can understand visual materials and real-world contexts.",
        resourceConnection: "Combined breakthrough leveraging both computational power and diverse data types to create more comprehensive AI understanding."
      },
      7: { // Advanced Reasoning
        title: "Advanced Reasoning",
        description: "AI's ability to break down complex problems into logical steps, perform multi-step reasoning, and solve problems requiring planning and abstract thinking. This represents a major leap toward human-like cognitive capabilities.",
        realWorldExample: "Current AI models like GPT-4 can solve multi-step math problems, write detailed code with complex logic, and reason through legal cases. Future systems will extend this to novel scientific discoveries, complex engineering designs, and strategic business planning across multiple domains.",
        howToImprove: "Requires balanced Algorithm Level 5 and Data Level 5. Click on both Algorithm and Data sections to continue upgrading all available options. Advanced reasoning emerges from sophisticated architectures trained on diverse reasoning examples - mathematical proofs, logical puzzles, and complex problem-solving scenarios.",
        industryImpact: "Advanced reasoning enables AI to tackle complex scientific research, engineering design, strategic planning, and other high-level cognitive tasks currently requiring human experts. This capability bridges the gap between current AI assistants and true artificial general intelligence.",
        resourceConnection: "Combined breakthrough requiring both algorithmic sophistication and diverse reasoning datasets to enable complex problem-solving capabilities."
      },
      8: { // Self-Improvement Capabilities
        title: "Self-Improvement Capabilities",
        description: "AI systems that can analyze and improve their own code, architecture, and algorithms. This represents a potential acceleration point where AI development becomes self-reinforcing, with AI helping to design better AI.",
        realWorldExample: "Early examples include AI systems that can write and optimize their own code, like AlphaCode for programming competitions. Future systems might automatically optimize neural network architectures, improve training algorithms, or design more efficient hardware configurations for AI workloads.",
        howToImprove: "Focus intensively on Algorithm Level 6. Click on the Algorithm section and maximize all algorithm upgrades. Self-improvement requires the most advanced algorithmic techniques for self-analysis, code generation, and architectural optimization. This is primarily an algorithm-driven capability requiring sophisticated meta-learning approaches.",
        industryImpact: "Self-improving AI could accelerate technological progress across all fields, potentially leading to rapid advances in science, engineering, and AI capabilities themselves. This breakthrough represents a critical threshold that could fundamentally change the pace of technological development.",
        resourceConnection: "Algorithm-centric breakthrough that could fundamentally accelerate all future AI development and technological progress."
      },
      9: { // Advanced Tool Use
        title: "Advanced Tool Use",
        description: "AI systems that can effectively use external tools, APIs, databases, and services to extend their capabilities beyond their training. This enables AI to interact with the real world and access up-to-date information and specialized functions.",
        realWorldExample: "Current examples include ChatGPT with plugins, Claude with computer use capabilities, and GitHub Copilot integrating with development environments. Advanced versions will autonomously coordinate multiple tools, manage complex workflows, and interact with real-world systems safely and effectively.",
        howToImprove: "Requires Algorithm Level 7 and Compute Level 6. Click on both Algorithm and Compute sections to upgrade all available options. Tool use demands sophisticated algorithms for planning and coordination, plus substantial compute for managing multiple simultaneous interactions with external systems.",
        industryImpact: "Advanced tool use enables AI to become autonomous agents capable of handling complex real-world tasks, potentially automating entire workflows across industries and enabling new forms of human-AI collaboration in professional environments.",
        resourceConnection: "Combined breakthrough requiring algorithmic sophistication for coordination and compute power for managing complex external interactions."
      },
      10: { // General Problem Solving (AGI)
        title: "General Problem Solving (AGI)",
        description: "The ability to solve novel problems across any domain without domain-specific training. This represents true artificial general intelligence - AI that can learn, reason, and adapt to completely new situations as effectively as humans.",
        realWorldExample: "AGI would enable an AI system to excel at scientific research, creative writing, strategic planning, interpersonal communication, and physical manipulation tasks without being specifically trained for each domain.",
        howToImprove: "Requires Algorithm Level 8, Data Level 7, and Compute Level 7. Click on all three resource sections (Algorithm, Data, Compute) and maximize every upgrade option. AGI represents the culmination of all three pillars - the most advanced algorithms, comprehensive data from all domains, and massive computational resources.",
        industryImpact: "AGI represents the ultimate goal of AI research - systems that match or exceed human cognitive abilities across all domains. This breakthrough could transform every aspect of human civilization and scientific progress.",
        resourceConnection: "Ultimate combined breakthrough requiring mastery of all three pillars: algorithms, data, and compute working in perfect harmony to achieve human-level general intelligence."
      },
      11: { // Continuous Learning & Live Personalization
        title: "Continuous Learning & Live Personalization",
        description: "AI systems that continuously learn and adapt from every user interaction while preserving privacy through federated learning techniques. This enables highly personalized experiences without centralizing sensitive user data.",
        realWorldExample: "Future AI assistants will learn your work patterns, communication style, and preferences over time, becoming increasingly helpful while keeping your data local. Think of an AI that learns you prefer brief emails on Mondays but detailed explanations on complex topics.",
        howToImprove: "Requires Algorithm Level 5 and Data Level 5. Click on both Algorithm and Data sections to upgrade all available options. Continuous learning requires sophisticated algorithms for online learning and diverse data formats to enable personalization across different user types.",
        industryImpact: "Continuous learning enables AI to provide increasingly valuable services while addressing privacy concerns. This breakthrough makes AI more useful while maintaining user trust, potentially unlocking mass adoption of AI assistants.",
        resourceConnection: "Combined breakthrough leveraging advanced algorithms and diverse data to enable privacy-preserving personalization."
      },
      12: { // Neuro-Symbolic Reasoning
        title: "Neuro-Symbolic Reasoning",
        description: "Hybrid AI systems combining the pattern recognition power of neural networks with the logical precision of symbolic reasoning. This creates AI that can provide verified, provable results for critical applications.",
        realWorldExample: "A medical diagnosis AI that not only recognizes symptoms from medical images but can also explain its reasoning with formal logic, providing doctors with both the diagnosis and a verifiable chain of reasoning. This reduces AI hallucinations and enables use in high-stakes decisions.",
        howToImprove: "Requires Algorithm Level 6 and Data Level 6. Click on both Algorithm and Data sections to continue upgrading. Neuro-symbolic systems need advanced algorithms to bridge neural and symbolic systems, plus structured data formats that support formal reasoning.",
        industryImpact: "Neuro-symbolic AI enables deployment in safety-critical applications like healthcare, autonomous vehicles, and financial systems where explainability and correctness are essential. This breakthrough addresses the 'AI black box' problem.",
        resourceConnection: "Combined breakthrough requiring sophisticated algorithms and structured data to bridge intuitive understanding with logical precision."
      },
      13: { // World Models for Planning
        title: "World Models for Planning",
        description: "AI systems that build internal models of how the world works, enabling them to simulate and test strategies before acting. This unlocks AI applications in robotics, autonomous systems, and complex planning scenarios.",
        realWorldExample: "An autonomous robot that can mentally simulate different paths through a cluttered room before moving, or an AI urban planner that can model traffic patterns and test infrastructure changes in simulation before proposing real-world implementations.",
        howToImprove: "Requires Compute Level 6 and Data Level 6. Click on both Compute and Data sections to maximize upgrades. World models need massive computational resources for complex simulations and diverse data sources to accurately model real-world physics and behaviors.",
        industryImpact: "World models enable AI to work safely in physical environments and complex planning scenarios. This breakthrough opens applications in robotics, autonomous vehicles, scientific simulation, and strategic planning across industries.",
        resourceConnection: "Combined breakthrough leveraging compute power and diverse data to enable sophisticated simulation and planning capabilities."
      },
      14: { // Verified Self-Improvement
        title: "Verified Self-Improvement",
        description: "AI systems capable of safely improving their own capabilities with formal mathematical guarantees that each change is beneficial. This enables recursive self-improvement while preventing degradation or unsafe modifications.",
        realWorldExample: "An AI system that can automatically optimize its own neural network architecture, improve its training algorithms, or enhance its reasoning capabilities, but only after mathematically proving each change will improve performance without introducing risks.",
        howToImprove: "Requires Algorithm Level 7 and Compute Level 6. Click on both Algorithm and Compute sections to maximize all upgrades. Verified self-improvement demands the most advanced algorithmic techniques for formal verification plus massive compute resources for testing and validation.",
        industryImpact: "Verified self-improvement could accelerate AI development while maintaining safety. This breakthrough represents a potential inflection point where AI progress becomes self-reinforcing, leading to rapid advances across all technological domains.",
        resourceConnection: "Combined breakthrough requiring cutting-edge algorithms and massive compute to enable safe recursive self-improvement."
      },
      15: { // Agentic Autonomy & Orchestration
        title: "Agentic Autonomy & Orchestration",
        description: "AI systems that can coordinate teams of specialized AI agents, each with different capabilities, to tackle complex multi-step challenges requiring distributed intelligence and collaborative problem-solving.",
        realWorldExample: "An AI system managing a research project by coordinating specialist AIs for literature review, experimental design, data analysis, and paper writing, with each agent contributing their expertise while a coordinator agent manages the overall workflow and ensures quality.",
        howToImprove: "Requires Algorithm Level 8, Compute Level 7, and Data Level 7. Click on all three resource sections and maximize every upgrade. Multi-agent coordination requires the most sophisticated algorithms, massive compute for parallel agent operation, and comprehensive data across all specialist domains.",
        industryImpact: "Agentic autonomy enables AI to handle complex real-world projects that require diverse expertise and coordinated action. This breakthrough could automate entire workflows in research, engineering, business strategy, and other domains requiring multi-disciplinary collaboration.",
        resourceConnection: "Ultimate combined breakthrough requiring mastery of all three pillars to enable sophisticated multi-agent coordination and autonomous workflow management."
      },
      16: { // Chain-of-Thought Reasoning
        title: "Chain-of-Thought Reasoning",
        description: "AI systems that can think step-by-step through complex problems, showing their reasoning process before arriving at answers. This dramatically improves accuracy on logic, math, and complex reasoning tasks by mimicking how humans break down difficult problems.",
        realWorldExample: "OpenAI's o1 models pause to think through problems systematically, like a student working through a math problem step-by-step on paper. For example, when asked 'If a train travels 60 mph for 2.5 hours, how far does it go?', the AI shows: Step 1: Speed = 60 mph, Step 2: Time = 2.5 hours, Step 3: Distance = Speed × Time = 60 × 2.5 = 150 miles.",
        howToImprove: "Requires Algorithm Level 5 and Compute Level 4. Focus on maximizing Algorithm research for sophisticated reasoning capabilities, then upgrade Compute infrastructure to handle the increased processing demands of step-by-step thinking.",
        industryImpact: "Chain-of-thought reasoning enables AI to tackle complex problems requiring multi-step analysis, from scientific research to legal reasoning to strategic planning. This breakthrough makes AI more reliable and explainable in high-stakes applications.",
        resourceConnection: "Combined breakthrough leveraging advanced algorithms for reasoning logic and substantial compute power for deliberate thinking processes."
      },
      17: { // Reinforcement Learning Training
        title: "Reinforcement Learning Training", 
        description: "AI systems that learn through trial and error, improving their performance through practice and feedback. Like humans learning to play a sport or instrument, the AI gets better by trying different approaches and learning from successes and failures.",
        realWorldExample: "AlphaGo defeated world champions by playing millions of games against itself, learning strategies no human had discovered. Similarly, modern AI uses reinforcement learning to improve reasoning by practicing on thousands of problems and learning from mistakes.",
        howToImprove: "Requires Algorithm Level 4 and Data Level 4. Upgrade Algorithm research to develop sophisticated learning techniques, then enhance Data systems to provide rich feedback signals for the AI to learn from during practice sessions.",
        industryImpact: "Reinforcement learning enables AI to improve continuously, making it ideal for dynamic environments like robotics, game playing, financial trading, and personalized recommendations where optimal strategies must be discovered through experience.",
        resourceConnection: "Combined breakthrough using advanced algorithms for learning strategies and comprehensive data for providing learning feedback signals."
      },
      18: { // Next-Generation Computing Hardware
        title: "Next-Generation Computing Hardware",
        description: "Cutting-edge processors and accelerators specifically designed for AI calculations, providing massive speedups for training and running AI models. These specialized chips can perform AI operations hundreds of times faster than general-purpose processors.",
        realWorldExample: "NVIDIA's latest GPU architectures like Blackwell and Hopper are specifically designed for AI, with features like transformer engines that accelerate language model training. A single modern AI chip can replace hundreds of older processors for AI workloads.",
        howToImprove: "Requires Compute Level 5. Focus entirely on maximizing your Compute infrastructure investments, particularly in Hardware upgrades. Next-generation chips become available once you've demonstrated serious commitment to compute infrastructure.",
        industryImpact: "Advanced AI hardware dramatically reduces the cost and time required for AI development, making previously impossible AI applications economically viable. This hardware enables real-time AI processing for autonomous vehicles, instant language translation, and large-scale AI deployment.",
        resourceConnection: "Pure compute breakthrough that unlocks the hardware foundation needed for the most demanding AI applications."
      },
      19: { // AI-Generated Training Data
        title: "AI-Generated Training Data",
        description: "AI systems that can create their own high-quality training examples, extending far beyond what's available on the internet. As the web's text becomes exhausted, AI generates new synthetic data that's carefully filtered and verified for training even more advanced systems.",
        realWorldExample: "When training data from the internet becomes limited, AI systems can generate millions of math problems, coding exercises, reasoning puzzles, and specialized domain content. This synthetic data is then filtered and verified to ensure quality, creating endless training opportunities.",
        howToImprove: "Requires Data Level 5 and Algorithm Level 4. Maximize Data infrastructure to handle massive synthetic data generation and processing, then upgrade Algorithm capabilities to intelligently create and filter high-quality synthetic examples.",
        industryImpact: "AI-generated training data enables continuous improvement beyond internet-scale data, allowing AI to develop expertise in specialized domains where human-created examples are scarce. This breakthrough enables AI advancement in niche fields like advanced mathematics, specialized science, and novel creative domains.",
        resourceConnection: "Combined breakthrough leveraging sophisticated data systems for synthetic content generation and advanced algorithms for intelligent data creation and filtering."
      },
      20: { // AI Team Coordination
        title: "AI Team Coordination",
        description: "Multiple specialized AI assistants working together as a coordinated team, with each AI handling different aspects of complex problems. Like a human project team, different AIs contribute their expertise while a coordinator ensures quality and manages the overall workflow.",
        realWorldExample: "An AI research team might include one AI for literature review, another for experimental design, a third for data analysis, and a fourth for writing, with a coordinator AI managing the project timeline and ensuring all work integrates properly to produce high-quality research papers.",
        howToImprove: "Requires Algorithm Level 6 and Compute Level 5. This advanced breakthrough demands cutting-edge Algorithm research for multi-agent coordination, plus substantial Compute infrastructure to run multiple AI systems simultaneously and coordinate their interactions.",
        industryImpact: "AI team coordination enables tackling complex, multi-faceted problems that require diverse expertise and sustained collaboration. This breakthrough could automate entire professional workflows in consulting, research, engineering, and strategic planning.",
        resourceConnection: "Advanced combined breakthrough requiring sophisticated algorithms for multi-agent orchestration and massive compute resources for parallel AI system operation."
      },
      21: { // Pocket-Sized AI
        title: "Pocket-Sized AI",
        description: "Powerful AI assistants that run directly on smartphones, laptops, and consumer devices, providing instant responses while keeping all data completely private. No internet connection required - the AI lives entirely on your device.",
        realWorldExample: "Imagine having ChatGPT-level AI running directly on your phone, answering questions instantly even in airplane mode, helping with tasks without sending any data to the cloud. Your conversations, documents, and queries stay completely private on your device.",
        howToImprove: "Requires Algorithm Level 5 and Data Level 4. Focus on Algorithm research to develop efficient model architectures that can run on limited hardware, then enhance Data systems to enable effective training of these compact but powerful models.",
        industryImpact: "Edge AI eliminates privacy concerns, reduces cloud costs, and enables AI assistance anywhere without internet connectivity. This breakthrough makes AI truly ubiquitous while addressing growing privacy concerns about cloud-based AI services.",
        resourceConnection: "Combined breakthrough using efficient algorithms to create compact models and optimized data processing to enable powerful AI in resource-constrained environments."
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

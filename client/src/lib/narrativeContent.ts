// UNIFIED TUTORIAL SYSTEM - Single source of truth for all tutorial and narrative content
export const tutorialContent = {
  // Phase 1: Welcome & First Steps
  PHASE_1: {
    1: {
      title: "Welcome to AI Factory!",
      content: "Hello! I'm Spark, your AI advisor. Our goal is to build the world's first AGI! Let's start by creating your first neural network.",
      context: "You're about to create your first neural network! In the real world, this is like the 'Hello, World!' of AI.",
      action: "Click 'Start Game' to begin your AI journey",
      targetElement: null,
      modalStyle: true,
      icon: "spark"
    },
    2: {
      title: "The Three Pillars of AI",
      content: "Excellent! We have a basic AI, but to make it truly intelligent, we need three key ingredients working together: Compute, Data, and Algorithms.",
      context: "Just like a human needs a brain (compute), knowledge (data), and thinking methods (algorithms), AI requires all three elements.",
      action: "Let's explore each pillar",
      targetElement: null,
      modalStyle: true,
      icon: "lightbulb"
    }
  },

  // Phase 2: Learning the Three Pillars
  PHASE_2: {
    1: {
      title: "Pillar 1: Compute Power",
      content: "This is **Compute** - the raw brainpower of our AI. Think of it as the data centers filled with powerful GPUs that train and run AI models.",
      context: "Companies like Google and NVIDIA build massive data centers! More compute means faster AI training and better performance. GPT-4 required enormous computational resources.",
      action: "Click on the Compute Factory section to explore",
      targetElement: "compute-factory-card",
      modalStyle: false,
      icon: "cpu",
      nextTarget: "compute-level-upgrade"
    },
    2: {
      title: "Invest in Compute Infrastructure", 
      content: "Perfect! Now invest your starting funds to upgrade your Compute Level. This is essential for meeting training prerequisites.",
      context: "Real AI companies spend millions on compute infrastructure. OpenAI spent over $100M on computing resources for GPT-4.",
      action: "Click the 'Invest $100' button to upgrade compute",
      targetElement: "compute-level-upgrade", 
      modalStyle: false,
      icon: "cpu"
    },
    3: {
      title: "Pillar 2: High-Quality Data",
      content: "Excellent! Next is **Data** - the knowledge our AI learns from. AI learns patterns from massive datasets of text, images, and other information.",
      context: "GPT models were trained on hundreds of billions of words from books, websites, and articles. Quality data is crucial for intelligent AI.",
      action: "Click on the Data Factory section",
      targetElement: "data-factory-card",
      modalStyle: false,
      icon: "database",
      nextTarget: "data-quality-upgrade"
    },
    4: {
      title: "Improve Data Quality",
      content: "Great! Now invest in better data curation. High-quality, diverse data makes your AI more reliable and capable.",
      context: "Companies spend enormous effort on data cleaning and curation. The quality of training data directly impacts AI capabilities.",
      action: "Click to invest in data quality improvements",
      targetElement: "data-quality-upgrade",
      modalStyle: false,
      icon: "database"
    },
    5: {
      title: "Pillar 3: Smart Algorithms",
      content: "Finally, **Algorithms** - the 'teaching methods' that help AI learn efficiently. These are the breakthrough techniques that make AI possible.",
      context: "Breakthroughs like the Transformer architecture (from 'Attention Is All You Need') revolutionized AI and enabled models like GPT and BERT.",
      action: "Click on the Algorithm Lab section",
      targetElement: "algorithm-factory-card", 
      modalStyle: false,
      icon: "cog",
      nextTarget: "algorithm-architecture-upgrade"
    },
    6: {
      title: "Research Better Algorithms",
      content: "Perfect! Invest in algorithm research to unlock powerful new AI architectures and training techniques.",
      context: "Algorithm improvements often have the biggest impact. The Transformer architecture enabled the entire modern AI revolution.",
      action: "Click to invest in algorithm improvements",
      targetElement: "algorithm-architecture-upgrade",
      modalStyle: false,
      icon: "cog"
    }
  },

  // Phase 3: Understanding Progression
  PHASE_3: {
    1: {
      title: "Your AI Development Dashboard",
      content: "Excellent progress! Now let's see how these investments translate into AI capability. Check your Dashboard to see your intelligence growing.",
      context: "Intelligence represents your AI's overall capability - like an IQ score for artificial minds. Higher intelligence unlocks new possibilities.",
      action: "Click on the Dashboard tab to see your progress",
      targetElement: "dashboard-tab",
      modalStyle: false,
      icon: "trending-up",
      highlightTab: "dashboard"
    },
    2: {
      title: "The Path to AGI", 
      content: "This shows your progression toward Artificial General Intelligence. Each era represents a major milestone, like GPT-2 → GPT-3 → GPT-4.",
      context: "The journey mirrors real AI development - from basic language models to systems approaching human-level reasoning across domains.",
      action: "Explore the Progression tab to see your AGI roadmap",
      targetElement: "progression-tab",
      modalStyle: false,
      icon: "target",
      highlightTab: "progression"
    },
    3: {
      title: "Strategic Funding and Revenue",
      content: "Important economic lesson! GNT-3 training costs $25,000, plus you'll need to build platforms (API $8K, eventually Chatbot $15K) to generate revenue. Series A ($5,000) covers only part of this - you must generate revenue from early customers.",
      context: "This mirrors real AI development - startups raise funding rounds (Seed→Series A→Series B) but must quickly build products that generate revenue. Companies like OpenAI had to monetize GPT-3 through APIs to fund GPT-4 development!",
      action: "Check the Economy tab to see funding and revenue options",
      targetElement: "economy-tab",
      modalStyle: false, 
      icon: "dollar-sign",
      highlightTab: "economy"
    }
  },

  // Phase 4: Advanced Concepts  
  PHASE_4: {
    1: {
      title: "The AI Economics Model",
      content: "Here's the economic reality! To reach GNT-3, you need: $25K for training + $8K for API platform = $33K total, but Series A only gives $5K. For GNT-4: $100K training + $15K chatbot platform = $115K, while Series B gives $25K. The gap is filled by customer revenue!",
      context: "Real AI companies raise funding to kickstart operations, but must quickly monetize through products. OpenAI had to generate millions in API revenue to afford GPT-4's $100M+ training costs. Venture capital alone isn't enough - you need paying customers.",
      action: "Click on Training to see requirements and costs",
      targetElement: "training-panel", 
      modalStyle: false,
      icon: "target"
    },
    2: {
      title: "Training Runs: The Path to AGI",
      content: "Now you understand the economic model! Training Runs are expensive computational efforts that advance your AI. You'll need to balance funding rounds with revenue from customers to afford the escalating costs of each era.",
      context: "Real training runs can take weeks or months, consuming enormous compute power. GPT-4's training likely cost over $100 million - requiring both venture funding and product revenue to finance.",
      action: "Explore the training requirements and begin your AGI journey",
      targetElement: "training-panel",
      modalStyle: false,
      icon: "zap"
    },
    3: {
      title: "Tutorial Complete!",
      content: "Outstanding! You now understand the fundamentals of AI development. Continue investing, researching, and training to achieve AGI!",
      context: "You're now ready to explore advanced strategies: balancing resources, managing compute capacity, timing training runs, and scaling revenue.",
      action: "Begin your journey to AGI!",
      targetElement: null,
      modalStyle: true,
      icon: "trophy"
    }
  }
};

export const narrative = {
  
  // Breakthroughs (keyed by breakthrough ID)
  BREAKTHROUGH_1: {
    title: "Breakthrough: Transformer Architecture!",
    content: "Outstanding work! Our algorithm research has paid off. We've developed the Transformer Architecture, which will revolutionize how our AI understands language.",
    context: "This mirrors the 2017 'Attention Is All You Need' paper that enabled models like GPT, BERT, and modern language AI."
  },
  
  BREAKTHROUGH_2: {
    title: "Breakthrough: Advanced Training Techniques!",
    content: "Incredible! We've discovered new training methods that make our AI learn more efficiently and with better results.",
    context: "Techniques like reinforcement learning from human feedback (RLHF) helped make ChatGPT safe and helpful."
  },
  
  BREAKTHROUGH_3: {
    title: "Breakthrough: Neural Architecture Search!",
    content: "Amazing! We've automated the process of designing better neural networks. Our AI can now improve its own architecture.",
    context: "Companies like Google use AutoML to automatically discover network architectures that outperform human-designed ones."
  },
  
  BREAKTHROUGH_16: {
    title: "Breakthrough: Chain-of-Thought Reasoning!",
    content: "Incredible! Our AI now thinks step-by-step before answering, just like how humans approach complex problems. This dramatically improves accuracy on math, logic, and coding tasks!",
    context: "This mirrors OpenAI's o1 reasoning models that pause to think through problems systematically, achieving much higher success rates on challenging tasks.",
    speaker: "spark"
  },
  
  BREAKTHROUGH_17: {
    title: "Breakthrough: Reinforcement Learning Training!",
    content: "Outstanding! We've mastered reinforcement learning - our AI can now learn from trial and error, getting better through practice and feedback!",
    context: "Modern AI systems use reinforcement learning to improve reasoning abilities, similar to how humans learn skills through repetition and feedback.",
    speaker: "spark"
  },
  
  BREAKTHROUGH_18: {
    title: "Breakthrough: Next-Generation Computing Hardware!",
    content: "Phenomenal! We've upgraded to cutting-edge hardware that processes AI calculations dramatically faster and more efficiently. The future is here!",
    context: "Advanced GPU architectures like NVIDIA's Blackwell series provide massive speedups for AI development, making previously impossible projects feasible.",
    speaker: "spark"
  },
  
  BREAKTHROUGH_19: {
    title: "Breakthrough: AI-Generated Training Data!",
    content: "Revolutionary! Our AI can now create its own high-quality training examples, extending far beyond what's available on the internet!",
    context: "As internet text becomes limited, AI systems generate synthetic training data that's carefully filtered and verified, opening new frontiers for learning.",
    speaker: "spark"
  },
  
  BREAKTHROUGH_20: {
    title: "Breakthrough: AI Team Coordination!",
    content: "Remarkable! Multiple AI assistants can now work together as a team, checking each other's work and solving complex problems through collaboration!",
    context: "Multi-agent AI systems where different AIs specialize in planning, execution, and verification achieve much higher success rates on complex enterprise tasks.",
    speaker: "spark"
  },
  
  BREAKTHROUGH_21: {
    title: "Breakthrough: Pocket-Sized AI!",
    content: "Amazing! Powerful AI assistants now run directly on smartphones and laptops, providing instant, private responses without needing the cloud!",
    context: "Edge AI enables fast, private assistance while reducing costs and improving user experience through on-device processing capabilities.",
    speaker: "spark"
  },
  
  // Era Advancements (keyed by the new Era)
  ERA_ADVANCE_GNT2: {
    title: "We're in a New Era: GNT-2!",
    content: "Congratulations! Our AI has reached the GNT-2 era. It's now capable of more sophisticated reasoning and can handle complex tasks.",
    context: "This represents the leap from basic language models to more capable systems that can engage in meaningful dialogue."
  },
  
  ERA_ADVANCE_GNT3: {
    title: "🚀 New Era: GNT-3 Unlocked!",
    content: "Remarkable! Our AI has reached GNT-3 capabilities. Most exciting: **API Services are now available!** Companies can integrate your AI into their applications for B2B revenue.",
    context: "GPT-3's 175B parameters established 'scaling laws' and launched the API economy. Real companies now generate millions from AI API services. Check your Economy tab to enable this new revenue stream!"
  },
  
  ERA_ADVANCE_GNT4: {
    title: "🎯 New Era: GNT-4 Unlocked!",
    content: "Extraordinary! We've reached GNT-4 capabilities with sophisticated reasoning and creativity. **Chatbot Services are now available!** Create consumer subscriptions like ChatGPT Plus.",
    context: "GPT-4's leap enabled consumer AI assistants. ChatGPT Plus generates hundreds of millions in subscription revenue. Enable Chatbot Services in the Economy tab to start building your consumer base!"
  },
  
  ERA_ADVANCE_AGI: {
    title: "🏆 HISTORIC BREAKTHROUGH: AGI ACHIEVED! 🏆",
    content: "**EXTRAORDINARY ACHIEVEMENT!** You've successfully built the world's first Artificial General Intelligence! Your AI now matches human-level performance across ALL cognitive domains - reasoning, creativity, learning, and adaptation.",
    context: "This is the ultimate milestone in AI development! You've balanced the three pillars perfectly: massive compute power, high-quality data, and breakthrough algorithms. In the real world, achieving AGI would represent the most significant technological advancement in human history."
  },
  
  // Investment Milestones
  INVESTMENT_MILESTONE_1M: {
    title: "First Million Invested!",
    content: "Excellent progress! We've invested our first million dollars into the AI infrastructure. This is just the beginning of our journey.",
    context: "Real AI companies often require hundreds of millions in funding. OpenAI raised over $1 billion before achieving breakthrough results."
  },
  
  INVESTMENT_MILESTONE_10M: {
    title: "Ten Million Investment Milestone!",
    content: "Fantastic! We've now invested $10 million into our AI development. We're building serious infrastructure now.",
    context: "At this scale, companies typically have substantial compute clusters and can train models with billions of parameters."
  },
  
  // Revenue Achievements
  REVENUE_FIRST_API: {
    title: "First API Revenue!",
    content: "Success! Developers are now paying to use our AI through our API. We're generating real business value from our research.",
    context: "OpenAI's API business became crucial for funding continued research, creating a virtuous cycle of improvement and revenue."
  },
  
  REVENUE_FIRST_SUBSCRIPTION: {
    title: "First Subscription Revenue!",
    content: "Wonderful! Consumers are now paying monthly subscriptions for our AI chatbot service. We're reaching mainstream users.",
    context: "ChatGPT Plus subscriptions provided stable recurring revenue that helped OpenAI scale their infrastructure."
  },
  
  // Warnings and Guidance
  COMPUTE_WARNING_HIGH: {
    title: "System Strain Detected!",
    content: "Our compute capacity is over 90%! We risk service slowdowns, which will affect our revenue and customer growth. Consider expanding infrastructure.",
    context: "This is a real challenge for AI companies - balancing the cost of infrastructure with computational demands of users."
  },
  
  MONEY_WARNING_LOW: {
    title: "Funding Running Low!",
    content: "We're running low on funds! Focus on revenue-generating activities or we might have to slow down our research progress.",
    context: "AI research is expensive. Even well-funded companies must balance ambitious research with sustainable business models."
  },
  
  TRAINING_FIRST_SUCCESS: {
    title: "First Training Run Complete!",
    content: "Excellent! We've successfully completed our first AI training run. Each training session improves our AI's intelligence.",
    context: "Training runs can take weeks or months for large models, consuming enormous amounts of compute power and electricity."
  },
  
  // Strategic Advice
  ADVICE_BALANCE_RESOURCES: {
    title: "Strategic Advice: Resource Balance",
    content: "I notice we're heavily invested in one area. Consider balancing compute, data, and algorithms for optimal AI development.",
    context: "Successful AI requires all three elements working together. Neglecting any one area creates bottlenecks in overall progress."
  },
  
  ADVICE_REVENUE_FOCUS: {
    title: "Strategic Advice: Revenue Opportunities",
    content: "Our AI capabilities are strong enough to generate revenue! Consider activating API services or subscription offerings.",
    context: "The best AI companies balance research with revenue generation, using profits to fund even more ambitious projects."
  },

  // New Service-Specific Guidance
  API_SERVICE_AVAILABLE: {
    title: "💼 API Services Ready to Launch!",
    content: "Your AI has reached GNT-3 capabilities! **API Services are now unlocked** - enable them in the Economy tab to start generating B2B revenue from companies integrating your AI.",
    context: "Companies pay premium rates for reliable AI APIs. Start with a competitive rate around $1,500/tick and adjust based on demand."
  },

  API_AUTO_ENABLE_SUGGESTION: {
    title: "💡 Enable API Services?",
    content: "I notice you haven't enabled API services yet. This is one of the most important revenue streams for funding your AI development. **Would you like me to enable it for you** with a competitive starting rate?",
    context: "Many successful AI companies generate most of their revenue through API access. Enable now to start building your developer ecosystem."
  },

  CHATBOT_SERVICE_AVAILABLE: {
    title: "👥 Consumer Chatbot Ready!",
    content: "GNT-4 unlocked **Chatbot Services**! Enable consumer subscriptions in the Economy tab. Start with $15-20/month - users will pay for reliable, high-quality AI assistance.",
    context: "ChatGPT Plus and similar services generate massive subscription revenue. Balance price and quality to maximize growth."
  },

  API_OPTIMIZATION_ADVICE: {
    title: "🔧 API Optimization Opportunity",
    content: "Your API service is running but could be optimized! Consider adjusting rates or improving developer tools to maximize revenue without losing customers.",
    context: "Successful API businesses constantly optimize pricing. Monitor usage patterns and adjust rates to find the sweet spot between revenue and adoption."
  },

  CHATBOT_OPTIMIZATION_ADVICE: {
    title: "📈 Chatbot Growth Strategy",
    content: "Your chatbot has subscribers but growth could improve! Consider improving chatbot capabilities or running ad campaigns to accelerate user acquisition.",
    context: "Consumer AI products succeed through quality and marketing. Invest in improvements to reduce churn and attract new users."
  },
  
  // Enhanced Strategic Warnings
  COMPUTE_WARNING_CRITICAL: {
    title: "Critical System Overload!",
    content: "We're completely maxed out on compute! Services are severely degraded and customers are leaving. This is an emergency - we need immediate compute expansion.",
    context: "When AI services go down, users quickly switch to competitors. Reliability is crucial for maintaining market position."
  },
  
  LOW_FUNDS_WARNING: {
    title: "Cash Flow Concern",
    content: "Our bank account is running low. Without funding, we can't afford upgrades or training runs. Consider focusing on revenue streams or seeking investment.",
    context: "AI companies burn through cash quickly due to expensive compute costs. Managing finances is as important as technical progress."
  },
  
  FIRST_TRAINING_COMPLETED: {
    title: "Your First Training Success!",
    content: "Excellent! You've completed your first major training run. Notice how your intelligence score jumped significantly. This is the core loop of AI development.",
    context: "Training runs are expensive but provide the biggest leaps in capability. Each era represents a major milestone in AI development."
  },
  
  FIRST_REVENUE_MILESTONE: {
    title: "Revenue is Flowing!",
    content: "Great work! You're now generating revenue from your AI services. This creates a positive feedback loop - revenue funds better infrastructure, which enables better AI.",
    context: "The transition from research to profitable product is crucial for AI companies. Revenue enables sustainable growth and innovation."
  },
  
  BALANCE_STRATEGY_ADVICE: {
    title: "Strategic Balance Tip",
    content: "Remember: all three resources work together. Compute without data is just expensive heating. Data without algorithms is just storage. Focus on balanced growth.",
    context: "Successful AI companies excel at resource allocation - knowing when to invest in compute, data collection, or research talent."
  },
  
  FUNDING_MILESTONE_ADVICE: {
    title: "Strategic Funding Advice",
    content: "Remember: funding accelerates progress but increases expectations. Use capital wisely on balanced infrastructure growth rather than just one area.",
    context: "Successful AI companies strategically allocate funding across compute, data, and research talent rather than over-investing in single areas."
  },
  
  INVESTMENT_MILESTONE_100M: {
    title: "Major Investment Round!",
    content: "Incredible! You've secured major funding. You're now playing in the big leagues. This level of capital enables ambitious projects and faster scaling.",
    context: "Series A and beyond funding allows AI companies to compete with tech giants, but also brings increased scrutiny and pressure to deliver."
  },
  
  RESEARCH_PROGRESS_SLOW: {
    title: "Algorithm Research Stalling",
    content: "Your research progress has slowed significantly. Consider hiring more research engineers or upgrading your algorithm infrastructure to accelerate breakthroughs.",
    context: "AI research requires dedicated talent and resources. Companies that fall behind in algorithmic innovation struggle to compete."
  },
  
  TRAINING_STRATEGY_HINT: {
    title: "Training Strategy Insight",
    content: "Pro tip: Reserve compute for training during low-revenue periods. Training during peak usage hours means lost revenue. Time your training runs strategically.",
    context: "Real AI companies carefully schedule training runs to minimize impact on customer-facing services while maximizing research progress."
  },

  // Spark Character Dialogue - Tutorial Steps
  TUTORIAL_STEP_1: {
    title: "Welcome to the Factory!",
    content: "Hi there! I'm Spark, your AI advisor. Together, we're going to build the world's first AGI! Let's start by investing in our core infrastructure: Compute.",
    context: "Think of Compute as the raw brainpower for our AI. In the real world, this means massive data centers filled with GPUs and specialized chips.",
    speaker: "spark"
  },
  
  TUTORIAL_STEP_2: {
    title: "Expanding Your Operations",
    content: "Excellent work! Now let's diversify our approach. Click on the Data Factory to start collecting the information our AI needs to learn from.",
    context: "Data is the fuel of AI. Companies like OpenAI trained GPT models on hundreds of billions of tokens from books, websites, and articles.",
    speaker: "spark"
  },
  
  TUTORIAL_STEP_3: {
    title: "The Algorithm Lab",
    content: "Perfect progress! Now we need smart algorithms to process all that compute and data. Open the Algorithm Lab to start researching cutting-edge techniques.",
    context: "Algorithms are the 'recipes' that tell our AI how to think. Breakthroughs like Transformers revolutionized the entire field.",
    speaker: "spark"
  },

  // Spark's Strategic Advice
  SPARK_BREAKTHROUGH_ADVICE: {
    title: "Breakthrough Achieved!",
    content: "Amazing! This breakthrough will unlock new possibilities. Remember, real AI progress comes from combining compute power, quality data, and algorithmic innovation.",
    context: "Each breakthrough represents years of research compressed into game mechanics. These mirror real-world AI milestones.",
    speaker: "spark"
  },

  SPARK_TRAINING_GUIDANCE: {
    title: "Training Run Strategy",
    content: "Pro tip from your AI advisor: Schedule training runs when customer demand is low. This maximizes your learning while minimizing lost revenue!",
    context: "Real AI companies carefully balance research training with customer service demands.",
    speaker: "spark"
  },

  SPARK_SCALING_WISDOM: {
    title: "Scaling Insights",
    content: "You're learning the fundamental truth of AI: scaling compute, data, and algorithms together creates emergent capabilities. This is how we'll reach AGI!",
    context: "Modern AI breakthroughs follow predictable scaling laws discovered by researchers at OpenAI, DeepMind, and others.",
    speaker: "spark"
  },

  // Stuck Detection Guidance from Spark
  STUCK_NO_MONEY_HINT: {
    title: "Financial Strategy Tip",
    content: "I notice you're low on funds and haven't been making revenue. Try enabling the API or Chatbot to start generating income from your current AI capabilities!",
    context: "Revenue generation is crucial for funding further research. Enable customer-facing services to monetize your AI progress.",
    speaker: "spark"
  },

  STUCK_NO_REVENUE_HINT: {
    title: "Revenue Strategy Guidance",
    content: "You have good intelligence but no revenue streams! Enable the API for developers or the Chatbot for consumers to start making money from your AI.",
    context: "Even basic AI capabilities can generate revenue. Companies like OpenAI started monetizing GPT models early in development.",
    speaker: "spark"
  },

  STUCK_TRAINING_BLOCKED_HINT: {
    title: "Training Prerequisites Help",
    content: "Training is blocked? You need sufficient compute capacity, algorithm research progress, and breakthrough unlocks. Focus on whichever prerequisite is missing!",
    context: "Real AI training runs require careful resource planning. Check compute availability, research completeness, and algorithm breakthroughs.",
    speaker: "spark"
  },

  STUCK_NO_BREAKTHROUGHS_HINT: {
    title: "Research Progress Tip",
    content: "Stuck on breakthroughs? Invest in all three pillars (compute, data, algorithms) evenly. Breakthroughs unlock when you reach the required investment levels!",
    context: "AI breakthroughs often require balanced investment across multiple areas, just like how GPT required advances in compute, data, and architecture.",
    speaker: "spark"
  }
};
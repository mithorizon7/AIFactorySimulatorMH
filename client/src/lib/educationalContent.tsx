// This file contains all educational content used in tooltips throughout the game

// Primary Resource Definitions
export const resourceDefinitions = {
  compute: {
    title: "Compute in AI Development",
    description: "Compute represents the raw computational power needed for AI training and inference. In the real world, this includes GPU clusters, TPUs, specialized AI accelerators, and distributed computing infrastructure. Companies like NVIDIA, Google, and specialized AI labs invest billions in compute resources.",
    realWorldExample: "OpenAI's ChatGPT-4 training reportedly used thousands of NVIDIA A100 GPUs, costing millions of dollars in compute resources for a single training run.",
    industryImpact: "Access to compute has become a major competitive advantage in AI development, with some researchers arguing it's more important than algorithmic innovation for certain breakthroughs."
  },
  data: {
    title: "Data in AI Development",
    description: "Data is the foundation of AI learning. Models need diverse, high-quality datasets to develop robust capabilities. This includes text corpora, images, audio, video, and specialized datasets. Quality, diversity, and scale all matter tremendously.",
    realWorldExample: "GPT models were trained on trillions of tokens from the internet, books, scientific papers, and many other sources, creating a broad knowledge base.",
    industryImpact: "Data collection and curation is a massive industry unto itself, with companies specializing in data labeling, synthetic data generation, and data quality assessment."
  },
  algorithm: {
    title: "Algorithms in AI Development",
    description: "Algorithms represent the architectural innovations and mathematical approaches that define how AI systems learn and operate. This includes model architectures, training techniques, optimization methods, and inference strategies.",
    realWorldExample: "The Transformer architecture (introduced in 2017) revolutionized natural language processing and became the foundation for modern language models like GPT, PaLM, and Claude.",
    industryImpact: "While data and compute get significant attention, algorithmic breakthroughs like attention mechanisms and diffusion models have enabled entirely new AI capabilities."
  }
};

// Resource Enabling Inputs
export const enablingInputs = {
  // Compute Enabling Inputs
  money: {
    title: "Financial Investment",
    description: "Financial capital fuels AI development through hardware purchases, talent acquisition, and operational costs. Successful AI projects require significant and sustained funding.",
    realWorldExample: "Developing leading AI models can cost from tens to hundreds of millions of dollars, with ongoing operational costs in the millions per month.",
  },
  electricity: {
    title: "Power Infrastructure",
    description: "AI training requires enormous amounts of electricity. Energy efficiency and reliable power are crucial considerations for AI labs.",
    realWorldExample: "Training a single large language model can consume as much electricity as hundreds of households use in a year. Companies are increasingly focusing on renewable energy and improved efficiency.",
  },
  hardware: {
    title: "Specialized Hardware",
    description: "AI development depends on specialized processors like GPUs and TPUs, optimized for the parallel operations common in neural networks.",
    realWorldExample: "NVIDIA's A100 and H100 GPUs, Google's TPU v4, and custom ASICs from companies like Cerebras are examples of specialized AI hardware that dramatically accelerate training and inference.",
  },
  regulation: {
    title: "Regulatory Environment",
    description: "Government policies and industry regulations affect what data can be collected, how models can be deployed, and what safeguards must be implemented.",
    realWorldExample: "The EU's AI Act, China's AI regulations, and emerging US frameworks are shaping how AI is developed and deployed globally.",
  },
  
  // Data Enabling Inputs
  quality: {
    title: "Data Quality",
    description: "High-quality, well-labeled data is essential for model performance. Problems like bias, errors, and inconsistencies in training data will be reflected in model outputs.",
    realWorldExample: "Early facial recognition systems had significantly higher error rates for women and people with darker skin due to training data that underrepresented these groups.",
  },
  quantity: {
    title: "Data Quantity",
    description: "The scale of training data directly impacts model capabilities. Larger datasets generally lead to better performance, but with diminishing returns.",
    realWorldExample: "GPT-3 was trained on approximately 570GB of text, while later models have used multiple terabytes of diverse data.",
  },
  formats: {
    title: "Data Formats",
    description: "The diversity of data types (text, images, audio, video, structured data) enables multimodal capabilities in AI systems.",
    realWorldExample: "GPT-4V can process both text and images, allowing it to describe images, analyze charts, and solve visual problems that text-only models cannot.",
  },
  
  // Algorithm Enabling Inputs
  architectures: {
    title: "Model Architectures",
    description: "The fundamental design of neural networks determines what kinds of patterns they can learn and how efficiently they process information.",
    realWorldExample: "The shift from recurrent neural networks (RNNs) to transformer architectures enabled much longer context windows and better handling of sequential data.",
  }
};

// Era Information
export const eraEducationalContent = {
  GNT2: {
    title: "GNT-2 Era",
    description: "The GNT-2 era represented the early application of transformer models at moderate scale. These models could generate coherent text and demonstrated basic language understanding, though with frequent factual errors and limited context length.",
    realWorldParallel: "The real-world parallel had 1.5 billion parameters. Initially, researchers were concerned about potential misuse and released it in stages.",
    technicalSignificance: "GNT-2 proved that scaling transformer models beyond previous sizes could produce qualitatively different capabilities in text generation.",
    industryImpact: "This era began to show the commercial potential of generative AI, though practical applications were still limited."
  },
  GNT3: {
    title: "GNT-3 Era",
    description: "The GNT-3 era demonstrated that massive scaling of parameters and training data could produce emergent capabilities not present in smaller models, including few-shot learning and better world knowledge.",
    realWorldParallel: "The real-world parallel was released with 175 billion parameters, more than 100x larger than previous models, and showed surprising abilities to perform tasks it wasn't explicitly trained on.",
    technicalSignificance: "This era established the 'scaling laws' that showed predictable improvements from larger models and datasets.",
    industryImpact: "API access to GPT-3 led to thousands of applications and startups building on large language model technology."
  },
  GNT4: {
    title: "GNT-4 Era",
    description: "The GNT-4 era focused on alignment, safety, and multimodal capabilities. Models became more helpful, harmless, and honest through techniques like RLHF (Reinforcement Learning from Human Feedback).",
    realWorldParallel: "The real-world parallel transformed the industry by making advanced AI accessible to everyday users through conversational interfaces and multimodal capabilities.",
    technicalSignificance: "This era showed that alignment techniques could dramatically improve usefulness while reducing harmful outputs.",
    industryImpact: "The release triggered unprecedented adoption and investment in AI, with major implications across industries."
  },
  GNT5: {
    title: "GNT-5 Era",
    description: "The GNT-5 era is expected to bring enhanced reasoning, improved factuality, and more sophisticated planning abilities.",
    speculativeDevelopments: "Models may develop more reliable reasoning, better long-context understanding, and improved ability to use external tools and knowledge sources.",
    potentialImpact: "These abilities could make AI assistants truly reliable for complex knowledge work and creative collaboration."
  },
  GNT6: {
    title: "GNT-6 Era",
    description: "The GNT-6 era might introduce systems with sophisticated autonomous capabilities, true multi-step reasoning, and general problem-solving across domains.",
    speculativeDevelopments: "Models might develop persistent memory, causal understanding, and the ability to operate effectively without constant human oversight.",
    potentialImpact: "These systems could potentially automate complex workflows across industries and advance scientific research."
  },
  GNT7: {
    title: "GNT-7 Era",
    description: "The GNT-7 era represents the theoretical threshold of Artificial General Intelligence - systems that match or exceed human capabilities across virtually all cognitive tasks.",
    speculativeDevelopments: "True AGI would require robust common sense, causal reasoning, transfer learning, and potentially self-improvement capabilities.",
    potentialImpact: "The achievement of AGI would represent a fundamental transformation in human civilization with profound and unpredictable implications."
  }
};

// Synergy Effects
export const synergyEffects = {
  computeToData: {
    title: "How Compute Enhances Data Processing",
    description: "More computational power allows for processing larger datasets, more complex data transformations, and better data filtering, augmentation, and quality assessment.",
    realWorldExample: "Advanced compute enables techniques like dataset distillation, better noise filtering, and real-time data augmentation that wouldn't be possible at smaller scales."
  },
  computeToAlgorithm: {
    title: "How Compute Enables Algorithm Development",
    description: "Greater computational resources allow for testing more complex algorithms, faster experimentation cycles, and techniques that would be impractical with limited compute.",
    realWorldExample: "Neural architecture search (NAS) uses enormous compute to automatically discover better model architectures by testing thousands of variations."
  },
  computeToIntelligence: {
    title: "How Compute Drives Intelligence",
    description: "Raw computational power has been a primary driver of AI capability improvements, enabling larger parameter counts and more extensive training.",
    realWorldExample: "The 'scaling hypothesis' suggests that many emergent capabilities in AI systems appear primarily as a function of compute-enabled scale rather than algorithmic innovation."
  },
  
  dataToCompute: {
    title: "How Data Improves Compute Efficiency",
    description: "Better data allows for more efficient use of computational resources through better training convergence and reduced need for redundant computation.",
    realWorldExample: "High-quality, well-curated datasets can reduce training time and compute requirements compared to using larger but noisier datasets."
  },
  dataToAlgorithm: {
    title: "How Data Influences Algorithm Design",
    description: "The nature and structure of available data shapes what algorithms are effective. Different data types and distributions call for specialized algorithmic approaches.",
    realWorldExample: "The availability of massive text corpora specifically influenced the development of transformer architectures, which excel at processing sequential data."
  },
  dataToIntelligence: {
    title: "How Data Builds Intelligence",
    description: "The breadth, depth, and quality of training data directly determines what an AI system can learn about the world.",
    realWorldExample: "Systems trained on diverse, multilingual data show better cross-cultural understanding and reasoning capabilities than those trained on limited or biased datasets."
  },
  
  algorithmToCompute: {
    title: "How Algorithms Optimize Compute Usage",
    description: "Algorithmic improvements can dramatically increase the efficiency of computational resource usage.",
    realWorldExample: "Techniques like mixed-precision training, gradient accumulation, and efficient attention mechanisms have made it possible to train larger models with less compute."
  },
  algorithmToData: {
    title: "How Algorithms Enhance Data Utilization",
    description: "Smart algorithmic approaches can extract more value from existing data through better representation learning and data efficiency techniques.",
    realWorldExample: "Self-supervised learning methods like BERT and contrastive learning extract much more useful information from unlabeled data than previous approaches."
  },
  algorithmToIntelligence: {
    title: "How Algorithms Drive Intelligence",
    description: "Fundamental algorithmic breakthroughs can enable qualitatively new capabilities that scale and data alone cannot provide.",
    realWorldExample: "The invention of transformer architectures with attention mechanisms enabled a step-change in AI capabilities that wouldn't have emerged from simply scaling older architectures."
  }
};
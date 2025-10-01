import { GameStateType } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ResourceTooltip } from "@/components/ui/educational-tooltip";
import { Slider } from "@/components/ui/slider";
import InvestmentMilestones from "./InvestmentMilestones";

interface EconomicSectionProps {
  gameState: GameStateType;
  toggleApiService: () => void;
  toggleChatbotService: () => void;
  setMonthlyFee: (fee: number) => void;
  improveDeveloperTools?: () => void;
  improveChatbot?: () => void;
  runAdvertisingCampaign?: () => void;
  buildApiPlatform?: () => void;
  buildChatbotPlatform?: () => void;
}

export default function EconomicSection({
  gameState,
  toggleApiService,
  toggleChatbotService,
  setMonthlyFee,
  improveDeveloperTools,
  improveChatbot,
  runAdvertisingCampaign,
  buildApiPlatform,
  buildChatbotPlatform,
}: EconomicSectionProps) {
  const { money, revenue } = gameState;
  
  // Defense-in-depth: Safe capacity calculation
  const safeMaxCapacity = Math.max(1, gameState.computeCapacity?.maxCapacity ?? 1);
  const safeUsageRatio = gameState.computeCapacity.used / safeMaxCapacity;
  
  // Local state for monthly fee slider
  const [tempMonthlyFee, setTempMonthlyFee] = useState(revenue.monthlyFee);
  
  // Handle monthly fee change
  const handleMonthlyFeeChange = (value: number[]) => {
    setTempMonthlyFee(value[0]);
  };
  
  // Apply monthly fee changes
  const applyMonthlyFeeChanges = () => {
    setMonthlyFee(tempMonthlyFee);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 md:col-span-1">
      <h2 className="text-xl font-semibold mb-4">Financial Dashboard</h2>
      
      {/* Total Money */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Available Funds
          </h3>
          <span className="text-2xl font-bold text-green-400">${formatCurrency(money)}</span>
        </div>
      </div>
      
      {/* Revenue Statistics */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Revenue Statistics
          <ResourceTooltip 
            content="Your revenue streams from various services. Services automatically activate as you advance through eras." 
            resourceColor="blue-400"
          >Learn</ResourceTooltip>
        </h3>
        
        {/* Compute Capacity Warning */}
        {safeUsageRatio >= 0.95 ? (
          <div className="mb-4 bg-red-900/30 border border-red-800 rounded-md p-2 text-xs text-red-300 flex items-center">
            <div className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <p>Critical system overload! Services severely degraded. Revenue reduced by up to 50% and customers are leaving.</p>
          </div>
        ) : safeUsageRatio >= 0.9 ? (
          <div className="mb-4 bg-amber-900/30 border border-amber-800 rounded-md p-2 text-xs text-amber-300 flex items-center">
            <div className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </div>
            <p>High system load! Intermittent outages affecting service quality. Revenue and customer growth are reduced.</p>
          </div>
        ) : null}
        
        {/* Compute Usage Summary */}
        <div className="mb-4 bg-gray-800 rounded-md p-2 border border-gray-700">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-gray-400">Compute Usage:</span>
            <span className={`font-medium ${
              safeUsageRatio >= 0.95
                ? 'text-red-400'
                : safeUsageRatio >= 0.9
                  ? 'text-amber-400'
                  : 'text-blue-400'
            }`}>
              {gameState.computeCapacity.used} / {safeMaxCapacity} units
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-700/50 p-1.5 rounded">
              <span className="text-gray-400">API Service Usage:</span>
              <div className="text-blue-300 font-medium">{Math.ceil((revenue.b2b / 1000) * 5)} units</div>
            </div>
            <div className="bg-gray-700/50 p-1.5 rounded">
              <span className="text-gray-400">Subscriber Usage:</span>
              <div className="text-purple-300 font-medium">{Math.ceil(revenue.subscribers * 0.01)} units</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* API Service Stats */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-blue-300 font-medium">API Service</span>
                <ResourceTooltip 
                  content={
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-blue-300 text-lg mb-2">B2B API Services</h4>
                        <p className="text-sm text-gray-200 leading-relaxed">Monetize the raw, foundational power of your AI model as a utility for other businesses. This isn't a consumer product—it's infrastructure.</p>
                      </div>
                      
                      <div className="p-3 bg-blue-900/40 border border-blue-700/60 rounded-lg">
                        <h5 className="text-blue-300 font-semibold text-sm mb-2">Real World Example</h5>
                        <p className="text-sm text-blue-100 leading-relaxed">OpenAI's API, Anthropic's Claude API, and Amazon Web Services (AWS) all follow this model—selling access to powerful infrastructure that other companies build upon.</p>
                      </div>
                      
                      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                        <p className="text-sm text-gray-200 leading-relaxed">Revenue depends heavily on raw AI Intelligence score. Boost with Developer Tools investments. High compute usage is the strategic cost.</p>
                      </div>
                    </div>
                  }
                  resourceColor="blue-400"
                >
                  <span className="ml-1 text-xs text-blue-300 underline cursor-help">ⓘ</span>
                </ResourceTooltip>
              </div>
              <div>
                {revenue.apiAvailable ? (
                  <span className="text-xs bg-blue-900/40 border border-blue-500/30 px-2 py-1 rounded">
                    {revenue.developers.toLocaleString()} developers
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 bg-gray-900 px-2 py-1 rounded">
                    Unlocks in GNT-3 Era
                  </span>
                )}
              </div>
            </div>
            
            {/* API Statistics */}
            {revenue.apiAvailable && (
              <div className="text-xs text-gray-300 mt-1 grid grid-cols-2 gap-2">
                <div className="bg-gray-700/50 p-2 rounded">
                  <span className="text-gray-400">Current rate:</span>
                  <div className="text-blue-300 font-medium">${formatCurrency(revenue.baseApiRate)}/tick</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded">
                  <span className="text-gray-400">Growth rate:</span>
                  <div className="text-blue-300 font-medium">{Math.round(revenue.developerGrowthRate * 100)}%/tick</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chatbot Service Stats */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-purple-300 font-medium">Chatbot Service</span>
                <ResourceTooltip 
                  content={
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-purple-300 text-lg mb-2">B2C Chatbot Subscriptions</h4>
                        <p className="text-sm text-gray-200 leading-relaxed">Create a polished, consumer-facing product that people pay a recurring fee for. Less about raw power, more about user experience and reliability.</p>
                      </div>
                      
                      <div className="p-3 bg-purple-900/40 border border-purple-700/60 rounded-lg">
                        <h5 className="text-purple-300 font-semibold text-sm mb-2">Real World Example</h5>
                        <p className="text-sm text-purple-100 leading-relaxed">ChatGPT Plus is the quintessential example, along with subscription-based AI tools like Midjourney that focus on delivering consistent, reliable consumer experiences.</p>
                      </div>
                      
                      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                        <p className="text-sm text-gray-200 leading-relaxed">Growth tied to both AI Intelligence and Data Quality (reliability attracts users). Improve with Chatbot Improvements or boost short-term with Ad Campaigns.</p>
                      </div>
                    </div>
                  }
                  resourceColor="purple-400"
                >
                  <span className="ml-1 text-xs text-purple-300 underline cursor-help">ⓘ</span>
                </ResourceTooltip>
              </div>
              <div>
                {revenue.chatbotAvailable ? (
                  <span className="text-xs bg-purple-900/40 border border-purple-500/30 px-2 py-1 rounded">
                    {revenue.subscribers.toLocaleString()} subscribers
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 bg-gray-900 px-2 py-1 rounded">
                    Unlocks in GNT-4 Era
                  </span>
                )}
              </div>
            </div>
            
            {/* Chatbot Statistics */}
            {revenue.chatbotAvailable && (
              <div className="text-xs text-gray-300 mt-1 grid grid-cols-2 gap-2">
                <div className="bg-gray-700/50 p-2 rounded">
                  <span className="text-gray-400">Monthly fee:</span>
                  <div className="text-purple-300 font-medium">${formatCurrency(revenue.monthlyFee)}/month</div>
                </div>
                <div className="bg-gray-700/50 p-2 rounded">
                  <span className="text-gray-400">Growth rate:</span>
                  <div className="text-purple-300 font-medium">{Math.round(revenue.subscriberGrowthRate * 100)}%/tick</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Revenue Streams */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Revenue Streams</h3>
        
        <div className="space-y-3">
          {/* API Services (B2B) */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400 mr-3"></div>
              <div>
                <h4 className="text-sm font-medium text-blue-300">API Services (B2B)</h4>
                <ResourceTooltip 
                  content={
                    <div className="space-y-3">
                      <p className="text-sm">Monetize the raw, foundational power of your AI model as a utility for other businesses. This isn't a consumer product—it's infrastructure.</p>
                      
                      <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <h5 className="text-blue-300 font-semibold text-sm mb-2">Real World Example</h5>
                        <p className="text-sm text-blue-100 leading-relaxed">OpenAI's API, Anthropic's Claude API, and Amazon Web Services (AWS) all follow this model—selling access to powerful infrastructure that other companies build upon.</p>
                      </div>
                      
                      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                        <p className="text-sm text-gray-200 leading-relaxed">Revenue depends heavily on raw AI Intelligence score. Boost with Developer Tools investments. High compute usage is the strategic cost.</p>
                      </div>
                    </div>
                  }
                  resourceColor="blue-400"
                >
                  <span className="ml-1 text-xs text-blue-300 underline cursor-help">ⓘ</span>
                </ResourceTooltip>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-blue-300">${formatCurrency(revenue.b2b)}/tick</span>
              {revenue.apiAvailable && (
                <div className="text-xs text-gray-400 mt-1">
                  Developer Tools Level: {revenue.developerToolsLevel}
                </div>
              )}
            </div>
          </div>

          {/* Subscriptions (B2C) */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-400 mr-3"></div>
              <div>
                <h4 className="text-sm font-medium text-purple-300">Subscriptions (B2C)</h4>
                <ResourceTooltip 
                  content={
                    <div className="space-y-3">
                      <p className="text-sm">Direct-to-consumer AI services offering accessible, user-friendly AI capabilities to individual users through subscription plans.</p>
                      
                      <div className="p-3 bg-purple-900/30 border border-purple-700/50 rounded-lg">
                        <h5 className="text-purple-300 font-semibold text-sm mb-2">Real World Example</h5>
                        <p className="text-sm text-purple-100 leading-relaxed">ChatGPT Plus is the quintessential example, along with subscription-based AI tools like Midjourney that focus on delivering consistent, reliable consumer experiences.</p>
                      </div>
                      
                      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                        <p className="text-sm text-gray-200 leading-relaxed">Growth tied to both AI Intelligence and Data Quality (reliability attracts users). Improve with Chatbot Improvements or boost short-term with Ad Campaigns.</p>
                      </div>
                    </div>
                  }
                  resourceColor="purple-400"
                >
                  <span className="ml-1 text-xs text-purple-300 underline cursor-help">ⓘ</span>
                </ResourceTooltip>
              </div>
            </div>
            <div>
              {revenue.chatbotAvailable ? (
                <span className="text-sm font-medium text-purple-300">${formatCurrency(revenue.b2c)}/tick</span>
              ) : (
                <span className="text-xs text-amber-400 bg-gray-900 px-2 py-1 rounded">
                  Unlocks in GNT-4 Era
                </span>
              )}
              {revenue.chatbotAvailable && (
                <div className="text-xs text-gray-400 mt-1">
                  Active Subscribers: {revenue.subscribers.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Investor Funding */}
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 mr-3"></div>
              <div>
                <h4 className="text-sm font-medium text-amber-300">Investor Funding</h4>
                <ResourceTooltip 
                  content={
                    <div className="space-y-3">
                      <p className="text-sm">Strategic investment from venture capital firms and institutional investors based on your AI's demonstrated capabilities and market potential.</p>
                      
                      <div className="p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                        <h5 className="text-amber-300 font-semibold text-sm mb-2">Real World Example</h5>
                        <p className="text-sm text-amber-100 leading-relaxed">OpenAI's $13B funding from Microsoft, Anthropic's $4B from Amazon, and other major AI investments that fuel massive compute infrastructure and research.</p>
                      </div>
                      
                      <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                        <p className="text-sm text-gray-200 leading-relaxed">Depends on breakthrough achievements, regulatory compliance, and rapid intelligence growth. Show consistent progress to attract larger rounds.</p>
                      </div>
                    </div>
                  }
                  resourceColor="amber-400"
                >
                  <span className="ml-1 text-xs text-amber-300 underline cursor-help">ⓘ</span>
                </ResourceTooltip>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-amber-300">${formatCurrency(revenue.investors)} total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Milestones */}
      <div className="mb-5">
        <InvestmentMilestones gameState={gameState} />
      </div>
      
      {/* Platform Development */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Platform Development</h3>
        <p className="text-sm text-gray-400 mb-3">
          Build the infrastructure needed to offer revenue-generating services
        </p>
        
        <div className="space-y-3">
          {/* API Platform Development */}
          {revenue.apiAvailable && !revenue.apiPlatformBuilt && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-blue-300">API Platform</h4>
                <span className="text-xs bg-blue-900/40 border border-blue-500/30 px-2 py-1 rounded">
                  Build Required
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Build the API infrastructure needed to serve developers and earn B2B revenue.
              </p>
              <button 
                className={`w-full py-2 px-4 rounded text-sm flex justify-between items-center transition relative ${
                  money >= revenue.apiPlatformCost && buildApiPlatform
                    ? "bg-blue-700 hover:bg-blue-600 text-white"
                    : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
                } ${gameState.narrativeFlags.highlightApiPlatform ? 'animate-pulse ring-2 ring-blue-400 shadow-lg shadow-blue-400/50' : ''}`}
                onClick={buildApiPlatform}
                disabled={money < revenue.apiPlatformCost || !buildApiPlatform}
                data-testid="button-build-api-platform"
              >
                <span>Build API Platform</span>
                <span className="bg-gray-700 text-blue-300 px-2 py-1 rounded text-xs">${formatCurrency(revenue.apiPlatformCost)}</span>
                {gameState.narrativeFlags.highlightApiPlatform && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Chatbot Platform Development */}
          {revenue.chatbotAvailable && !revenue.chatbotPlatformBuilt && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-purple-300">Chatbot Platform</h4>
                <span className="text-xs bg-purple-900/40 border border-purple-500/30 px-2 py-1 rounded">
                  Build Required
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Build the chatbot infrastructure needed to serve consumers and earn B2C revenue.
              </p>
              <button 
                className={`w-full py-2 px-4 rounded text-sm flex justify-between items-center transition relative ${
                  money >= revenue.chatbotPlatformCost && buildChatbotPlatform
                    ? "bg-purple-700 hover:bg-purple-600 text-white"
                    : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
                } ${gameState.narrativeFlags.highlightChatbotPlatform ? 'animate-pulse ring-2 ring-purple-400 shadow-lg shadow-purple-400/50' : ''}`}
                onClick={buildChatbotPlatform}
                disabled={money < revenue.chatbotPlatformCost || !buildChatbotPlatform}
                data-testid="button-build-chatbot-platform"
              >
                <span>Build Chatbot Platform</span>
                <span className="bg-gray-700 text-purple-300 px-2 py-1 rounded text-xs">${formatCurrency(revenue.chatbotPlatformCost)}</span>
                {gameState.narrativeFlags.highlightChatbotPlatform && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Platform Status Display */}
          {(revenue.apiAvailable || revenue.chatbotAvailable) && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <h4 className="font-medium text-gray-300 mb-2">Platform Status</h4>
              <div className="space-y-2">
                {revenue.apiAvailable && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">API Platform:</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      revenue.apiPlatformBuilt 
                        ? "bg-green-900/40 border border-green-500/30 text-green-300" 
                        : "bg-amber-900/40 border border-amber-500/30 text-amber-300"
                    }`}>
                      {revenue.apiPlatformBuilt ? "✓ Built" : "⚠ Not Built"}
                    </span>
                  </div>
                )}
                {revenue.chatbotAvailable && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Chatbot Platform:</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      revenue.chatbotPlatformBuilt 
                        ? "bg-green-900/40 border border-green-500/30 text-green-300" 
                        : "bg-amber-900/40 border border-amber-500/30 text-amber-300"
                    }`}>
                      {revenue.chatbotPlatformBuilt ? "✓ Built" : "⚠ Not Built"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Revenue Streams */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Revenue Streams</h3>
        
        <div className="space-y-3">
          {/* B2B Revenue */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
              <span>API Services (B2B)</span>
            </div>
            <span className="text-blue-400">${formatCurrency(revenue.b2b)}/tick</span>
          </div>
          
          {/* Developer Tools Level */}
          <div className="flex justify-between items-center p-2 bg-gray-700 rounded text-sm text-gray-300">
            <span>Developer Tools Level:</span>
            <span className="font-medium">{revenue.developerToolsLevel}</span>
          </div>
          
          {/* B2C Revenue */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
              <span>Subscriptions (B2C)</span>
            </div>
            <span className="text-purple-400">${formatCurrency(revenue.b2c)}/tick</span>
          </div>
          
          {/* Subscribers count */}
          <div className="flex justify-between items-center p-2 bg-gray-700 rounded text-sm text-gray-300">
            <span>Active Subscribers:</span>
            <span className="font-medium">{revenue.subscribers.toLocaleString()}</span>
          </div>
          
          {/* Chatbot Quality Level */}
          <div className="flex justify-between items-center p-2 bg-gray-700 rounded text-sm text-gray-300">
            <span>Chatbot Quality Level:</span>
            <span className="font-medium">{revenue.chatbotImprovementLevel}</span>
          </div>
          
          {/* Investor Funding */}
          <div className="flex justify-between items-center p-2 bg-gray-600 rounded">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-amber-400 mr-2"></div>
              <span>Investor Funding</span>
              <ResourceTooltip 
                content={
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-amber-300 text-lg mb-2">Investor Funding</h4>
                      <p className="text-sm text-gray-200 leading-relaxed">Capital raised based on the promise and demonstrated progress of your underlying technology. This isn't revenue from a product—it's investment in your potential.</p>
                    </div>
                    
                    <div className="p-3 bg-amber-900/40 border border-amber-700/60 rounded-lg">
                      <h5 className="text-amber-300 font-semibold text-sm mb-2">Real World Example</h5>
                      <p className="text-sm text-amber-100 leading-relaxed">Venture Capital funding stages (Seed Round, Series A, B, C). AI companies often raise huge sums based purely on research progress—like Anthropic's $4B funding or OpenAI's massive rounds.</p>
                    </div>
                    
                    <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
                      <h5 className="text-green-400 font-semibold text-sm mb-2">How to Improve:</h5>
                      <p className="text-sm text-gray-200 leading-relaxed">Funding earned by achieving Intelligence Milestones and unlocking Breakthroughs. R&D progress directly attracts investment—not automatic revenue.</p>
                    </div>
                  </div>
                }
                resourceColor="amber-400"
              >
                <span className="ml-1 text-xs text-amber-300 underline cursor-help">ⓘ</span>
              </ResourceTooltip>
            </div>
            <span className="text-amber-400">${formatCurrency(revenue.investors)} total</span>
          </div>
        </div>
      </div>
      
      {/* Compute Allocation Info Panel */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Compute Allocation Overview</h3>
        <p className="text-sm text-gray-400 mb-3">
          How your compute resources are being utilized across your operations
        </p>
        
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-700/50 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Capacity</div>
                <div className="text-lg font-medium text-white">{gameState.computeCapacity.maxCapacity}</div>
              </div>
              <div className="bg-gray-700/50 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Used</div>
                <div className="text-lg font-medium text-blue-400">{gameState.computeCapacity.used}</div>
              </div>
              <div className="bg-gray-700/50 p-2 rounded text-center">
                <div className="text-xs text-gray-400">Free</div>
                <div className="text-lg font-medium text-green-400">{gameState.computeCapacity.freeCompute || 0}</div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Usage Breakdown:</span>
              <span>{Math.round(safeUsageRatio * 100)}% of capacity</span>
            </div>
            
            {/* Progress bar showing allocation */}
            <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden flex">
              {/* Customer usage portion */}
              <div 
                className="bg-blue-500 h-full" 
                style={{ 
                  width: `${Math.round((gameState.computeCapacity.customerUsage || 0) / safeMaxCapacity * 100)}%` 
                }}
              ></div>
              
              {/* Training portion */}
              <div 
                className="bg-amber-500 h-full" 
                style={{ 
                  width: `${Math.round(gameState.training.active ? 
                    (gameState.training.computeReserved / safeMaxCapacity * 100) : 0)}%` 
                }}
              ></div>
              
              {/* Research portion (empty space) is implied */}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                <span className="text-gray-300">Customer Services: {Math.round((gameState.computeCapacity.customerUsage || 0) / safeMaxCapacity * 100)}%</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                <span className="text-gray-300">Training Reserved: {Math.round(gameState.training.active ? (gameState.training.computeReserved / safeMaxCapacity * 100) : 0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Controls */}
      <div className="bg-gray-700 rounded-lg p-4 mb-5">
        <h3 className="text-lg font-medium mb-3">Service Controls</h3>
        <p className="text-sm text-gray-400 mb-3">
          Enable and configure your revenue-generating services
        </p>
        
        <div className="space-y-4">
          {/* API Service Control */}
          {revenue.apiAvailable && revenue.apiPlatformBuilt && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h4 className="font-medium text-blue-300 mr-2">API Service</h4>
                  <span className="text-xs bg-green-900/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                    Platform Ready
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="api-toggle" className="text-sm text-gray-300">
                    {revenue.apiEnabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id="api-toggle"
                    checked={revenue.apiEnabled}
                    onCheckedChange={toggleApiService}
                    data-testid="switch-api-service"
                  />
                </div>
              </div>
              
              {/* API Rate Display (Auto-Optimized) */}
              {revenue.apiEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">API Rate:</span>
                    <span className="text-xs text-blue-300">${formatCurrency(revenue.baseApiRate)}/tick</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center py-2 bg-gray-900/50 rounded border border-gray-700">
                    💡 Auto-optimized based on market demand and developer adoption
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Chatbot Service Control */}
          {revenue.chatbotAvailable && revenue.chatbotPlatformBuilt && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h4 className="font-medium text-purple-300 mr-2">Chatbot Service</h4>
                  <span className="text-xs bg-green-900/40 border border-green-500/30 text-green-300 px-2 py-1 rounded">
                    Platform Ready
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="chatbot-toggle" className="text-sm text-gray-300">
                    {revenue.chatbotEnabled ? "Enabled" : "Disabled"}
                  </Label>
                  <Switch
                    id="chatbot-toggle"
                    checked={revenue.chatbotEnabled}
                    onCheckedChange={toggleChatbotService}
                    data-testid="switch-chatbot-service"
                  />
                </div>
              </div>
              
              {/* Monthly Fee Control */}
              {revenue.chatbotEnabled && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Monthly Fee:</span>
                    <span className="text-xs text-purple-300">${formatCurrency(tempMonthlyFee)}/month</span>
                  </div>
                  <Slider
                    value={[tempMonthlyFee]}
                    onValueChange={handleMonthlyFeeChange}
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                    data-testid="slider-monthly-fee"
                  />
                  <Button
                    onClick={applyMonthlyFeeChanges}
                    size="sm"
                    className="w-full"
                    data-testid="button-apply-monthly-fee"
                  >
                    Apply Fee Change
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Service Availability Messages */}
          {(!revenue.apiAvailable && !revenue.chatbotAvailable) && (
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400">
                Revenue services will unlock as you advance through AI eras
              </p>
            </div>
          )}
          
          {(revenue.apiAvailable && !revenue.apiPlatformBuilt) || (revenue.chatbotAvailable && !revenue.chatbotPlatformBuilt) ? (
            <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-300 text-center">
                Build platform infrastructure above to enable service controls
              </p>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Revenue Enhancement */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-3">Revenue Enhancement</h3>
        <p className="text-sm text-gray-400 mb-3">
          Invest in improving your revenue streams
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Improve Developer Tools */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-blue-300">Developer Tools</h4>
              <span className="text-xs bg-gray-700 text-blue-300 px-2 py-1 rounded">Level {revenue.developerToolsLevel}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Improve your API documentation and SDK, increasing B2B revenue by 5% per level.
            </p>
            <button 
              className={`w-full py-2 px-4 rounded text-sm flex justify-between items-center transition ${
                money >= revenue.developerToolsCost && improveDeveloperTools
                  ? "bg-blue-700 hover:bg-blue-600 text-white"
                  : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
              }`}
              onClick={improveDeveloperTools}
              disabled={money < revenue.developerToolsCost || !improveDeveloperTools}
            >
              <span>Upgrade Developer Tools</span>
              <span className="bg-gray-700 text-blue-300 px-2 py-1 rounded text-xs">${formatCurrency(revenue.developerToolsCost)}</span>
            </button>
          </div>
          
          {/* Improve Chatbot Quality */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-purple-300">Chatbot Quality</h4>
              <span className="text-xs bg-gray-700 text-purple-300 px-2 py-1 rounded">Level {revenue.chatbotImprovementLevel}</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Enhance your AI chatbot capabilities, increasing subscriber growth by 5% per level.
            </p>
            <button 
              className={`w-full py-2 px-4 rounded text-sm flex justify-between items-center transition ${
                money >= revenue.chatbotImprovementCost && improveChatbot
                  ? "bg-purple-700 hover:bg-purple-600 text-white"
                  : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
              }`}
              onClick={improveChatbot}
              disabled={money < revenue.chatbotImprovementCost || !improveChatbot}
            >
              <span>Improve Chatbot</span>
              <span className="bg-gray-700 text-purple-300 px-2 py-1 rounded text-xs">${formatCurrency(revenue.chatbotImprovementCost)}</span>
            </button>
          </div>
          
          {/* Run Advertising Campaign */}
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-amber-300">Advertising</h4>
              <span className="text-xs bg-gray-700 text-amber-300 px-2 py-1 rounded">{revenue.subscribers.toLocaleString()} Subscribers</span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Launch an advertising campaign to immediately gain 1,000 new subscribers.
            </p>
            <button 
              className={`w-full py-2 px-4 rounded text-sm flex justify-between items-center transition ${
                money >= revenue.marketingCampaignCost && runAdvertisingCampaign
                  ? "bg-amber-700 hover:bg-amber-600 text-white"
                  : "bg-gray-600 opacity-70 cursor-not-allowed text-gray-300"
              }`}
              onClick={runAdvertisingCampaign}
              disabled={money < revenue.marketingCampaignCost || !runAdvertisingCampaign}
            >
              <span>Launch Campaign</span>
              <span className="bg-gray-700 text-amber-300 px-2 py-1 rounded text-xs">${formatCurrency(revenue.marketingCampaignCost)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
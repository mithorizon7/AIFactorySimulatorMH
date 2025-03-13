import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameStateType } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";

interface ResourceDetailPageProps {
  gameState: GameStateType;
  // Money allocation functions
  allocateMoneyToCompute: () => void;
  allocateMoneyToElectricity: () => void;
  allocateMoneyToHardware: () => void;
  allocateMoneyToRegulations: () => void;
  
  allocateMoneyToDataQuality: () => void;
  allocateMoneyToDataQuantity: () => void;
  allocateMoneyToDataFormats: () => void;
  
  allocateMoneyToAlgorithmArchitectures: () => void;
  
  // Close handler
  onClose: () => void;
}

export default function ResourceDetailPage({
  gameState,
  allocateMoneyToCompute,
  allocateMoneyToElectricity,
  allocateMoneyToHardware,
  allocateMoneyToRegulations,
  allocateMoneyToDataQuality,
  allocateMoneyToDataQuantity,
  allocateMoneyToDataFormats,
  allocateMoneyToAlgorithmArchitectures,
  onClose
}: ResourceDetailPageProps) {
  const { money, computeInputs, dataInputs, algorithmInputs } = gameState;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Available Funds</h3>
            <span className="text-2xl font-bold text-green-400">${formatCurrency(money)}</span>
          </div>
          
          <Tabs defaultValue="compute">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="compute" className="data-[state=active]:bg-blue-600">Compute</TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-green-600">Data</TabsTrigger>
              <TabsTrigger value="algorithm" className="data-[state=active]:bg-purple-600">Algorithm</TabsTrigger>
            </TabsList>
            
            {/* Compute Tab */}
            <TabsContent value="compute" className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Compute Infrastructure</h3>
                <p className="text-gray-300 mb-6">
                  Compute acts as the electrical grid of AI - the backbone that powers every operation.
                  Increased investment in compute resources allows for larger models and faster training.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Direct Compute Investment */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Infrastructure Funding</h4>
                      <div className="bg-blue-900 px-3 py-1 rounded-full text-sm">
                        Level: {computeInputs.money}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Direct investment in compute infrastructure leads to more powerful hardware
                      and increased processing capabilities.
                    </p>
                    <Button 
                      className={`w-full bg-blue-600 hover:bg-blue-700 ${money < 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToCompute}
                      disabled={money < 100}
                    >
                      Invest $100
                    </Button>
                  </div>
                  
                  {/* Electricity */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Electricity Generation</h4>
                      <div className="bg-blue-900 px-3 py-1 rounded-full text-sm">
                        Level: {computeInputs.electricity}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Better power infrastructure reduces operating costs and enables
                      more energy-efficient computing.
                    </p>
                    <Button 
                      className={`w-full bg-blue-600 hover:bg-blue-700 ${money < 85 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToElectricity}
                      disabled={money < 85}
                    >
                      Invest $85
                    </Button>
                  </div>
                  
                  {/* Hardware */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Hardware Quality</h4>
                      <div className="bg-blue-900 px-3 py-1 rounded-full text-sm">
                        Level: {computeInputs.hardware}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Advanced GPU/TPU hardware dramatically increases training
                      capacity and output quality.
                    </p>
                    <Button 
                      className={`w-full bg-blue-600 hover:bg-blue-700 ${money < 150 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToHardware}
                      disabled={money < 150}
                    >
                      Invest $150
                    </Button>
                  </div>
                  
                  {/* Regulatory Environment */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Regulatory Compliance</h4>
                      <div className="bg-blue-900 px-3 py-1 rounded-full text-sm">
                        Level: {computeInputs.regulation}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Investments in regulatory compliance and lobbying can reduce
                      restrictions on compute usage.
                    </p>
                    <Button 
                      className={`w-full bg-blue-600 hover:bg-blue-700 ${money < 120 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToRegulations}
                      disabled={money < 120}
                    >
                      Invest $120
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Data Tab */}
            <TabsContent value="data" className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-green-400">Data Resources</h3>
                <p className="text-gray-300 mb-6">
                  Data is the raw material that feeds your AI models. Increased quantity, quality, and
                  variety of data leads to more capable and accurate AI.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Quality */}
                  <div className="bg-gray-800 p-4 rounded-lg relative">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium">Data Quality</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 border border-green-500/40 bg-green-900/20 hover:bg-green-900/40 text-green-400"
                        >
                          What is this?
                        </Button>
                      </div>
                      <div className="bg-green-900 px-3 py-1 rounded-full text-sm">
                        Level: {dataInputs.quality}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Investments in data curation, cleaning, and bias detection lead to
                      more accurate and fair AI models.
                    </p>
                    <Button 
                      className={`w-full bg-green-600 hover:bg-green-700 ${money < 75 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToDataQuality}
                      disabled={money < 75}
                    >
                      Invest $75
                    </Button>
                  </div>
                  
                  {/* Data Quantity */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Data Quantity</h4>
                      <div className="bg-green-900 px-3 py-1 rounded-full text-sm">
                        Level: {dataInputs.quantity}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      More data through web scraping, digitization, and licensing leads to
                      better generalization capabilities.
                    </p>
                    <Button 
                      className={`w-full bg-green-600 hover:bg-green-700 ${money < 60 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToDataQuantity}
                      disabled={money < 60}
                    >
                      Invest $60
                    </Button>
                  </div>
                  
                  {/* Data Formats */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Data Formats</h4>
                      <div className="bg-green-900 px-3 py-1 rounded-full text-sm">
                        Level: {dataInputs.formats}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Investment in multimodal data (text, image, audio) and specialized
                      datasets unlocks new AI capabilities.
                    </p>
                    <Button 
                      className={`w-full bg-green-600 hover:bg-green-700 ${money < 90 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToDataFormats}
                      disabled={money < 90}
                    >
                      Invest $90
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Algorithm Tab */}
            <TabsContent value="algorithm" className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-purple-400">Algorithm Research</h3>
                <p className="text-gray-300 mb-6">
                  Algorithm innovations unlock entirely new capabilities and efficiencies in AI.
                  Breakthroughs in architecture, training methods, and efficiency transform what's possible.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Model Architectures */}
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium">Model Architectures</h4>
                      <div className="bg-purple-900 px-3 py-1 rounded-full text-sm">
                        Level: {algorithmInputs.architectures}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Research into novel model architectures (transformers, diffusion models, etc.)
                      that fundamentally change AI capabilities.
                    </p>
                    <Button 
                      className={`w-full bg-purple-600 hover:bg-purple-700 ${money < 125 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={allocateMoneyToAlgorithmArchitectures}
                      disabled={money < 125}
                    >
                      Invest $125
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
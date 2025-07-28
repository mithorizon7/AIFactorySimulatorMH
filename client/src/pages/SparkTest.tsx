import React from 'react';
import { SparkCharacter } from '@/components/character/SparkCharacter';

export function SparkTest() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Spark Character Test</h1>
        
        {/* Corner Position Test */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative min-h-32">
          <h2 className="text-xl font-semibold text-white mb-4">Corner Position Test</h2>
          <p className="text-gray-300">
            Spark should appear in the top-right corner of this box.
          </p>
          <SparkCharacter 
            position="corner"
            size="small"
          />
        </div>

        {/* Inline Position Test */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Inline Position Test</h2>
          <SparkCharacter 
            message="Hello! I'm Spark, your AI advisor. I'm here to help guide you through the exciting world of AI development!"
            position="inline"
            size="medium"
          />
        </div>

        {/* Different Sizes */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Size Variations</h2>
          <div className="flex gap-8 items-end">
            <div className="text-center">
              <SparkCharacter position="inline" size="small" />
              <p className="text-gray-400 text-sm mt-2">Small</p>
            </div>
            <div className="text-center">
              <SparkCharacter position="inline" size="medium" />
              <p className="text-gray-400 text-sm mt-2">Medium</p>
            </div>
            <div className="text-center">
              <SparkCharacter position="inline" size="large" />
              <p className="text-gray-400 text-sm mt-2">Large</p>
            </div>
          </div>
        </div>

        {/* Tutorial Modal Simulation */}
        <div className="bg-gray-900 border-2 border-blue-500/30 rounded-lg shadow-2xl p-6 relative">
          <h2 className="text-xl font-semibold text-white mb-4">Tutorial Modal Simulation</h2>
          <SparkCharacter 
            position="corner"
            size="small"
          />
          <div className="pr-16">
            <p className="text-gray-300 mb-4">
              This simulates how Spark would appear in tutorial modals and notifications.
              The character should be positioned in the top-right corner while the content
              remains readable.
            </p>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                This is where educational context would appear in actual tutorials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
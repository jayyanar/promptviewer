import { useState } from 'react';

interface OrchestrationViewerProps {
  orchestration: {
    flow: string;
    description: string;
  };
  agents: any[];
}

export default function OrchestrationViewer({ orchestration, agents }: OrchestrationViewerProps) {
  const [viewMode, setViewMode] = useState<'yaml' | 'graph'>('yaml');
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Orchestration Plan
        </h3>
        <div className="mt-2 flex space-x-4">
          <button
            onClick={() => setViewMode('yaml')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'yaml'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Flow View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'graph'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Description View
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        {viewMode === 'yaml' ? (
          <div className="px-4 py-5 sm:p-0">
            <pre className="bg-gray-800 text-white p-4 rounded overflow-auto">
              {orchestration.flow}
            </pre>
          </div>
        ) : (
          <div className="px-4 py-5">
            <p className="text-gray-700">{orchestration.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

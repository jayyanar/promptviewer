import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface OrchestrationViewerProps {
  orchestration: {
    flow: string;
    description: string;
  };
  agents: any[];
}

export default function OrchestrationViewer({ orchestration, agents }: OrchestrationViewerProps) {
  const [viewMode, setViewMode] = useState<'diagram' | 'description'>('diagram');
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'sans-serif'
    });
    
    // Render the diagram when in diagram mode and when the component mounts
    if (viewMode === 'diagram' && mermaidRef.current) {
      try {
        mermaidRef.current.innerHTML = orchestration.flow;
        mermaid.init(undefined, mermaidRef.current);
      } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        // If there's an error, show a fallback
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '<div class="text-red-500">Error rendering diagram. Please check the syntax.</div>';
        }
      }
    }
  }, [viewMode, orchestration.flow]);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Orchestration Plan
        </h3>
        <div className="mt-2 flex space-x-4">
          <button
            onClick={() => setViewMode('diagram')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'diagram'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Diagram View
          </button>
          <button
            onClick={() => setViewMode('description')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'description'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Description View
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        {viewMode === 'diagram' ? (
          <div className="px-4 py-5 sm:p-0">
            <div className="mermaid-diagram-container overflow-auto p-4">
              <div ref={mermaidRef} className="mermaid">
                {/* Mermaid diagram will be rendered here */}
              </div>
            </div>
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

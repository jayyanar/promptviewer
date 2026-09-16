import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge,
  Position
} from 'react-flow-renderer';
import YAML from 'yaml';

interface OrchestrationViewerProps {
  orchestration: {
    flow: string;
  };
  agents: any[];
}

export default function OrchestrationViewer({ orchestration, agents }: OrchestrationViewerProps) {
  const [viewMode, setViewMode] = useState<'yaml' | 'graph'>('yaml');
  
  // Parse YAML to create flow graph
  const parseOrchestrationFlow = () => {
    try {
      const flowData = YAML.parse(orchestration.flow);
      
      // Create nodes from agents
      const nodes: Node[] = agents.map((agent, index) => ({
        id: agent.id,
        data: { label: agent.name },
        position: { x: 250 * index, y: 100 },
        type: 'default',
      }));
      
      // Create edges from flow data
      // This is a simplified implementation - in a real app, you'd need to parse
      // the specific YAML structure returned by Claude
      const edges: Edge[] = [];
      
      if (flowData && flowData.flow) {
        Object.entries(flowData.flow).forEach(([sourceId, targets]: [string, any]) => {
          const sourceAgent = agents.find(a => a.name === sourceId);
          
          if (sourceAgent) {
            if (Array.isArray(targets)) {
              targets.forEach((targetName: string) => {
                const targetAgent = agents.find(a => a.name === targetName);
                if (targetAgent) {
                  edges.push({
                    id: `${sourceAgent.id}-${targetAgent.id}`,
                    source: sourceAgent.id,
                    target: targetAgent.id,
                    animated: true,
                  });
                }
              });
            } else if (typeof targets === 'string') {
              const targetAgent = agents.find(a => a.name === targets);
              if (targetAgent) {
                edges.push({
                  id: `${sourceAgent.id}-${targetAgent.id}`,
                  source: sourceAgent.id,
                  target: targetAgent.id,
                  animated: true,
                });
              }
            }
          }
        });
      }
      
      return { nodes, edges };
    } catch (error) {
      console.error('Error parsing orchestration flow:', error);
      return { nodes: [], edges: [] };
    }
  };
  
  const { nodes, edges } = parseOrchestrationFlow();

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
            YAML View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'graph'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Graph View
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        {viewMode === 'yaml' ? (
          <div className="px-4 py-5 sm:p-0">
            <SyntaxHighlighter language="yaml" style={tomorrow}>
              {orchestration.flow}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div style={{ height: 400 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background color="#aaa" gap={16} />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}

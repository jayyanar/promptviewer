import { useState } from 'react';

interface AgentTileProps {
  agent: any;
  promptId: string;
}

export default function AgentTile({ agent, promptId }: AgentTileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [behaviors, setBehaviors] = useState(agent.behavior ? agent.behavior.join('\n') : '');
  const [constraints, setConstraints] = useState(agent.constraints ? agent.constraints.join('\n') : '');
  const [examples, setExamples] = useState(agent.examples ? agent.examples.join('\n\n') : '');

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form state
    setName(agent.name);
    setRole(agent.role);
    setBehaviors(agent.behavior ? agent.behavior.join('\n') : '');
    setConstraints(agent.constraints ? agent.constraints.join('\n') : '');
    setExamples(agent.examples ? agent.examples.join('\n\n') : '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parse behaviors (must be 2-5 items)
      const behaviorsList = behaviors
        .split('\n')
        .map((b: string) => b.trim())
        .filter((b: string) => b.length > 0);

      if (behaviorsList.length < 2 || behaviorsList.length > 5) {
        setError('Behaviors must contain 2-5 items');
        setIsLoading(false);
        return;
      }

      // Parse constraints
      const constraintsList = constraints
        .split('\n')
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);

      // Parse examples
      const examplesList = examples
        .split('\n\n')
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0);

      if (examplesList.length === 0) {
        setError('At least one example is required');
        setIsLoading(false);
        return;
      }

      // In demo mode, just simulate saving
      console.log('Saving agent:', {
        name,
        role,
        behavior: behaviorsList,
        constraints: constraintsList,
        examples: examplesList,
      });
      
      // Wait 1 second to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating agent:', err);
      setError(err.message || 'Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = async () => {
    // In demo mode, just show a message
    alert('Version history feature is disabled in demo mode');
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          ) : (
            agent.name
          )}
        </h3>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {isEditing ? (
                <textarea
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              ) : (
                agent.role
              )}
            </dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Behaviors (2-5)</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {isEditing ? (
                <textarea
                  value={behaviors}
                  onChange={(e) => setBehaviors(e.target.value)}
                  rows={5}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="One behavior per line (2-5 behaviors)"
                />
              ) : (
                <ul className="list-disc pl-5">
                  {agent.behavior && agent.behavior.map((behavior: string, index: number) => (
                    <li key={index}>{behavior}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Constraints</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {isEditing ? (
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="One constraint per line"
                />
              ) : (
                <ul className="list-disc pl-5">
                  {agent.constraints && agent.constraints.map((constraint: string, index: number) => (
                    <li key={index}>{constraint}</li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
          
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Examples</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {isEditing ? (
                <textarea
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  rows={6}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Format: Input: example input\nOutput: example output\n\nInput: another input\nOutput: another output"
                />
              ) : (
                <div className="space-y-3">
                  {agent.examples && agent.examples.map((example: string, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <div className="whitespace-pre-wrap">{example}</div>
                    </div>
                  ))}
                </div>
              )}
            </dd>
          </div>
        </dl>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-between">
        {isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save New Version'}
            </button>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit
            </button>
            <button
              onClick={handleViewHistory}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'View History'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

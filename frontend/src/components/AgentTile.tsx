import { useState } from 'react';
import { API } from 'aws-amplify';
import { useAuth } from '../contexts/AuthContext';

interface AgentTileProps {
  agent: any;
  promptId: string;
  onUpdate: () => void;
}

export default function AgentTile({ agent, promptId, onUpdate }: AgentTileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [behaviors, setBehaviors] = useState(agent.behaviors.join('\n'));
  const [constraints, setConstraints] = useState(agent.constraints.join('\n'));
  const [examples, setExamples] = useState(
    agent.examples.map((ex: any) => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')
  );
  
  const { user } = useAuth();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form state
    setName(agent.name);
    setRole(agent.role);
    setBehaviors(agent.behaviors.join('\n'));
    setConstraints(agent.constraints.join('\n'));
    setExamples(
      agent.examples.map((ex: any) => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')
    );
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
      const examplesList = [];
      const examplePairs = examples.split('\n\n');
      
      for (const pair of examplePairs) {
        const lines = pair.split('\n');
        const inputLine = lines.find((l: string) => l.startsWith('Input:'));
        const outputLine = lines.find((l: string) => l.startsWith('Output:'));
        
        if (inputLine && outputLine) {
          examplesList.push({
            input: inputLine.replace('Input:', '').trim(),
            output: outputLine.replace('Output:', '').trim(),
          });
        }
      }

      if (examplesList.length === 0) {
        setError('At least one example with input and output is required');
        setIsLoading(false);
        return;
      }

      // Save the updated agent
      await API.put('promptweaver', `/agents/${agent.id}`, {
        body: {
          name,
          role,
          behaviors: behaviorsList,
          constraints: constraintsList,
          examples: examplesList,
        },
      });

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      console.error('Error updating agent:', err);
      setError(err.message || 'Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch version history
      const response = await API.get('promptweaver', `/agents/${agent.id}/versions`, {});
      setVersions(response.versions);
      setShowHistory(true);
    } catch (err: any) {
      console.error('Error fetching version history:', err);
      setError(err.message || 'Failed to fetch version history');
    } finally {
      setIsLoading(false);
    }
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
                  {agent.behaviors.map((behavior: string, index: number) => (
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
                  {agent.constraints.map((constraint: string, index: number) => (
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
                  {agent.examples.map((example: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded p-2">
                      <div className="font-medium">Input:</div>
                      <div className="pl-2 mb-2">{example.input}</div>
                      <div className="font-medium">Output:</div>
                      <div className="pl-2">{example.output}</div>
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
      
      {/* Version History Modal */}
      {showHistory && (
        <div className="fixed inset-0 overflow-y-auto z-10">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Version History</h3>
                    <div className="mt-4 max-h-96 overflow-y-auto">
                      {versions.map((version) => (
                        <div key={version.id} className="mb-4 border-b pb-4">
                          <div className="flex justify-between">
                            <div className="font-medium">Version {version.versionNumber}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(version.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm">
                            Edited by:{' '}
                            <a
                              href={version.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500"
                            >
                              {version.linkedinUrl.split('/').pop()}
                            </a>
                          </div>
                          <div className="mt-2">
                            <div className="text-sm font-medium">Role:</div>
                            <div className="text-sm ml-2">{version.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

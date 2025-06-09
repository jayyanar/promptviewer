import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { API } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import AgentTile from '../../../components/AgentTile';
import OrchestrationViewer from '../../../components/OrchestrationViewer';
import { CustomAuthComponents } from '../../../components/CustomAuthComponents';

function AgentsPage() {
  const router = useRouter();
  const { id: promptId } = router.query;
  const components = CustomAuthComponents();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [showOrchestration, setShowOrchestration] = useState(false);

  useEffect(() => {
    if (promptId) {
      fetchPromptAndAgents();
    }
  }, [promptId]);

  const fetchPromptAndAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get('promptweaver', `/prompts/${promptId}`, {});
      
      setPrompt(response.prompt);
      setAgents(response.agents);
    } catch (err: any) {
      console.error('Error fetching prompt and agents:', err);
      setError(err.message || 'Failed to load prompt and agents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner"></div>
              <p className="mt-4 text-gray-600">Loading agents...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => fetchPromptAndAgents()}
                    className="mt-2 text-sm text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">{prompt?.title || 'Untitled Prompt'}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {prompt?.content?.substring(0, 200)}
                  {prompt?.content?.length > 200 ? '...' : ''}
                </p>
                
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={() => setShowOrchestration(!showOrchestration)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {showOrchestration ? 'Hide Orchestration' : 'Show Orchestration'}
                  </button>
                </div>
              </div>

              {showOrchestration && prompt?.orchestration && (
                <div className="mb-8">
                  <OrchestrationViewer orchestration={prompt.orchestration} agents={agents} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent: any) => (
                  <AgentTile
                    key={agent.id}
                    agent={agent}
                    promptId={promptId as string}
                    onUpdate={fetchPromptAndAgents}
                  />
                ))}
              </div>

              {agents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No agents found for this prompt.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Authenticator>
  );
}

export default AgentsPage;

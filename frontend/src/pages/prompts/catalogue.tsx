import { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import Link from 'next/link';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CustomAuthComponents } from '../../components/CustomAuthComponents';

function PromptCatalogue() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const components = CustomAuthComponents();

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async (key: string | null = null) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: any = { limit: 20 };
      if (key) {
        queryParams.lastKey = key;
      }

      const response = await API.get('promptweaver', '/prompts/public', { queryStringParameters: queryParams });
      
      if (key) {
        setPrompts(prev => [...prev, ...response.prompts]);
      } else {
        setPrompts(response.prompts);
      }
      
      setLastKey(response.lastKey);
      setHasMore(!!response.lastKey);
    } catch (err: any) {
      console.error('Error fetching prompts:', err);
      setError(err.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchPrompts();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await API.get('promptweaver', '/prompts/search', {
        queryStringParameters: { keyword: searchTerm },
      });
      
      setPrompts(response.prompts);
      setLastKey(null);
      setHasMore(false);
    } catch (err: any) {
      console.error('Error searching prompts:', err);
      setError(err.message || 'Failed to search prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (lastKey) {
      fetchPrompts(lastKey);
    }
  };

  const handleFork = async (promptId: string) => {
    try {
      setLoading(true);
      
      const response = await API.post('promptweaver', `/prompts/${promptId}/fork`, {});
      
      // Redirect to the forked prompt's agents page
      window.location.href = `/prompts/${response.prompt.id}/agents`;
    } catch (err: any) {
      console.error('Error forking prompt:', err);
      setError(err.message || 'Failed to fork prompt');
      setLoading(false);
    }
  };

  return (
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Prompt Catalogue</h1>
            <p className="mt-1 text-sm text-gray-500">
              Browse and fork public prompts created by the community
            </p>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword, title, or tag..."
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {prompts.map((prompt) => (
                <li key={prompt.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-indigo-600 truncate">
                          {prompt.title || 'Untitled Prompt'}
                        </h3>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <a
                              href={prompt.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-indigo-500"
                            >
                              {prompt.linkedinUrl.split('/').pop()}
                            </a>
                          </div>
                          <div className="ml-6 flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            {new Date(prompt.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Link
                          href={`/prompts/${prompt.id}/agents`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Agents
                        </Link>
                        <button
                          onClick={() => handleFork(prompt.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Fork
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {prompt.content}
                      </p>
                    </div>
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="mt-2">
                        {prompt.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            
            {prompts.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-gray-500">
                No prompts found.
              </div>
            )}
            
            {loading && (
              <div className="px-4 py-6 text-center">
                <div className="spinner"></div>
                <p className="mt-2 text-gray-500">Loading prompts...</p>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="px-4 py-4 sm:px-6 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Authenticator>
  );
}

export default PromptCatalogue;

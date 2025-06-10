import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';

interface PromptFormData {
  content: string;
  title: string;
  tags: string;
  isPublic: boolean;
}

function SubmitPrompt() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<PromptFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const onSubmit = async (data: PromptFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Convert tags string to array
      const tagsArray = data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      
      if (isDemoMode) {
        // Demo mode - use predefined mock data
        console.log('Demo mode: Using mock data');
        
        // Wait 2 seconds to simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use a predefined ID that matches our mock data
        const mockIds = ['demo-1', 'demo-2', 'demo-3', 'demo-4'];
        const mockId = mockIds[Math.floor(Math.random() * mockIds.length)];
        
        // Redirect to the agents page
        router.push(`/prompts/${mockId}/agents`);
      } else {
        // Real API call
        console.log('Production mode: Calling API');
        
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}` // Assuming token is stored in localStorage
          },
          body: JSON.stringify({
            content: data.content,
            title: data.title,
            tags: tagsArray,
            isPublic: data.isPublic,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit prompt');
        }
        
        const result = await response.json();
        router.push(`/prompts/${result.prompt.id}/agents`);
      }
    } catch (err: any) {
      console.error('Error submitting prompt:', err);
      setError(err.message || 'Failed to submit prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count words in the prompt
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Submit a Raw Prompt</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter a detailed prompt (at least 250 words) to generate structured multi-agent breakdowns.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Give your prompt a title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Prompt Content
            </label>
            <div className="mt-1">
              <textarea
                id="content"
                rows={10}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your detailed prompt here (at least 250 words)..."
                {...register('content', {
                  required: 'Prompt content is required',
                  validate: (value) =>
                    countWords(value) >= 250 || 'Prompt must be at least 250 words',
                })}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Word count: {countWords(watch('content') || '')} / 250 minimum
            </p>
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="ai, prompt-engineering, multi-agent"
              {...register('tags')}
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isPublic"
                type="checkbox"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                {...register('isPublic')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isPublic" className="font-medium text-gray-700">
                Make this prompt public
              </label>
              <p className="text-gray-500">
                Public prompts will be visible in the catalogue for others to view and fork.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Generating Agents...' : 'Generate Agents'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitPrompt;

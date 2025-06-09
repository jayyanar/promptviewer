import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { API } from 'aws-amplify';
import { useRouter } from 'next/router';
import SubmitPrompt from '../../src/pages/prompts/submit';
import { useAuth } from '../../src/contexts/AuthContext';

// Mock the dependencies
jest.mock('aws-amplify');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../src/contexts/AuthContext');
jest.mock('@aws-amplify/ui-react', () => ({
  withAuthenticator: (component: any) => component,
}));

describe('SubmitPrompt Page', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      linkedinUrl: 'https://linkedin.com/in/testuser',
    });
  });

  it('renders the form correctly', () => {
    render(<SubmitPrompt />);

    expect(screen.getByText('Submit a Raw Prompt')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prompt Content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Make this prompt public/i)).toBeInTheDocument();
    expect(screen.getByText('Generate Agents')).toBeInTheDocument();
  });

  it('validates minimum word count', async () => {
    render(<SubmitPrompt />);

    // Fill out the form with a short prompt
    const titleInput = screen.getByLabelText(/Title/i);
    const contentInput = screen.getByLabelText(/Prompt Content/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(contentInput, { target: { value: 'This is too short' } });
    
    // Submit the form
    const submitButton = screen.getByText('Generate Agents');
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Prompt must be at least 250 words/i)).toBeInTheDocument();
    });
    
    // API should not have been called
    expect(API.post).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    // Mock API.post
    (API.post as jest.Mock).mockResolvedValue({
      prompt: {
        id: 'new-prompt-id',
        title: 'Test Title',
      },
      agents: [
        { id: 'agent-1', name: 'Agent 1' },
      ],
    });

    render(<SubmitPrompt />);

    // Fill out the form with valid data
    const titleInput = screen.getByLabelText(/Title/i);
    const contentInput = screen.getByLabelText(/Prompt Content/i);
    const tagsInput = screen.getByLabelText(/Tags/i);
    const publicCheckbox = screen.getByLabelText(/Make this prompt public/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Generate a prompt with at least 250 words
    const longPrompt = 'This is a test prompt. '.repeat(50);
    fireEvent.change(contentInput, { target: { value: longPrompt } });
    
    fireEvent.change(tagsInput, { target: { value: 'test, prompt, ai' } });
    fireEvent.click(publicCheckbox);
    
    // Submit the form
    const submitButton = screen.getByText('Generate Agents');
    fireEvent.click(submitButton);
    
    // Check that API was called correctly
    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        'promptweaver',
        '/prompts',
        expect.objectContaining({
          body: {
            content: longPrompt,
            title: 'Test Title',
            tags: ['test', 'prompt', 'ai'],
            isPublic: true,
          },
        })
      );
    });
    
    // Check that we were redirected
    expect(mockRouter.push).toHaveBeenCalledWith('/prompts/new-prompt-id/agents');
  });

  it('handles API errors', async () => {
    // Mock API.post to throw an error
    (API.post as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<SubmitPrompt />);

    // Fill out the form with valid data
    const titleInput = screen.getByLabelText(/Title/i);
    const contentInput = screen.getByLabelText(/Prompt Content/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    // Generate a prompt with at least 250 words
    const longPrompt = 'This is a test prompt. '.repeat(50);
    fireEvent.change(contentInput, { target: { value: longPrompt } });
    
    // Submit the form
    const submitButton = screen.getByText('Generate Agents');
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });
    
    // We should not have been redirected
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { API } from 'aws-amplify';
import AgentTile from '../../src/components/AgentTile';
import { useAuth } from '../../src/contexts/AuthContext';

// Mock the API and Auth context
jest.mock('aws-amplify');
jest.mock('../../src/contexts/AuthContext');

describe('AgentTile Component', () => {
  const mockAgent = {
    id: 'test-agent-id',
    name: 'Test Agent',
    role: 'Test Role',
    behaviors: ['Behavior 1', 'Behavior 2'],
    constraints: ['Constraint 1'],
    examples: [{ input: 'Test input', output: 'Test output' }],
  };

  const mockPromptId = 'test-prompt-id';
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      linkedinUrl: 'https://linkedin.com/in/testuser',
    });
  });

  it('renders agent information correctly', () => {
    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
    expect(screen.getByText('Behavior 1')).toBeInTheDocument();
    expect(screen.getByText('Behavior 2')).toBeInTheDocument();
    expect(screen.getByText('Constraint 1')).toBeInTheDocument();
    expect(screen.getByText('Input:')).toBeInTheDocument();
    expect(screen.getByText('Test input')).toBeInTheDocument();
    expect(screen.getByText('Output:')).toBeInTheDocument();
    expect(screen.getByText('Test output')).toBeInTheDocument();
  });

  it('switches to edit mode when Edit button is clicked', () => {
    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that input fields are now visible
    expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Behavior 1\nBehavior 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Constraint 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Input: Test input\nOutput: Test output')).toBeInTheDocument();
  });

  it('cancels editing when Cancel button is clicked', () => {
    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change a value
    const nameInput = screen.getByDisplayValue('Test Agent');
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
    expect(screen.getByDisplayValue('Changed Name')).toBeInTheDocument();

    // Cancel editing
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check that we're back to view mode with original values
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Changed Name')).not.toBeInTheDocument();
  });

  it('saves changes when Save New Version button is clicked', async () => {
    // Mock API.put
    (API.put as jest.Mock).mockResolvedValue({
      agent: {
        ...mockAgent,
        name: 'Updated Agent',
      },
      version: {
        id: 'new-version-id',
        versionNumber: 2,
      },
    });

    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change values
    const nameInput = screen.getByDisplayValue('Test Agent');
    fireEvent.change(nameInput, { target: { value: 'Updated Agent' } });

    // Save changes
    const saveButton = screen.getByText('Save New Version');
    fireEvent.click(saveButton);

    // Check that API was called correctly
    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith(
        'promptweaver',
        `/agents/${mockAgent.id}`,
        expect.objectContaining({
          body: expect.objectContaining({
            name: 'Updated Agent',
          }),
        })
      );
    });

    // Check that onUpdate was called
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('validates behaviors (must be 2-5)', async () => {
    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change behaviors to only one item
    const behaviorsInput = screen.getByDisplayValue('Behavior 1\nBehavior 2');
    fireEvent.change(behaviorsInput, { target: { value: 'Only one behavior' } });

    // Try to save
    const saveButton = screen.getByText('Save New Version');
    fireEvent.click(saveButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Behaviors must contain 2-5 items')).toBeInTheDocument();
    });

    // API should not have been called
    expect(API.put).not.toHaveBeenCalled();
  });

  it('fetches version history when View History button is clicked', async () => {
    // Mock API.get for versions
    (API.get as jest.Mock).mockResolvedValue({
      versions: [
        {
          id: 'version-1',
          versionNumber: 1,
          createdAt: new Date().toISOString(),
          linkedinUrl: 'https://linkedin.com/in/editor1',
          role: 'Original Role',
        },
        {
          id: 'version-2',
          versionNumber: 2,
          createdAt: new Date().toISOString(),
          linkedinUrl: 'https://linkedin.com/in/editor2',
          role: 'Updated Role',
        },
      ],
    });

    render(
      <AgentTile
        agent={mockAgent}
        promptId={mockPromptId}
        onUpdate={mockOnUpdate}
      />
    );

    // Click View History
    const historyButton = screen.getByText('View History');
    fireEvent.click(historyButton);

    // Check that API was called correctly
    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        'promptweaver',
        `/agents/${mockAgent.id}/versions`,
        {}
      );
    });

    // Check that version history modal is shown
    expect(screen.getByText('Version History')).toBeInTheDocument();
    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Original Role')).toBeInTheDocument();
    expect(screen.getByText('Updated Role')).toBeInTheDocument();
  });
});

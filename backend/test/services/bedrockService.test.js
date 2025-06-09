/**
 * Tests for bedrockService.js
 */
const AWS = require('aws-sdk-mock');
const { TextEncoder, TextDecoder } = require('util');
const { generateAgents, generateOrchestration } = require('../../src/services/bedrockService');

// Mock the AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-bedrock-runtime');
  
  return {
    ...originalModule,
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    InvokeModelCommand: jest.fn(),
  };
});

describe('bedrockService', () => {
  const validPrompt = 'This is a test prompt. '.repeat(50); // 250+ words
  const shortPrompt = 'This is too short';
  
  // Mock Claude response
  const mockClaudeResponse = {
    body: new TextEncoder().encode(JSON.stringify({
      content: [
        {
          text: JSON.stringify({
            agents: [
              {
                name: 'Test Agent',
                role: 'Test Role',
                behaviors: ['Behavior 1', 'Behavior 2'],
                constraints: ['Constraint 1'],
                examples: [{ input: 'Test input', output: 'Test output' }],
              },
            ],
            orchestration: {
              flow: 'test: flow',
            },
          }),
        },
      ],
    })),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the BedrockRuntimeClient.send method
    const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
    BedrockRuntimeClient.mockImplementation(() => ({
      send: jest.fn().mockResolvedValue(mockClaudeResponse),
    }));
  });
  
  describe('generateAgents', () => {
    it('should reject prompts under 250 words', async () => {
      await expect(generateAgents(shortPrompt)).rejects.toThrow('250 words');
    });
    
    it('should call Claude with the correct payload', async () => {
      const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
      
      await generateAgents(validPrompt);
      
      expect(InvokeModelCommand).toHaveBeenCalledWith(expect.objectContaining({
        modelId: expect.stringContaining('claude'),
        body: expect.stringContaining(validPrompt),
      }));
    });
    
    it('should parse Claude response correctly', async () => {
      const result = await generateAgents(validPrompt);
      
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('orchestration');
      expect(result.agents[0]).toHaveProperty('id');
      expect(result.agents[0].name).toBe('Test Agent');
    });
    
    it('should handle Claude errors', async () => {
      const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
      BedrockRuntimeClient.mockImplementation(() => ({
        send: jest.fn().mockRejectedValue(new Error('Claude error')),
      }));
      
      await expect(generateAgents(validPrompt)).rejects.toThrow('Failed to generate agents');
    });
    
    it('should handle malformed Claude responses', async () => {
      const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
      BedrockRuntimeClient.mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({
          body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: 'Not valid JSON' }],
          })),
        }),
      }));
      
      await expect(generateAgents(validPrompt)).rejects.toThrow();
    });
  });
  
  describe('generateOrchestration', () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        role: 'Role 1',
      },
      {
        id: 'agent-2',
        name: 'Agent 2',
        role: 'Role 2',
      },
    ];
    
    it('should reject empty agent lists', async () => {
      await expect(generateOrchestration([])).rejects.toThrow('No agents provided');
    });
    
    it('should call Claude with agent summaries', async () => {
      const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
      
      await generateOrchestration(mockAgents);
      
      expect(InvokeModelCommand).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.stringContaining(JSON.stringify([
          { id: 'agent-1', name: 'Agent 1', role: 'Role 1' },
          { id: 'agent-2', name: 'Agent 2', role: 'Role 2' },
        ])),
      }));
    });
    
    it('should return orchestration flow', async () => {
      const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
      BedrockRuntimeClient.mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({
          body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: 'flow: test' }],
          })),
        }),
      }));
      
      const result = await generateOrchestration(mockAgents);
      
      expect(result).toHaveProperty('flow');
      expect(result.flow).toBe('flow: test');
    });
  });
});

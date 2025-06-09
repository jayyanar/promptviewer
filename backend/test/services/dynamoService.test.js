/**
 * Tests for dynamoService.js
 */
const AWS = require('aws-sdk-mock');
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../../src/services/dynamoService');
const { TABLES } = require('../../src/models/schema');

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('dynamoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AWS.restore();
  });

  describe('savePrompt', () => {
    it('should save a prompt to DynamoDB', async () => {
      const mockPromptData = {
        userId: 'test-user',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        content: 'Test prompt content',
        title: 'Test Prompt',
        tags: ['test'],
        isPublic: true,
      };

      AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
        expect(params.TableName).toBe(TABLES.PROMPTS);
        expect(params.Item.id).toBe('mock-uuid');
        expect(params.Item.userId).toBe(mockPromptData.userId);
        expect(params.Item.content).toBe(mockPromptData.content);
        callback(null, {});
      });

      const result = await dynamoService.savePrompt(mockPromptData);
      
      expect(result.id).toBe('mock-uuid');
      expect(result.userId).toBe(mockPromptData.userId);
      expect(result.content).toBe(mockPromptData.content);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('saveAgents', () => {
    it('should save agents and create initial versions', async () => {
      const promptId = 'test-prompt-id';
      const mockAgents = [
        {
          name: 'Test Agent',
          role: 'Test Role',
          behaviors: ['Behavior 1', 'Behavior 2'],
          constraints: ['Constraint 1'],
          examples: [{ input: 'Test input', output: 'Test output' }],
          userId: 'test-user',
          linkedinUrl: 'https://linkedin.com/in/testuser',
        },
      ];

      let putCallCount = 0;
      AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
        putCallCount++;
        
        if (putCallCount === 1) {
          // First call should be for version
          expect(params.TableName).toBe(TABLES.VERSIONS);
          expect(params.Item.agentId).toBe('mock-uuid');
          expect(params.Item.versionNumber).toBe(1);
        } else {
          // Second call should be for agent
          expect(params.TableName).toBe(TABLES.AGENTS);
          expect(params.Item.id).toBe('mock-uuid');
          expect(params.Item.promptId).toBe(promptId);
          expect(params.Item.currentVersionId).toBeDefined();
        }
        
        callback(null, {});
      });

      const result = await dynamoService.saveAgents(promptId, mockAgents);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('mock-uuid');
      expect(result[0].promptId).toBe(promptId);
      expect(result[0].name).toBe(mockAgents[0].name);
      expect(putCallCount).toBe(2); // 1 version + 1 agent
    });
  });

  describe('saveOrchestration', () => {
    it('should update a prompt with orchestration data', async () => {
      const promptId = 'test-prompt-id';
      const mockOrchestration = { flow: 'test flow' };

      AWS.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
        expect(params.TableName).toBe(TABLES.PROMPTS);
        expect(params.Key.id).toBe(promptId);
        expect(params.ExpressionAttributeValues[':o']).toEqual(mockOrchestration);
        callback(null, { Attributes: { id: promptId, orchestration: mockOrchestration } });
      });

      const result = await dynamoService.saveOrchestration(promptId, mockOrchestration);
      
      expect(result.id).toBe(promptId);
      expect(result.orchestration).toEqual(mockOrchestration);
    });
  });

  describe('getPrompt', () => {
    it('should get a prompt by ID', async () => {
      const promptId = 'test-prompt-id';
      const mockPrompt = { id: promptId, content: 'Test content' };

      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        expect(params.TableName).toBe(TABLES.PROMPTS);
        expect(params.Key.id).toBe(promptId);
        callback(null, { Item: mockPrompt });
      });

      const result = await dynamoService.getPrompt(promptId);
      
      expect(result).toEqual(mockPrompt);
    });
  });

  describe('getAgentsForPrompt', () => {
    it('should get agents for a prompt', async () => {
      const promptId = 'test-prompt-id';
      const mockAgents = [
        { id: 'agent-1', promptId, name: 'Agent 1' },
        { id: 'agent-2', promptId, name: 'Agent 2' },
      ];

      AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
        expect(params.TableName).toBe(TABLES.AGENTS);
        expect(params.KeyConditionExpression).toContain('promptId');
        expect(params.ExpressionAttributeValues[':pid']).toBe(promptId);
        callback(null, { Items: mockAgents });
      });

      const result = await dynamoService.getAgentsForPrompt(promptId);
      
      expect(result).toEqual(mockAgents);
    });
  });

  describe('saveAgentVersion', () => {
    it('should create a new version and update the agent', async () => {
      const agentId = 'test-agent-id';
      const mockVersionData = {
        userId: 'test-user',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        name: 'Updated Agent',
        role: 'Updated Role',
        behaviors: ['Updated Behavior 1', 'Updated Behavior 2'],
        constraints: ['Updated Constraint 1'],
        examples: [{ input: 'Updated input', output: 'Updated output' }],
      };

      // Mock get agent
      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        expect(params.TableName).toBe(TABLES.AGENTS);
        expect(params.Key.id).toBe(agentId);
        callback(null, { Item: { id: agentId, name: 'Original Agent' } });
      });

      // Mock query versions
      AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
        expect(params.TableName).toBe(TABLES.VERSIONS);
        expect(params.KeyConditionExpression).toContain('agentId');
        callback(null, { Items: [{ versionNumber: 1 }] });
      });

      // Mock put version
      AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
        expect(params.TableName).toBe(TABLES.VERSIONS);
        expect(params.Item.agentId).toBe(agentId);
        expect(params.Item.versionNumber).toBe(2);
        callback(null, {});
      });

      // Mock update agent
      AWS.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
        expect(params.TableName).toBe(TABLES.AGENTS);
        expect(params.Key.id).toBe(agentId);
        expect(params.ExpressionAttributeValues[':n']).toBe(mockVersionData.name);
        callback(null, { Attributes: { id: agentId, name: mockVersionData.name } });
      });

      const result = await dynamoService.saveAgentVersion(agentId, mockVersionData);
      
      expect(result.version.agentId).toBe(agentId);
      expect(result.version.versionNumber).toBe(2);
      expect(result.agent.id).toBe(agentId);
      expect(result.agent.name).toBe(mockVersionData.name);
    });
  });

  describe('forkPrompt', () => {
    it('should create a fork of a prompt and its agents', async () => {
      const promptId = 'original-prompt-id';
      const userId = 'fork-user-id';
      const linkedinUrl = 'https://linkedin.com/in/forkuser';
      
      const originalPrompt = {
        id: promptId,
        userId: 'original-user-id',
        content: 'Original content',
        title: 'Original Title',
        tags: ['original'],
        orchestration: { flow: 'original flow' },
      };
      
      const originalAgents = [
        { id: 'agent-1', promptId, name: 'Agent 1' },
        { id: 'agent-2', promptId, name: 'Agent 2' },
      ];

      // Mock get prompt
      AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
        expect(params.TableName).toBe(TABLES.PROMPTS);
        expect(params.Key.id).toBe(promptId);
        callback(null, { Item: originalPrompt });
      });

      // Mock query agents
      AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
        expect(params.TableName).toBe(TABLES.AGENTS);
        expect(params.KeyConditionExpression).toContain('promptId');
        callback(null, { Items: originalAgents });
      });

      // Mock put prompt
      AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
        expect(params.TableName).toBe(TABLES.PROMPTS);
        expect(params.Item.forkedFromId).toBe(promptId);
        expect(params.Item.userId).toBe(userId);
        callback(null, {});
      });

      // Mock dynamoService.saveAgents
      const saveAgentsSpy = jest.spyOn(dynamoService, 'saveAgents').mockResolvedValue([
        { id: 'new-agent-1', promptId: 'mock-uuid', name: 'Agent 1' },
        { id: 'new-agent-2', promptId: 'mock-uuid', name: 'Agent 2' },
      ]);

      const result = await dynamoService.forkPrompt(promptId, userId, linkedinUrl);
      
      expect(result.prompt.forkedFromId).toBe(promptId);
      expect(result.prompt.userId).toBe(userId);
      expect(result.prompt.content).toBe(originalPrompt.content);
      expect(saveAgentsSpy).toHaveBeenCalled();
      expect(result.agents.length).toBe(2);
    });
  });
});

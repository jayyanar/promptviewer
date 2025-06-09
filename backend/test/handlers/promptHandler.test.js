/**
 * Tests for promptHandler.js
 */
const AWS = require('aws-sdk-mock');
const { submitPrompt, getPrompt, getPublicPrompts, searchPrompts, forkPrompt } = require('../../src/handlers/promptHandler');
const bedrockService = require('../../src/services/bedrockService');
const dynamoService = require('../../src/services/dynamoService');

// Mock the services
jest.mock('../../src/services/bedrockService');
jest.mock('../../src/services/dynamoService');

describe('promptHandler', () => {
  // Common test data
  const userId = 'test-user-id';
  const linkedinUrl = 'https://www.linkedin.com/in/testuser';
  const validPrompt = 'This is a test prompt. '.repeat(50); // 250+ words
  const shortPrompt = 'This is too short';
  
  // Mock event with Cognito authorizer
  const createEvent = (body, pathParams = {}, queryParams = {}) => ({
    body: JSON.stringify(body),
    pathParameters: pathParams,
    queryStringParameters: queryParams,
    requestContext: {
      authorizer: {
        claims: {
          sub: userId,
          'custom:linkedin_url': linkedinUrl,
        },
      },
    },
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('submitPrompt', () => {
    it('should reject prompts under 250 words', async () => {
      const event = createEvent({ content: shortPrompt });
      const response = await submitPrompt(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('250 words');
    });
    
    it('should accept and store valid prompts', async () => {
      const mockPrompt = { id: 'prompt-id', content: validPrompt };
      const mockAgents = [{ id: 'agent-id', name: 'Test Agent' }];
      const mockOrchestration = { flow: 'test flow' };
      
      dynamoService.savePrompt.mockResolvedValue(mockPrompt);
      bedrockService.generateAgents.mockResolvedValue({
        agents: mockAgents,
        orchestration: mockOrchestration,
      });
      dynamoService.saveAgents.mockResolvedValue(mockAgents);
      
      const event = createEvent({
        content: validPrompt,
        title: 'Test Prompt',
        tags: ['test'],
        isPublic: true,
      });
      
      const response = await submitPrompt(event);
      
      expect(response.statusCode).toBe(200);
      expect(dynamoService.savePrompt).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        linkedinUrl,
        content: validPrompt,
      }));
      expect(bedrockService.generateAgents).toHaveBeenCalledWith(validPrompt);
      expect(dynamoService.saveAgents).toHaveBeenCalled();
      expect(dynamoService.saveOrchestration).toHaveBeenCalled();
    });
    
    it('should handle errors from Bedrock', async () => {
      bedrockService.generateAgents.mockRejectedValue(new Error('Bedrock error'));
      
      const event = createEvent({ content: validPrompt });
      const response = await submitPrompt(event);
      
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body).error).toContain('Bedrock error');
    });
  });
  
  describe('getPrompt', () => {
    it('should return 404 for non-existent prompts', async () => {
      dynamoService.getPrompt.mockResolvedValue(null);
      
      const event = createEvent({}, { id: 'non-existent-id' });
      const response = await getPrompt(event);
      
      expect(response.statusCode).toBe(404);
    });
    
    it('should return prompt and its agents', async () => {
      const mockPrompt = { id: 'prompt-id', content: validPrompt };
      const mockAgents = [{ id: 'agent-id', name: 'Test Agent' }];
      
      dynamoService.getPrompt.mockResolvedValue(mockPrompt);
      dynamoService.getAgentsForPrompt.mockResolvedValue(mockAgents);
      
      const event = createEvent({}, { id: 'prompt-id' });
      const response = await getPrompt(event);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.prompt).toEqual(mockPrompt);
      expect(body.agents).toEqual(mockAgents);
    });
  });
  
  describe('getPublicPrompts', () => {
    it('should return public prompts', async () => {
      const mockPrompts = [
        { id: 'prompt-1', isPublic: true },
        { id: 'prompt-2', isPublic: true },
      ];
      
      dynamoService.getPublicPrompts.mockResolvedValue({
        prompts: mockPrompts,
        lastEvaluatedKey: 'last-key',
      });
      
      const event = createEvent({}, {}, { limit: '10' });
      const response = await getPublicPrompts(event);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.prompts).toEqual(mockPrompts);
      expect(body.lastKey).toBe('last-key');
    });
  });
  
  describe('searchPrompts', () => {
    it('should require a keyword', async () => {
      const event = createEvent({}, {}, {});
      const response = await searchPrompts(event);
      
      expect(response.statusCode).toBe(400);
    });
    
    it('should search prompts by keyword', async () => {
      const mockPrompts = [
        { id: 'prompt-1', title: 'Test Keyword' },
        { id: 'prompt-2', content: 'Contains keyword' },
      ];
      
      dynamoService.searchPrompts.mockResolvedValue(mockPrompts);
      
      const event = createEvent({}, {}, { keyword: 'keyword' });
      const response = await searchPrompts(event);
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.prompts).toEqual(mockPrompts);
    });
  });
  
  describe('forkPrompt', () => {
    it('should fork a prompt', async () => {
      const mockForkedPrompt = {
        prompt: { id: 'forked-id', forkedFromId: 'original-id' },
        agents: [{ id: 'agent-id', name: 'Test Agent' }],
      };
      
      dynamoService.forkPrompt.mockResolvedValue(mockForkedPrompt);
      
      const event = createEvent({}, { id: 'original-id' });
      const response = await forkPrompt(event);
      
      expect(response.statusCode).toBe(200);
      expect(dynamoService.forkPrompt).toHaveBeenCalledWith('original-id', userId, linkedinUrl);
      expect(JSON.parse(response.body)).toEqual(mockForkedPrompt);
    });
  });
});

/**
 * Service for interacting with DynamoDB
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { TABLES } = require('../models/schema');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Save a raw prompt to DynamoDB
 * @param {Object} promptData - The prompt data to save
 * @returns {Promise<Object>} - The saved prompt with ID
 */
async function savePrompt(promptData) {
  const timestamp = Date.now();
  const promptId = uuidv4();
  
  const item = {
    id: promptId,
    userId: promptData.userId,
    linkedinUrl: promptData.linkedinUrl,
    content: promptData.content,
    title: promptData.title || 'Untitled Prompt',
    isPublic: promptData.isPublic || false,
    tags: promptData.tags || [],
    createdAt: timestamp,
    updatedAt: timestamp,
    forkedFromId: promptData.forkedFromId || null,
    forkedFromUserId: promptData.forkedFromUserId || null,
  };

  const command = new PutCommand({
    TableName: TABLES.PROMPTS,
    Item: item,
  });

  await docClient.send(command);
  return item;
}

/**
 * Save generated agents to DynamoDB
 * @param {string} promptId - The parent prompt ID
 * @param {Array} agents - The list of agents to save
 * @returns {Promise<Array>} - The saved agents
 */
async function saveAgents(promptId, agents) {
  const timestamp = Date.now();
  const savedAgents = [];

  for (const agent of agents) {
    const agentId = agent.id || uuidv4();
    const versionId = uuidv4();
    
    // Create initial version
    const versionItem = {
      id: versionId,
      agentId,
      userId: agent.userId,
      linkedinUrl: agent.linkedinUrl,
      versionNumber: 1,
      name: agent.name,
      role: agent.role,
      behaviors: agent.behaviors,
      constraints: agent.constraints,
      examples: agent.examples,
      createdAt: timestamp,
    };

    const versionCommand = new PutCommand({
      TableName: TABLES.VERSIONS,
      Item: versionItem,
    });

    // Create agent with reference to version
    const agentItem = {
      id: agentId,
      promptId,
      name: agent.name,
      role: agent.role,
      behaviors: agent.behaviors,
      constraints: agent.constraints,
      examples: agent.examples,
      createdAt: timestamp,
      updatedAt: timestamp,
      currentVersionId: versionId,
    };

    const agentCommand = new PutCommand({
      TableName: TABLES.AGENTS,
      Item: agentItem,
    });

    await docClient.send(versionCommand);
    await docClient.send(agentCommand);
    savedAgents.push(agentItem);
  }

  return savedAgents;
}

/**
 * Save orchestration plan to DynamoDB (as part of prompt)
 * @param {string} promptId - The prompt ID
 * @param {Object} orchestration - The orchestration data
 * @returns {Promise<Object>} - The updated prompt
 */
async function saveOrchestration(promptId, orchestration) {
  const command = new UpdateCommand({
    TableName: TABLES.PROMPTS,
    Key: { id: promptId },
    UpdateExpression: 'set orchestration = :o, updatedAt = :t',
    ExpressionAttributeValues: {
      ':o': orchestration,
      ':t': Date.now(),
    },
    ReturnValues: 'ALL_NEW',
  });

  const response = await docClient.send(command);
  return response.Attributes;
}

/**
 * Get a prompt by ID
 * @param {string} promptId - The prompt ID
 * @returns {Promise<Object>} - The prompt data
 */
async function getPrompt(promptId) {
  const command = new GetCommand({
    TableName: TABLES.PROMPTS,
    Key: { id: promptId },
  });

  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Get agents for a prompt
 * @param {string} promptId - The prompt ID
 * @returns {Promise<Array>} - The agents for this prompt
 */
async function getAgentsForPrompt(promptId) {
  const command = new QueryCommand({
    TableName: TABLES.AGENTS,
    KeyConditionExpression: 'promptId = :pid',
    ExpressionAttributeValues: {
      ':pid': promptId,
    },
  });

  const response = await docClient.send(command);
  return response.Items;
}

/**
 * Save a new version of an agent
 * @param {string} agentId - The agent ID
 * @param {Object} versionData - The version data
 * @returns {Promise<Object>} - The saved version
 */
async function saveAgentVersion(agentId, versionData) {
  // Get the current agent
  const getAgentCommand = new GetCommand({
    TableName: TABLES.AGENTS,
    Key: { id: agentId },
  });

  const agentResponse = await docClient.send(getAgentCommand);
  const agent = agentResponse.Item;
  
  if (!agent) {
    throw new Error('Agent not found');
  }

  // Get the latest version number
  const queryVersionsCommand = new QueryCommand({
    TableName: TABLES.VERSIONS,
    KeyConditionExpression: 'agentId = :aid',
    ExpressionAttributeValues: {
      ':aid': agentId,
    },
    ProjectionExpression: 'versionNumber',
    ScanIndexForward: false, // descending order
    Limit: 1,
  });

  const versionsResponse = await docClient.send(queryVersionsCommand);
  const latestVersion = versionsResponse.Items[0]?.versionNumber || 0;
  const newVersionNumber = latestVersion + 1;
  
  // Create new version
  const versionId = uuidv4();
  const timestamp = Date.now();
  
  const versionItem = {
    id: versionId,
    agentId,
    userId: versionData.userId,
    linkedinUrl: versionData.linkedinUrl,
    versionNumber: newVersionNumber,
    name: versionData.name,
    role: versionData.role,
    behaviors: versionData.behaviors,
    constraints: versionData.constraints,
    examples: versionData.examples,
    createdAt: timestamp,
  };

  const putVersionCommand = new PutCommand({
    TableName: TABLES.VERSIONS,
    Item: versionItem,
  });

  // Update agent with new version reference
  const updateAgentCommand = new UpdateCommand({
    TableName: TABLES.AGENTS,
    Key: { id: agentId },
    UpdateExpression: 'set name = :n, role = :r, behaviors = :b, constraints = :c, examples = :e, currentVersionId = :vid, updatedAt = :t',
    ExpressionAttributeValues: {
      ':n': versionData.name,
      ':r': versionData.role,
      ':b': versionData.behaviors,
      ':c': versionData.constraints,
      ':e': versionData.examples,
      ':vid': versionId,
      ':t': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  });

  await docClient.send(putVersionCommand);
  const updateResponse = await docClient.send(updateAgentCommand);
  
  return {
    version: versionItem,
    agent: updateResponse.Attributes,
  };
}

/**
 * Get version history for an agent
 * @param {string} agentId - The agent ID
 * @returns {Promise<Array>} - The version history
 */
async function getAgentVersions(agentId) {
  const command = new QueryCommand({
    TableName: TABLES.VERSIONS,
    KeyConditionExpression: 'agentId = :aid',
    ExpressionAttributeValues: {
      ':aid': agentId,
    },
    ScanIndexForward: false, // descending order (newest first)
  });

  const response = await docClient.send(command);
  return response.Items;
}

/**
 * Get public prompts for the catalogue
 * @param {number} limit - Maximum number of prompts to return
 * @param {string} lastEvaluatedKey - For pagination
 * @returns {Promise<Object>} - The prompts and pagination token
 */
async function getPublicPrompts(limit = 20, lastEvaluatedKey = null) {
  const params = {
    TableName: TABLES.PROMPTS,
    FilterExpression: 'isPublic = :public',
    ExpressionAttributeValues: {
      ':public': true,
    },
    Limit: limit,
  };

  if (lastEvaluatedKey) {
    params.ExclusiveStartKey = lastEvaluatedKey;
  }

  const command = new QueryCommand(params);
  const response = await docClient.send(command);
  
  return {
    prompts: response.Items,
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Search prompts by keyword
 * @param {string} keyword - The search keyword
 * @param {number} limit - Maximum number of prompts to return
 * @returns {Promise<Array>} - The matching prompts
 */
async function searchPrompts(keyword, limit = 20) {
  // Note: In a real implementation, this would use a more sophisticated search mechanism
  // like DynamoDB GSI + begins_with or contains, or even better, OpenSearch
  const scanCommand = new QueryCommand({
    TableName: TABLES.PROMPTS,
    FilterExpression: 'contains(title, :keyword) OR contains(content, :keyword) OR contains(tags, :keyword)',
    ExpressionAttributeValues: {
      ':keyword': keyword.toLowerCase(),
      ':public': true,
    },
    Limit: limit,
  });

  const response = await docClient.send(scanCommand);
  return response.Items;
}

/**
 * Fork a prompt
 * @param {string} promptId - The original prompt ID
 * @param {string} userId - The user ID of the forker
 * @param {string} linkedinUrl - The LinkedIn URL of the forker
 * @returns {Promise<Object>} - The forked prompt
 */
async function forkPrompt(promptId, userId, linkedinUrl) {
  // Get the original prompt
  const originalPrompt = await getPrompt(promptId);
  if (!originalPrompt) {
    throw new Error('Prompt not found');
  }

  // Get the agents for the original prompt
  const originalAgents = await getAgentsForPrompt(promptId);

  // Create a new prompt as a fork
  const timestamp = Date.now();
  const newPromptId = uuidv4();
  
  const newPrompt = {
    id: newPromptId,
    userId,
    linkedinUrl,
    content: originalPrompt.content,
    title: `Fork of: ${originalPrompt.title}`,
    isPublic: false, // Default to private for forks
    tags: originalPrompt.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
    forkedFromId: promptId,
    forkedFromUserId: originalPrompt.userId,
    orchestration: originalPrompt.orchestration,
  };

  const putPromptCommand = new PutCommand({
    TableName: TABLES.PROMPTS,
    Item: newPrompt,
  });

  await docClient.send(putPromptCommand);

  // Create copies of all agents
  const newAgents = originalAgents.map(agent => ({
    ...agent,
    id: uuidv4(),
    promptId: newPromptId,
    userId,
    linkedinUrl,
  }));

  await saveAgents(newPromptId, newAgents);

  return {
    prompt: newPrompt,
    agents: newAgents,
  };
}

module.exports = {
  savePrompt,
  saveAgents,
  saveOrchestration,
  getPrompt,
  getAgentsForPrompt,
  saveAgentVersion,
  getAgentVersions,
  getPublicPrompts,
  searchPrompts,
  forkPrompt,
};

/**
 * Handler for prompt-related API endpoints
 */
const { generateAgents } = require('../services/bedrockService');
const dynamoService = require('../services/dynamoService');

/**
 * Submit a raw prompt and generate agents
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.submitPrompt = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { content, title, tags, isPublic } = body;
    
    // Validate prompt length
    if (!content || content.split(/\s+/).length < 250) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Prompt must be at least 250 words',
        }),
      };
    }
    
    // Extract user info from Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
    const linkedinUrl = event.requestContext.authorizer.claims['custom:linkedin_url'];
    
    if (!userId || !linkedinUrl) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'User not authenticated or missing LinkedIn URL',
        }),
      };
    }
    
    // Save the raw prompt
    const promptData = {
      userId,
      linkedinUrl,
      content,
      title: title || 'Untitled Prompt',
      tags: tags || [],
      isPublic: isPublic || false,
    };
    
    const savedPrompt = await dynamoService.savePrompt(promptData);
    
    // Generate agents using Claude
    const { agents, orchestration } = await generateAgents(content);
    
    // Add user info to agents
    const agentsWithUser = agents.map(agent => ({
      ...agent,
      userId,
      linkedinUrl,
    }));
    
    // Save agents to DynamoDB
    const savedAgents = await dynamoService.saveAgents(savedPrompt.id, agentsWithUser);
    
    // Save orchestration
    await dynamoService.saveOrchestration(savedPrompt.id, orchestration);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        prompt: savedPrompt,
        agents: savedAgents,
        orchestration,
      }),
    };
  } catch (error) {
    console.error('Error in submitPrompt:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to process prompt: ${error.message}`,
      }),
    };
  }
};

/**
 * Get a prompt by ID
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.getPrompt = async (event) => {
  try {
    const promptId = event.pathParameters.id;
    
    // Get the prompt
    const prompt = await dynamoService.getPrompt(promptId);
    
    if (!prompt) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Prompt not found',
        }),
      };
    }
    
    // Get the agents for this prompt
    const agents = await dynamoService.getAgentsForPrompt(promptId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        prompt,
        agents,
      }),
    };
  } catch (error) {
    console.error('Error in getPrompt:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to get prompt: ${error.message}`,
      }),
    };
  }
};

/**
 * Get public prompts for the catalogue
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.getPublicPrompts = async (event) => {
  try {
    const limit = event.queryStringParameters?.limit || 20;
    const lastKey = event.queryStringParameters?.lastKey;
    
    const { prompts, lastEvaluatedKey } = await dynamoService.getPublicPrompts(limit, lastKey);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        prompts,
        lastKey: lastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error('Error in getPublicPrompts:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to get public prompts: ${error.message}`,
      }),
    };
  }
};

/**
 * Search prompts by keyword
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.searchPrompts = async (event) => {
  try {
    const keyword = event.queryStringParameters?.keyword;
    
    if (!keyword) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Search keyword is required',
        }),
      };
    }
    
    const prompts = await dynamoService.searchPrompts(keyword);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        prompts,
      }),
    };
  } catch (error) {
    console.error('Error in searchPrompts:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to search prompts: ${error.message}`,
      }),
    };
  }
};

/**
 * Fork a prompt
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.forkPrompt = async (event) => {
  try {
    const promptId = event.pathParameters.id;
    
    // Extract user info from Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
    const linkedinUrl = event.requestContext.authorizer.claims['custom:linkedin_url'];
    
    if (!userId || !linkedinUrl) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'User not authenticated or missing LinkedIn URL',
        }),
      };
    }
    
    // Fork the prompt
    const forkedPrompt = await dynamoService.forkPrompt(promptId, userId, linkedinUrl);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(forkedPrompt),
    };
  } catch (error) {
    console.error('Error in forkPrompt:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to fork prompt: ${error.message}`,
      }),
    };
  }
};

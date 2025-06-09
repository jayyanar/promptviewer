/**
 * Handler for agent-related API endpoints
 */
const dynamoService = require('../services/dynamoService');

/**
 * Get an agent by ID
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.getAgent = async (event) => {
  try {
    const agentId = event.pathParameters.id;
    
    // Get the agent
    const agent = await dynamoService.getAgent(agentId);
    
    if (!agent) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Agent not found',
        }),
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(agent),
    };
  } catch (error) {
    console.error('Error in getAgent:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to get agent: ${error.message}`,
      }),
    };
  }
};

/**
 * Update an agent (create new version)
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.updateAgent = async (event) => {
  try {
    const agentId = event.pathParameters.id;
    const body = JSON.parse(event.body);
    const { name, role, behaviors, constraints, examples } = body;
    
    // Validate behaviors (2-5 items)
    if (!Array.isArray(behaviors) || behaviors.length < 2 || behaviors.length > 5) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Behaviors must contain 2-5 items',
        }),
      };
    }
    
    // Validate examples
    if (!Array.isArray(examples) || examples.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'At least one example is required',
        }),
      };
    }
    
    for (const example of examples) {
      if (!example.input || !example.output) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Each example must have input and output',
          }),
        };
      }
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
    
    // Create new version
    const versionData = {
      userId,
      linkedinUrl,
      name,
      role,
      behaviors,
      constraints,
      examples,
    };
    
    const result = await dynamoService.saveAgentVersion(agentId, versionData);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in updateAgent:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to update agent: ${error.message}`,
      }),
    };
  }
};

/**
 * Get version history for an agent
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.getAgentVersions = async (event) => {
  try {
    const agentId = event.pathParameters.id;
    
    const versions = await dynamoService.getAgentVersions(agentId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        versions,
      }),
    };
  } catch (error) {
    console.error('Error in getAgentVersions:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: `Failed to get agent versions: ${error.message}`,
      }),
    };
  }
};

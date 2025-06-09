/**
 * Service for interacting with AWS Bedrock Claude 3.7
 */
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { v4: uuidv4 } = require('uuid');

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Claude 3.7 model ID
const MODEL_ID = 'anthropic.claude-3-7-sonnet-20240620-v1:0';

/**
 * Generate agent prompts from a raw prompt using Claude 3.7
 * @param {string} rawPrompt - The user's raw prompt (≥250 words)
 * @returns {Promise<Object>} - Generated agents and orchestration plan
 */
async function generateAgents(rawPrompt) {
  if (!rawPrompt || rawPrompt.split(/\s+/).length < 250) {
    throw new Error('Prompt must be at least 250 words');
  }

  const systemPrompt = `You are an expert prompt engineer specializing in breaking down complex prompts into multiple agents following Anthropic best practices. 
  
Your task is to analyze the user's raw prompt and break it down into 2-5 specialized agents, each with a clear role, behaviors, constraints, and examples.

For each agent, provide:
1. Name: A descriptive name for the agent
2. Role: A clear description of the agent's purpose
3. Behaviors: 2-5 specific guidelines for how the agent should behave
4. Constraints: Safety constraints and limitations
5. Examples: 1-3 input/output examples showing how the agent should respond

Additionally, create an orchestration plan showing how these agents should interact, in YAML format.

Format your response as a JSON object with the following structure:
{
  "agents": [
    {
      "name": "Agent name",
      "role": "Agent role description",
      "behaviors": ["Behavior 1", "Behavior 2", ...],
      "constraints": ["Constraint 1", "Constraint 2", ...],
      "examples": [
        {
          "input": "Example input",
          "output": "Example output"
        }
      ]
    }
  ],
  "orchestration": {
    "flow": "YAML string representing the agent interaction flow"
  }
}`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: rawPrompt,
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new Error('Invalid response from Claude');
    }

    // Parse the response content as JSON
    const content = responseBody.content[0].text;
    const parsedContent = JSON.parse(content);

    // Validate the response structure
    if (!parsedContent.agents || !Array.isArray(parsedContent.agents) || parsedContent.agents.length === 0) {
      throw new Error('Claude did not generate any agents');
    }

    // Add IDs to each agent
    const agentsWithIds = parsedContent.agents.map(agent => ({
      ...agent,
      id: uuidv4(),
    }));

    return {
      agents: agentsWithIds,
      orchestration: parsedContent.orchestration,
    };
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    throw new Error(`Failed to generate agents: ${error.message}`);
  }
}

/**
 * Generate an orchestration plan for a set of agents
 * @param {Array} agents - The list of agents
 * @returns {Promise<Object>} - Orchestration plan
 */
async function generateOrchestration(agents) {
  if (!agents || !Array.isArray(agents) || agents.length === 0) {
    throw new Error('No agents provided for orchestration');
  }

  const agentSummaries = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
  }));

  const systemPrompt = `You are an expert in multi-agent orchestration. 
  
Your task is to create an orchestration plan for a set of agents, showing how they should interact to accomplish the overall task.

Format your response as a YAML string representing the flow between agents.`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 2048,
    temperature: 0.5,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Create an orchestration plan for these agents: ${JSON.stringify(agentSummaries)}`,
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new Error('Invalid response from Claude');
    }

    // Extract the YAML content
    const yamlContent = responseBody.content[0].text;

    return {
      flow: yamlContent,
    };
  } catch (error) {
    console.error('Error generating orchestration:', error);
    throw new Error(`Failed to generate orchestration: ${error.message}`);
  }
}

module.exports = {
  generateAgents,
  generateOrchestration,
};

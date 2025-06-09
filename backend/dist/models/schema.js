/**
 * DynamoDB schema definitions for PromptWeaver
 */

const TABLES = {
  PROMPTS: 'PromptWeaver-Prompts',
  AGENTS: 'PromptWeaver-Agents',
  VERSIONS: 'PromptWeaver-Versions',
  USERS: 'PromptWeaver-Users',
};

/**
 * Raw Prompt Schema
 * - Stores the original user prompt and metadata
 */
const promptSchema = {
  id: String, // UUID
  userId: String, // Cognito User ID
  linkedinUrl: String, // User's LinkedIn URL
  content: String, // Raw prompt text (≥250 words)
  title: String, // Optional title
  isPublic: Boolean, // Whether prompt is visible in catalogue
  tags: [String], // Optional tags for searching
  createdAt: Number, // Timestamp
  updatedAt: Number, // Timestamp
  forkedFromId: String, // Optional - ID of original prompt if forked
  forkedFromUserId: String, // Optional - User ID of original prompt creator
};

/**
 * Agent Schema
 * - Stores the generated agent prompts
 */
const agentSchema = {
  id: String, // UUID
  promptId: String, // Reference to parent prompt
  name: String, // Agent name
  role: String, // Agent role description
  behaviors: [String], // 2-5 behavior guidelines
  constraints: [String], // Safety constraints
  examples: [
    {
      input: String,
      output: String,
    },
  ],
  createdAt: Number, // Timestamp
  updatedAt: Number, // Timestamp
  currentVersionId: String, // Reference to current version
};

/**
 * Version Schema
 * - Stores version history for agent edits
 */
const versionSchema = {
  id: String, // UUID
  agentId: String, // Reference to parent agent
  userId: String, // User who created this version
  linkedinUrl: String, // LinkedIn URL of editor
  versionNumber: Number, // Incremental version number
  name: String, // Agent name at this version
  role: String, // Agent role at this version
  behaviors: [String], // Behaviors at this version
  constraints: [String], // Constraints at this version
  examples: [
    {
      input: String,
      output: String,
    },
  ],
  createdAt: Number, // Timestamp
};

/**
 * User Schema
 * - Stores additional user metadata beyond Cognito
 */
const userSchema = {
  id: String, // Cognito User ID
  linkedinUrl: String, // LinkedIn URL (required)
  displayName: String, // Optional display name
  createdAt: Number, // Timestamp
  updatedAt: Number, // Timestamp
};

/**
 * Orchestration Schema
 * - Stored as part of the prompt document
 */
const orchestrationSchema = {
  flow: String, // YAML or JSON string representing the flow
  diagram: String, // Optional - serialized diagram data
};

module.exports = {
  TABLES,
  promptSchema,
  agentSchema,
  versionSchema,
  userSchema,
  orchestrationSchema,
};

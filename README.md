# PromptWeaver

PromptWeaver is a full-stack web application that helps users break down complex prompts into multiple agents following Anthropic best practices.

![PromptWeaver Architecture](/generated-diagrams/promptweaver_architecture.png)

## Application Overview

- **Input**: Raw user prompts (≥250 words)
- **Process**:
  - Uses AWS Bedrock Claude 3.7 to chunk prompt into multiple agents
  - Each agent follows Anthropic best practices: includes role, behavior (2–5), constraints, and examples
  - Displays each agent as an editable tile (card-based UI)
  - Enables prompt versioning and attribution using Cognito (LinkedIn required)
  - Generates orchestration plan using LLM and renders it in YAML/graph format

## Tech Stack

### Backend
- AWS Lambda (Node.js)
- API Gateway
- DynamoDB for raw prompts, agents, versions, users
- Bedrock (Claude 3.7) integration

### Frontend
- Next.js with Tailwind CSS
- Authenticated routes using Cognito
- Pages:
  - Prompt Submission
  - Agent Editor & History Viewer
  - Orchestration Plan Viewer
  - Public Prompt Catalogue

### Auth
- Cognito with custom attribute `linkedin_url` required on signup

## Getting Started

### Prerequisites
- Node.js (v18+)
- AWS Account
- AWS CLI configured

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/promptweaver.git
cd promptweaver
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install infrastructure dependencies
cd ../infrastructure
npm install
```

3. Configure AWS resources
```bash
cd ../infrastructure
npx cdk deploy
```

4. Start the development server
```bash
# Start frontend
cd ../frontend
npm run dev
```

## Features

1. **Raw Prompt Submission**: Submit detailed prompts (≥250 words)
2. **Claude-Powered Agent Generation**: Generate agent system prompts from raw prompts
3. **Editable Agent Tiles with Versioning**: View and edit each generated agent prompt
4. **Multi-Agent Orchestration Planner**: Recommend how agents should collaborate
5. **Public Prompt Catalogue**: Browse published raw prompts and their agent breakdowns
6. **Cognito Login with LinkedIn Enforcement**: Authenticate with LinkedIn profile
7. **Forking & Attribution**: Fork and edit prompts submitted by others

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Getting Started

### Prerequisites
- Node.js (v18+)
- AWS Account
- AWS CLI configured

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/promptweaver.git
cd promptweaver
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure AWS resources
```bash
cd ../infrastructure
npm install
npx cdk deploy
```

4. Start the development server
```bash
# Start frontend
cd ../frontend
npm run dev
```

## Features

1. **Raw Prompt Submission**: Submit detailed prompts (≥250 words)
2. **Claude-Powered Agent Generation**: Generate agent system prompts from raw prompts
3. **Editable Agent Tiles with Versioning**: View and edit each generated agent prompt
4. **Multi-Agent Orchestration Planner**: Recommend how agents should collaborate
5. **Public Prompt Catalogue**: Browse published raw prompts and their agent breakdowns
6. **Cognito Login with LinkedIn Enforcement**: Authenticate with LinkedIn profile
7. **Forking & Attribution**: Fork and edit prompts submitted by others

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.


# 📘 PromptWeaver MVP - Behavior-Driven Development (BDD) Specification

This document defines the BDD for the MVP version of PromptWeaver, covering raw prompt submission, multi-agent prompt generation, versioning, orchestration, authentication, and public catalogue features.

---

## 🧾 Feature 1: Submit Raw Prompt

### Feature: Raw Prompt Submission

```gherkin
As an authenticated user
I want to submit a detailed prompt (≥250 words)
So that I can generate structured multi-agent breakdowns from it
```

#### Scenario: Valid raw prompt submission
```gherkin
Given I am logged in via Cognito and have a LinkedIn URL
When I input a prompt longer than 250 words
And I click "Generate Agents"
Then the system should:
  - Save the raw prompt in DynamoDB
  - Call Claude v3.7 via Bedrock
  - Receive structured agent prompts in response
  - Display each agent as a tile for editing
```

#### Scenario: Invalid prompt length
```gherkin
When I input a prompt shorter than 250 words
Then I should see an error: "Prompt must be at least 250 words"
```

---

## 🧾 Feature 2: Claude-Powered Agent Generation

### Feature: Agent Prompt Generation (Anthropic Style)

```gherkin
As a user
I want Claude to generate agent system prompts from my raw prompt
So that each task is clearly broken down and structured
```

#### Scenario: Claude responds with Anthropic-style agents
```gherkin
Given my prompt is submitted
Then the system should:
  - Break it into multiple agents
  - Each with:
    - Role
    - Behavior guidelines (2–5 items)
    - Safety constraints
    - One or more example inputs/outputs
```

#### Scenario: Response failure from Claude
```gherkin
If Claude fails to respond or JSON is malformed
Then I should see an error and a retry option
```

---

## 🧾 Feature 3: Editable Agent Tiles with Versioning

### Feature: Agent Tile Editing

```gherkin
As a user
I want to view and edit each generated agent prompt
So that I can improve or personalize the system prompt
```

#### Scenario: View generated agents
```gherkin
When agent tiles are displayed
Then each tile should show:
  - Agent name
  - Task summary
  - Structured system prompt (role, behavior, constraints, examples)
  - "Edit" and "Save New Version" buttons
```

#### Scenario: Save edited agent as new version
```gherkin
Given I modify any part of an agent prompt
When I click "Save New Version"
Then the system should:
  - Create a new version record in DynamoDB
  - Store my Cognito user ID and LinkedIn
  - Update the tile to show latest version
  - Keep older versions accessible via version history
```

#### Scenario: View version history
```gherkin
When I click "View History" on an agent tile
Then I should see:
  - All previous versions
  - Timestamps
  - Editors (with LinkedIn links)
  - Option to compare and restore
```

---

## 🧾 Feature 4: Multi-Agent Orchestration Planner

### Feature: Orchestration Flow Recommendation

```gherkin
As a user
I want the system to recommend how agents should collaborate
So that I can plan the data flow and task order between them
```

#### Scenario: Generate orchestration plan
```gherkin
When agents are generated
Then Claude should also return:
  - Task flow (e.g., sequential, parallel)
  - YAML or JSON structure of agent interaction
```

#### Scenario: View orchestration plan
```gherkin
Then I should see:
  - A flow chart or YAML viewer
  - Each step labeled with the agent name
  - Inputs/outputs between agents
```

---

## 🧾 Feature 5: Public Prompt Catalogue

### Feature: Prompt Explorer

```gherkin
As any user
I want to browse published raw prompts and their agent breakdowns
So that I can learn from and reuse others' work
```

#### Scenario: View all public prompts
```gherkin
When I visit the prompt catalogue
Then I should see:
  - A list of prompt tiles
  - Agent count, author, tags
  - “View Agents” button on each
```

#### Scenario: Search prompts
```gherkin
When I search by keyword or tag
Then the results should filter by:
  - Prompt title
  - Prompt content
  - Agent name
  - Tags
```

---

## 🧾 Feature 6: Cognito Login with LinkedIn Enforcement

### Feature: LinkedIn-Verified Authentication

```gherkin
As a platform admin
I want all users to be authenticated with a LinkedIn profile
So that we maintain traceable, high-trust contributions
```

#### Scenario: LinkedIn required at signup
```gherkin
When a new user signs up
Then they must provide a valid LinkedIn URL
Or be prevented from registering
```

#### Scenario: Identity tagging on edits
```gherkin
When a user edits an agent or creates a version
Then their name and LinkedIn URL should be stored with the version
And visible on the tile as "Edited by"
```

---

## 🧾 Feature 7: Forking & Attribution

### Feature: Forking Existing Prompts

```gherkin
As a user
I want to fork and edit prompts submitted by others
So that I can improve or personalize their workflows
```

#### Scenario: Fork a prompt
```gherkin
When I click "Fork" on any public prompt
Then I get a copy under my account
And any new edits are attributed to me
```

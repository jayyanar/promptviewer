
# 🧪 PromptWeaver MVP - Test-Driven Development (TDD) Specification

This document defines the TDD specification derived from the BDD for PromptWeaver MVP. It covers unit, integration, and functional tests needed to ensure all features work as expected.

---

## ✅ Module 1: Raw Prompt Submission

### Unit Tests
- [ ] Should reject prompts under 250 words
- [ ] Should accept and store valid prompts in DynamoDB
- [ ] Should attach Cognito user ID and LinkedIn to the prompt entry

### Integration Tests
- [ ] Should call Claude v3.7 with valid payload
- [ ] Should handle Claude failure (timeout, malformed JSON)

### Functional Tests
- [ ] End-to-end test: submit prompt → see agent tiles

---

## ✅ Module 2: Claude Agent Generator

### Unit Tests
- [ ] Should validate JSON response from Claude
- [ ] Should parse JSON into agent schema correctly
- [ ] Should raise errors if response is incomplete or missing required fields

### Integration Tests
- [ ] Claude invocation should return at least one agent
- [ ] Each agent should have role, behavior, constraints, examples

---

## ✅ Module 3: Agent Tile Editor

### Unit Tests
- [ ] Should detect changes in tile input fields
- [ ] Should increment version number correctly
- [ ] Should validate behavior list (2–5 items)
- [ ] Should validate example input/output format

### Integration Tests
- [ ] Should store new version in DynamoDB
- [ ] Should link version to correct user ID and LinkedIn
- [ ] Should not allow anonymous edits

### Functional Tests
- [ ] Save edit → reload → new version is shown
- [ ] Click “History” → shows version list

---

## ✅ Module 4: Orchestration Planner

### Unit Tests
- [ ] Should validate flow schema (YAML or JSON)
- [ ] Should ensure referenced agents exist

### Integration Tests
- [ ] Claude returns orchestration plan
- [ ] Plan is saved in DynamoDB under correct prompt ID

### Functional Tests
- [ ] View YAML plan → agents and flow are readable
- [ ] Save edited plan → updates correctly

---

## ✅ Module 5: Prompt Catalogue

### Unit Tests
- [ ] Should retrieve only public prompts
- [ ] Should include author metadata and tags

### Integration Tests
- [ ] Search API filters by prompt title and tags
- [ ] Each prompt fetch returns agent summary

### Functional Tests
- [ ] User sees list of prompts
- [ ] User can click “View Agents” and navigate to tiles

---

## ✅ Module 6: Cognito + LinkedIn Auth

### Unit Tests
- [ ] Pre-signup Lambda validates LinkedIn URL
- [ ] Denies signup if URL is missing or malformed

### Integration Tests
- [ ] Authenticated JWT includes LinkedIn as custom claim
- [ ] Agent edits attach correct user metadata

### Functional Tests
- [ ] New user must enter LinkedIn
- [ ] Edits show editor LinkedIn link publicly

---

## ✅ Module 7: Forking System

### Unit Tests
- [ ] Forked prompt copies prompt + agent structure
- [ ] New prompt is assigned to current user

### Integration Tests
- [ ] Fork saves independently of original prompt
- [ ] Edit to forked version does not affect source

### Functional Tests
- [ ] User clicks fork → sees editable version
- [ ] Changes appear under user’s profile

---

## ✅ TDD Checklist Summary

| Module                    | Unit | Integration | Functional |
|---------------------------|------|-------------|------------|
| Raw Prompt Submission     | ✅    | ✅           | ✅          |
| Claude Agent Generator    | ✅    | ✅           | ✅          |
| Agent Editor              | ✅    | ✅           | ✅          |
| Orchestration Planner     | ✅    | ✅           | ✅          |
| Prompt Catalogue          | ✅    | ✅           | ✅          |
| Cognito + LinkedIn Auth   | ✅    | ✅           | ✅          |
| Forking System            | ✅    | ✅           | ✅          |

/**
 * Tests for validators.js
 */
const {
  validatePromptContent,
  validateAgentBehaviors,
  validateAgentExamples,
  validateLinkedInUrl,
} = require('../../src/utils/validators');

describe('validators', () => {
  describe('validatePromptContent', () => {
    it('should reject empty content', () => {
      expect(validatePromptContent('')).toBe(false);
      expect(validatePromptContent(null)).toBe(false);
      expect(validatePromptContent(undefined)).toBe(false);
    });

    it('should reject content with less than 250 words', () => {
      const shortContent = 'This is a short prompt.';
      expect(validatePromptContent(shortContent)).toBe(false);
    });

    it('should accept content with at least 250 words', () => {
      const longContent = 'This is a test prompt. '.repeat(50);
      expect(validatePromptContent(longContent)).toBe(true);
    });
  });

  describe('validateAgentBehaviors', () => {
    it('should reject non-array behaviors', () => {
      expect(validateAgentBehaviors('not an array')).toBe(false);
      expect(validateAgentBehaviors(null)).toBe(false);
      expect(validateAgentBehaviors(undefined)).toBe(false);
    });

    it('should reject arrays with less than 2 behaviors', () => {
      expect(validateAgentBehaviors([])).toBe(false);
      expect(validateAgentBehaviors(['Single behavior'])).toBe(false);
    });

    it('should reject arrays with more than 5 behaviors', () => {
      expect(validateAgentBehaviors(['1', '2', '3', '4', '5', '6'])).toBe(false);
    });

    it('should accept arrays with 2-5 behaviors', () => {
      expect(validateAgentBehaviors(['1', '2'])).toBe(true);
      expect(validateAgentBehaviors(['1', '2', '3'])).toBe(true);
      expect(validateAgentBehaviors(['1', '2', '3', '4'])).toBe(true);
      expect(validateAgentBehaviors(['1', '2', '3', '4', '5'])).toBe(true);
    });
  });

  describe('validateAgentExamples', () => {
    it('should reject non-array examples', () => {
      expect(validateAgentExamples('not an array')).toBe(false);
      expect(validateAgentExamples(null)).toBe(false);
      expect(validateAgentExamples(undefined)).toBe(false);
    });

    it('should reject empty arrays', () => {
      expect(validateAgentExamples([])).toBe(false);
    });

    it('should reject examples without input or output', () => {
      expect(validateAgentExamples([{ input: 'Input' }])).toBe(false);
      expect(validateAgentExamples([{ output: 'Output' }])).toBe(false);
      expect(validateAgentExamples([{ input: '', output: 'Output' }])).toBe(false);
      expect(validateAgentExamples([{ input: 'Input', output: '' }])).toBe(false);
    });

    it('should accept valid examples', () => {
      expect(validateAgentExamples([{ input: 'Input', output: 'Output' }])).toBe(true);
      expect(validateAgentExamples([
        { input: 'Input 1', output: 'Output 1' },
        { input: 'Input 2', output: 'Output 2' },
      ])).toBe(true);
    });
  });

  describe('validateLinkedInUrl', () => {
    it('should reject empty URLs', () => {
      expect(validateLinkedInUrl('')).toBe(false);
      expect(validateLinkedInUrl(null)).toBe(false);
      expect(validateLinkedInUrl(undefined)).toBe(false);
    });

    it('should reject invalid LinkedIn URLs', () => {
      expect(validateLinkedInUrl('https://example.com')).toBe(false);
      expect(validateLinkedInUrl('https://linkedin.com')).toBe(false);
      expect(validateLinkedInUrl('https://linkedin.com/company/example')).toBe(false);
      expect(validateLinkedInUrl('linkedin.com/in/username')).toBe(false);
    });

    it('should accept valid LinkedIn URLs', () => {
      expect(validateLinkedInUrl('https://linkedin.com/in/username')).toBe(true);
      expect(validateLinkedInUrl('https://www.linkedin.com/in/username')).toBe(true);
      expect(validateLinkedInUrl('https://linkedin.com/in/user-name')).toBe(true);
      expect(validateLinkedInUrl('https://www.linkedin.com/in/username/')).toBe(true);
    });
  });
});

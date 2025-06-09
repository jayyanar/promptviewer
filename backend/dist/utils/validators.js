/**
 * Validation utilities for PromptWeaver
 */

/**
 * Validate prompt content
 * @param {string} content - The prompt content
 * @returns {boolean} - Whether the content is valid
 */
function validatePromptContent(content) {
  if (!content) {
    return false;
  }
  
  // Check word count (at least 250 words)
  const wordCount = content.trim().split(/\s+/).length;
  return wordCount >= 250;
}

/**
 * Validate agent behaviors (must be 2-5 items)
 * @param {Array<string>} behaviors - The behaviors list
 * @returns {boolean} - Whether the behaviors are valid
 */
function validateAgentBehaviors(behaviors) {
  if (!Array.isArray(behaviors)) {
    return false;
  }
  
  return behaviors.length >= 2 && behaviors.length <= 5;
}

/**
 * Validate agent examples (must have at least one with input and output)
 * @param {Array<Object>} examples - The examples list
 * @returns {boolean} - Whether the examples are valid
 */
function validateAgentExamples(examples) {
  if (!Array.isArray(examples) || examples.length === 0) {
    return false;
  }
  
  return examples.every(example => example.input && example.output);
}

/**
 * Validate LinkedIn URL format
 * @param {string} url - The LinkedIn URL
 * @returns {boolean} - Whether the URL is valid
 */
function validateLinkedInUrl(url) {
  if (!url) {
    return false;
  }
  
  const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
  return linkedinRegex.test(url);
}

module.exports = {
  validatePromptContent,
  validateAgentBehaviors,
  validateAgentExamples,
  validateLinkedInUrl,
};

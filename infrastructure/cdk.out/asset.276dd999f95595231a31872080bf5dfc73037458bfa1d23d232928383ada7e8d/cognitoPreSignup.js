/**
 * Cognito Pre-Signup Lambda Trigger
 * Validates that users provide a LinkedIn URL during signup
 */

exports.handler = async (event) => {
  console.log('Pre-signup event:', JSON.stringify(event, null, 2));
  
  // Get the user attributes
  const { request } = event;
  const { userAttributes } = request;
  
  // Check if LinkedIn URL is provided
  const linkedinUrl = userAttributes['custom:linkedin_url'];
  
  if (!linkedinUrl) {
    throw new Error('LinkedIn URL is required for registration');
  }
  
  // Basic validation of LinkedIn URL format
  const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
  
  if (!linkedinRegex.test(linkedinUrl)) {
    throw new Error('Invalid LinkedIn URL format. Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)');
  }
  
  // Allow the signup to proceed
  return event;
};

// Scheduling Service - Generates scheduling links and tokens
const crypto = require('crypto');

/**
 * Generate a scheduling token for a candidate
 * Simple token based on email (can be enhanced with actual crypto tokens)
 * @param {string} email - Candidate email
 * @returns {string} - Scheduling token
 */
function generateSchedulingToken(email) {
  return Buffer.from(email).toString('base64').substring(0, 16);
}

/**
 * Generate a scheduling link for a candidate
 * @param {string} candidateId - Airtable record ID
 * @param {string} email - Candidate email
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} - Full scheduling URL
 */
function generateSchedulingLink(candidateId, email, baseUrl) {
  const token = generateSchedulingToken(email);
  return `${baseUrl}/schedule-interview.html?id=${candidateId}&token=${token}`;
}

/**
 * Verify a scheduling token
 * @param {string} token - Token to verify
 * @param {string} email - Expected email
 * @returns {boolean} - True if token is valid
 */
function verifySchedulingToken(token, email) {
  const expectedToken = generateSchedulingToken(email);
  return token === expectedToken;
}

module.exports = {
  generateSchedulingToken,
  generateSchedulingLink,
  verifySchedulingToken,
};

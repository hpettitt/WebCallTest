/**
 * Generate Scheduling Link Script
 * 
 * This script helps you generate a scheduling link for a candidate.
 * Run it with: node scripts/generate-scheduling-link.js
 */

require('dotenv').config();
const schedulingService = require('../services/scheduling');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Generate Candidate Scheduling Link ===\n');

rl.question('Enter candidate Airtable Record ID (e.g., recXXXXXXXXXXXXXX): ', (candidateId) => {
  rl.question('Enter candidate email: ', (email) => {
    rl.question('Enter base URL (default: http://localhost:3000): ', (baseUrl) => {
      
      const url = baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const schedulingLink = schedulingService.generateSchedulingLink(
        candidateId.trim(),
        email.trim(),
        url.trim()
      );
      
      console.log('\n✓ Scheduling link generated successfully!\n');
      console.log('Send this link to the candidate:');
      console.log('━'.repeat(80));
      console.log(schedulingLink);
      console.log('━'.repeat(80));
      console.log('\nThe candidate can use this link to schedule their interview.\n');
      
      rl.close();
    });
  });
});

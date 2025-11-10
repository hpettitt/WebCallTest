// Airtable Service - Handles all database operations
const Airtable = require('airtable');

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

const tableName = process.env.AIRTABLE_TABLE_NAME || 'Candidates';

/**
 * Find a candidate by token
 * @param {string} token - The unique token to search for
 * @returns {Promise<Object|null>} - Candidate record or null if not found
 */
async function findCandidateByToken(token) {
  try {
    const records = await base(tableName)
      .select({
        filterByFormula: `{Token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      id: record.id,
      token: record.fields.Token,
      email: record.fields.Email,
      name: record.fields['Candidate Name'] || record.fields.Name,
      appointmentTime: record.fields['Interview Time'] || record.fields.AppointmentTime,
      status: record.fields.Status || 'pending',
      interviewCompleted: record.fields.InterviewCompleted || false,
      ...record.fields
    };
  } catch (error) {
    console.error('Error finding candidate by token:', error);
    throw error;
  }
}

/**
 * Validate if current time is within appointment window
 * Window: 5 minutes before to 30 minutes after appointment time
 * @param {string} appointmentTime - ISO datetime string
 * @returns {Object} - { valid: boolean, message: string, minutesUntil: number }
 */
function validateAppointmentTime(appointmentTime) {
  const now = new Date();
  const appointment = new Date(appointmentTime);
  
  // Calculate time difference in minutes
  const diffMs = now - appointment;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Valid window: -5 minutes (before) to +30 minutes (after)
  const BEFORE_WINDOW = -5;
  const AFTER_WINDOW = 30;
  
  if (diffMinutes < BEFORE_WINDOW) {
    // Too early
    const minutesUntil = Math.abs(diffMinutes);
    return {
      valid: false,
      message: `Interview window opens in ${minutesUntil} minutes`,
      minutesUntil: minutesUntil,
      tooEarly: true
    };
  }
  
  if (diffMinutes > AFTER_WINDOW) {
    // Too late
    const minutesLate = diffMinutes - AFTER_WINDOW;
    return {
      valid: false,
      message: `Interview window closed ${minutesLate} minutes ago`,
      minutesLate: minutesLate,
      tooLate: true
    };
  }
  
  // Within valid window
  return {
    valid: true,
    message: 'Interview window is active',
    minutesIntoWindow: diffMinutes + 5, // Minutes since window opened
    appointmentTime: appointment.toISOString()
  };
}

/**
 * Update candidate status in Airtable
 * @param {string} recordId - Airtable record ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated record
 */
async function updateCandidate(recordId, updates) {
  try {
    const updatedRecord = await base(tableName).update(recordId, updates);
    return {
      id: updatedRecord.id,
      ...updatedRecord.fields
    };
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
}

/**
 * Get all candidates (for dashboard)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of candidate records
 */
async function getAllCandidates(filters = {}) {
  try {
    let selectOptions = {
      sort: [{ field: 'AppointmentTime', direction: 'desc' }]
    };
    
    if (filters.status) {
      selectOptions.filterByFormula = `{Status} = '${filters.status}'`;
    }
    
    const records = await base(tableName)
      .select(selectOptions)
      .all();
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Error getting candidates:', error);
    throw error;
  }
}

module.exports = {
  findCandidateByToken,
  validateAppointmentTime,
  updateCandidate,
  getAllCandidates
};

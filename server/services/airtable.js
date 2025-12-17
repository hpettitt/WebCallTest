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
      // CV/Resume fields
      cvUrl: record.fields['CV URL'] || record.fields['Resume URL'] || record.fields.CV || null,
      cvText: record.fields['CV Text'] || record.fields['Resume Text'] || null,
      cvSummary: record.fields['CV Summary'] || record.fields['Resume Summary'] || null,
      // Additional candidate info that might be useful for interview
      experience: record.fields['Years of Experience'] || record.fields.Experience || null,
      position: record.fields['Position Applied'] || record.fields.Position || null,
      skills: record.fields.Skills || null,
      education: record.fields.Education || null,
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
function validateAppointmentTime(appointmentTime, timezoneOffsetMinutes = 0) {
  const now = new Date();
  const appointment = new Date(appointmentTime);
  
  // Airtable stores times in UTC (with Z suffix)
  // The appointmentTime is already in UTC, so we use it directly
  // The timezoneOffsetMinutes is the user's local offset from UTC (e.g., -60 for UTC-1)
  // We don't need to adjust the appointment time since it's already in UTC
  
  // Debug logging
  console.log(`\n🕐 APPOINTMENT TIME VALIDATION`);
  console.log(`   Current time (server UTC): ${now.toISOString()}`);
  console.log(`   Appointment time (UTC): ${appointmentTime}`);
  console.log(`   Appointment parsed: ${appointment.toISOString()}`);
  console.log(`   User timezone offset: ${timezoneOffsetMinutes} minutes`);
  
  // Calculate time difference in minutes
  const diffMs = now - appointment;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  console.log(`   Difference: ${diffMs}ms = ${diffMinutes} minutes`);
  
  // Valid window: -5 minutes (before) to +30 minutes (after)
  const BEFORE_WINDOW = -5;
  const AFTER_WINDOW = 30;
  
  if (diffMinutes < BEFORE_WINDOW) {
    // Too early
    const minutesUntil = Math.abs(diffMinutes);
    
    // Calculate days, hours, and minutes
    const days = Math.floor(minutesUntil / (60 * 24));
    const hours = Math.floor((minutesUntil % (60 * 24)) / 60);
    const minutes = minutesUntil % 60;
    
    // Build time string
    let timeString = '';
    if (days > 0) {
      timeString += `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      if (timeString) timeString += ', ';
      timeString += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes > 0 || timeString === '') {
      if (timeString) timeString += ', and ';
      timeString += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    console.log(`   ❌ TOO EARLY: ${timeString}`);
    return {
      valid: false,
      message: `Interview window opens in ${timeString}`,
      minutesUntil: minutesUntil,
      tooEarly: true
    };
  }
  
  if (diffMinutes > AFTER_WINDOW) {
    // Too late
    const minutesLate = diffMinutes - AFTER_WINDOW;
    console.log(`   ❌ TOO LATE: ${minutesLate} minutes ago`);
    return {
      valid: false,
      message: `Interview window closed ${minutesLate} minutes ago`,
      minutesLate: minutesLate,
      tooLate: true
    };
  }
  
  // Within valid window
  console.log(`   ✅ VALID: Within window`);
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

/**
 * Get candidate by ID
 * @param {string} recordId - Airtable record ID
 * @returns {Promise<Object|null>} - Candidate record or null
 */
async function getCandidateById(recordId) {
  try {
    const record = await base(tableName).find(recordId);
    
    return {
      id: record.id,
      email: record.fields.Email,
      name: record.fields['Candidate Name'] || record.fields.Name,
      interviewDate: record.fields['Interview Date'],
      interviewStatus: record.fields['Interview Status'] || record.fields.Status,
      ...record.fields
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error('Error getting candidate by ID:', error);
    throw error;
  }
}

/**
 * Find a candidate by management token
 * @param {string} managementToken - The management token to search for
 * @returns {Promise<Object|null>} - Candidate record or null if not found
 */
async function getCandidateByManagementToken(managementToken) {
  try {
    const records = await base(tableName)
      .select({
        filterByFormula: `{Management Token} = '${managementToken}'`,
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
      managementToken: record.fields['Management Token'],
      email: record.fields.Email,
      name: record.fields['Candidate Name'] || record.fields.Name,
      interviewDateTime: record.fields['Interview Time'],
      status: record.fields['Interview Status'] || record.fields.Status || 'scheduled',
      ...record.fields
    };
  } catch (error) {
    console.error('Error finding candidate by management token:', error);
    throw error;
  }
}

/**
 * Update a candidate by management token
 * @param {string} managementToken - The management token
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated candidate record
 */
async function updateCandidateByManagementToken(managementToken, updates) {
  try {
    // First find the record
    const candidate = await getCandidateByManagementToken(managementToken);
    
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Update the record
    const updatedRecords = await base(tableName).update([
      {
        id: candidate.id,
        fields: updates
      }
    ]);

    return {
      id: updatedRecords[0].id,
      ...updatedRecords[0].fields
    };
  } catch (error) {
    console.error('Error updating candidate by management token:', error);
    throw error;
  }
}

/**
 * Delete a candidate record from Airtable
 * @param {string} recordId - Airtable record ID
 * @returns {Promise<boolean>} - True if successful
 */
async function deleteCandidate(recordId) {
  try {
    await base(tableName).destroy(recordId);
    console.log(`Deleted candidate record: ${recordId}`);
    return true;
  } catch (error) {
    console.error('Error deleting candidate from Airtable:', error);
    throw error;
  }
}

module.exports = {
  findCandidateByToken,
  validateAppointmentTime,
  updateCandidate,
  getAllCandidates,
  getCandidateById,
  getCandidateByManagementToken,
  updateCandidateByManagementToken,
  deleteCandidate
};

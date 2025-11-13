// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const airtableService = require('./services/airtable');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'WebCall Interview Server',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Token Validation Endpoint
app.post('/api/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
    }

    // Find candidate by token
    const candidate = await airtableService.findCandidateByToken(token);

    if (!candidate) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid token - candidate not found'
      });
    }

    // Check if interview already completed
    if (candidate.interviewCompleted) {
      return res.status(400).json({
        valid: false,
        error: 'Interview has already been completed',
        candidate: {
          name: candidate.name,
          email: candidate.email
        }
      });
    }

    // Validate appointment time (5 min before to 30 min after)
    const timeValidation = airtableService.validateAppointmentTime(
      candidate.appointmentTime
    );

    if (!timeValidation.valid) {
      return res.status(403).json({
        valid: false,
        error: timeValidation.message,
        timeInfo: timeValidation,
        candidate: {
          name: candidate.name,
          appointmentTime: candidate.appointmentTime
        }
      });
    }

    // Token and time are valid
    res.json({
      valid: true,
      message: 'Access granted - proceed to interview',
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        appointmentTime: candidate.appointmentTime
      },
      timeInfo: timeValidation
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error during validation'
    });
  }
});

/**
 * Get VAPI credentials for interview
 * Returns API key and Assistant ID from environment variables
 */
app.post('/api/get-vapi-credentials', (req, res) => {
  try {
    const { sessionToken, candidateName } = req.body;
    
    // Log the request for debugging
    console.log('VAPI credentials requested for:', { sessionToken, candidateName });

    // Get credentials from environment variables
    const vapiKey = process.env.VAPI_API_KEY;
    const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;

    if (!vapiKey || !vapiAssistantId) {
      return res.status(500).json({
        error: 'VAPI credentials not configured on server'
      });
    }

    // Return credentials
    res.json({
      vapiKey: vapiKey,
      vapiAssistantId: vapiAssistantId,
      success: true
    });

  } catch (error) {
    console.error('Error getting VAPI credentials:', error);
    res.status(500).json({
      error: 'Server error getting VAPI credentials'
    });
  }
});

/**
 * Dashboard Configuration Endpoint
 * Returns Airtable credentials from environment variables for the dashboard
 */
app.get('/api/dashboard-config', (req, res) => {
  try {
    const airtableToken = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!airtableToken || !baseId || !tableName) {
      return res.status(500).json({
        error: 'Dashboard configuration not available'
      });
    }

    res.json({
      airtable: {
        personalAccessToken: airtableToken,
        baseId: baseId,
        tableName: tableName,
        baseUrl: 'https://api.airtable.com/v0'
      }
    });
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    res.status(500).json({ error: 'Server error getting dashboard config' });
  }
});

// Get candidate info (for dashboard)
app.get('/api/candidates', async (req, res) => {
  try {
    const { status } = req.query;
    const candidates = await airtableService.getAllCandidates({ status });
    res.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Update candidate status (accept/reject)
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedCandidate = await airtableService.updateCandidate(id, updates);
    res.json({ 
      success: true, 
      candidate: updatedCandidate 
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the server`);
});

module.exports = app;
// Enhanced VAPI Data Extraction for n8n Workflow
// Extracts transcript, summary, call statistics, and candidate info from VAPI webhook data

const inputData = $input.all()[0].json;

console.log('=== PROCESSING VAPI END-OF-CALL-REPORT ===');
console.log('Message type:', inputData.message?.type);
console.log('Call ID:', inputData.message?.call?.id);

// Extract the main message data
const message = inputData.message;
const call = message?.call;
const analysis = message?.analysis;
const artifact = message?.artifact;

// Extract transcript from multiple possible locations
let transcript = '';
if (message?.transcript) {
  transcript = message.transcript;
  console.log('📝 Found transcript in message.transcript');
} else if (artifact?.transcript) {
  transcript = artifact.transcript;
  console.log('📝 Found transcript in artifact.transcript');
} else if (call?.transcript) {
  transcript = call.transcript;
  console.log('📝 Found transcript in call.transcript');
} else {
  // Build transcript from messages if no direct transcript
  const messages = artifact?.messages || message?.messages || [];
  if (messages.length > 0) {
    transcript = messages
      .filter(msg => msg.role === 'bot' || msg.role === 'user' || msg.role === 'assistant')
      .map(msg => {
        const role = msg.role === 'bot' ? 'AI' : (msg.role === 'assistant' ? 'AI' : 'User');
        return `${role}: ${msg.message}`;
      })
      .join('\n');
    console.log('📝 Built transcript from messages array');
  }
}

// Extract summary
const summary = analysis?.summary || message?.summary || call?.summary || 'No summary available';

// Extract call statistics
const callStats = {
  // Basic call info
  callId: call?.id || message?.call?.id || 'unknown',
  duration: {
    milliseconds: message?.durationMs || 0,
    seconds: message?.durationSeconds || 0,
    minutes: message?.durationMinutes || 0
  },
  
  // Timestamps
  startedAt: message?.startedAt || call?.startedAt,
  endedAt: message?.endedAt || call?.endedAt,
  endedReason: message?.endedReason || 'unknown',
  
  // Cost breakdown
  totalCost: message?.cost || 0,
  costBreakdown: message?.costBreakdown || {},
  costs: message?.costs || [],
  
  // Performance metrics
  performance: artifact?.performanceMetrics || {},
  
  // Recording URLs
  recordingUrl: message?.recordingUrl || artifact?.recordingUrl,
  stereoRecordingUrl: message?.stereoRecordingUrl || artifact?.stereoRecordingUrl,
  logUrl: artifact?.logUrl,
  
  // Additional call details
  type: call?.type || 'unknown',
  status: call?.status || 'unknown',
  transport: call?.transport || {}
};

// Extract assistant information
const assistant = message?.assistant || {};
const assistantInfo = {
  id: assistant.id || 'unknown',
  name: assistant.name || 'Unknown Assistant',
  voice: assistant.voice || {},
  model: assistant.model || {}
};

// Extract candidate information from metadata or variable values
const candidateName = 
  call?.metadata?.candidateName || 
  assistant?.variableValues?.candidateName ||
  assistant?.variableValues?.name ||
  'Unknown Candidate';

const sessionId = 
  call?.metadata?.sessionId || 
  assistant?.variableValues?.sessionId ||
  'unknown';

// Parse interview responses from transcript
function extractInterviewResponses(transcript) {
  const responses = {};
  
  // Extract availability
  const availabilityMatch = transcript.match(/User: (.*(?:afternoon|evening|morning|available).*)/i);
  if (availabilityMatch) {
    responses.availability = availabilityMatch[1].trim();
  }
  
  // Extract experience
  const experienceMatch = transcript.match(/User: (.*(?:year|experience|daycare|children).*)/i);
  if (experienceMatch) {
    responses.experience = experienceMatch[1].trim();
  }
  
  // Extract approach to tantrums
  const approachMatch = transcript.match(/User: (.*(?:patient|calm|approach).*)/i);
  if (approachMatch) {
    responses.approach = approachMatch[1].trim();
  }
  
  // Extract housekeeping comfort
  const housekeepingMatch = transcript.match(/housekeeping.*\n.*User: (.*)/i);
  if (housekeepingMatch) {
    responses.housekeeping = housekeepingMatch[1].trim();
  }
  
  // Extract motivation
  const motivationMatch = transcript.match(/why.*interested.*Bloom Buddies.*\n.*User: (.*)/i);
  if (motivationMatch) {
    responses.motivation = motivationMatch[1].trim();
  }
  
  return responses;
}

// Structure all extracted data
const extractedData = {
  // Event information
  eventType: message?.type || 'unknown',
  timestamp: message?.timestamp || Date.now(),
  
  // Candidate information
  candidate: {
    name: candidateName,
    sessionId: sessionId,
    responses: extractInterviewResponses(transcript)
  },
  
  // Interview content
  transcript: {
    full: transcript,
    length: transcript.length,
    wordCount: transcript.split(' ').length,
    hasContent: transcript.length > 0
  },
  
  // Analysis results
  analysis: {
    summary: summary,
    successEvaluation: analysis?.successEvaluation || 'unknown',
    hasAnalysis: !!analysis
  },
  
  // Call statistics
  callStats: callStats,
  
  // Assistant information
  assistant: assistantInfo,
  
  // Raw conversation data
  conversation: {
    messages: artifact?.messages || [],
    messagesOpenAI: artifact?.messagesOpenAIFormatted || [],
    totalMessages: (artifact?.messages || []).length
  },
  
  // Processing metadata
  processing: {
    extractedAt: new Date().toISOString(),
    dataSource: 'vapi-end-of-call-report',
    hasTranscript: transcript.length > 0,
    hasSummary: summary !== 'No summary available',
    hasCallStats: !!message?.durationSeconds
  }
};

// Validation and warnings
if (!extractedData.transcript.hasContent) {
  console.warn('⚠️ WARNING: No transcript content found');
}

if (!extractedData.analysis.hasAnalysis) {
  console.warn('⚠️ WARNING: No analysis data found');
}

if (extractedData.candidate.name === 'Unknown Candidate') {
  console.warn('⚠️ WARNING: Candidate name not found in metadata');
}

// Log extraction summary
console.log('📊 EXTRACTION SUMMARY:');
console.log(`- Candidate: ${extractedData.candidate.name}`);
console.log(`- Transcript length: ${extractedData.transcript.length} characters`);
console.log(`- Call duration: ${extractedData.callStats.duration.minutes} minutes`);
console.log(`- Total cost: $${extractedData.callStats.totalCost}`);
console.log(`- Success evaluation: ${extractedData.analysis.successEvaluation}`);
console.log(`- Messages count: ${extractedData.conversation.totalMessages}`);

console.log('=== EXTRACTION COMPLETE ===');

return [{ json: { extractedData } }];
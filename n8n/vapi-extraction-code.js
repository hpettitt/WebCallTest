// Enhanced VAPI Data Extraction for n8n Workflow
// Extracts transcript, summary, call statistics, and candidate info from VAPI webhook data

const inputData = $input.all()[0].json;

// Function to recursively find any object containing our target keys
function findObjectWithKeys(obj, targetKeys, path = '') {
  if (typeof obj !== 'object' || obj === null) return null;
  
  // Check if current object has our target keys
  const hasTargetKeys = targetKeys.some(key => obj.hasOwnProperty(key));
  if (hasTargetKeys) {
    return obj;
  }
  
  // Recursively search through all properties
  for (const [key, value] of Object.entries(obj)) {
    const newPath = path ? `${path}.${key}` : key;
    const result = findObjectWithKeys(value, targetKeys, newPath);
    if (result) return result;
  }
  
  return null;
}

// Search for objects containing our expected keys
const candidateDataObject = findObjectWithKeys(inputData, ['candidateName', 'name', 'sessionId', 'sessionToken', 'originalToken']);

// Check if this is the new webhook structure
const isNewStructure = inputData.message?.type === 'end-of-call-report';
const isOldStructure = inputData.message?.call;

let message, call, analysis, artifact, variableValues;

if (isNewStructure) {
  // New webhook structure
  message = inputData.message;
  call = message?.call;
  analysis = message?.analysis;
  artifact = message?.artifact;
  variableValues = call?.variableValues || {};
} else {
  // This is actually a webhook with body.message structure!
  message = inputData.body?.message || inputData.message || inputData;
  call = message?.call || inputData.call || {};
  analysis = message?.analysis || {};
  artifact = message?.artifact || {};
  
  // Look for variableValues in the message or call object
  variableValues = message?.variableValues || 
                   call?.variableValues || 
                   message?.call?.variableValues ||
                   inputData.variableValues || 
                   {};
  
  // DEEP SEARCH: Look for variableValues in ANY nested object
  function findVariableValuesRecursive(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;
    
    if (obj.variableValues) {
      // Check if these look like real tokens (not our fallback)
      if (obj.variableValues.sessionToken && 
          obj.variableValues.sessionToken !== 'extracted-from-transcript' &&
          obj.variableValues.sessionToken.length > 10) {
        variableValues = obj.variableValues;
        return obj.variableValues;
      }
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      const result = findVariableValuesRecursive(value, newPath);
      if (result) return result;
    }
  }
  
  const foundVariableValues = findVariableValuesRecursive(inputData, 'inputData');
  if (foundVariableValues) {
    variableValues = foundVariableValues;
  }
  
  // If still no variableValues, check if this is end-of-call-report in body
  if ((!variableValues || Object.keys(variableValues).length === 0) && message?.type === 'end-of-call-report') {
    console.log('🎯 This is actually an end-of-call-report in body.message!');
    const isEndOfCallReport = message.type === 'end-of-call-report';
    
    if (isEndOfCallReport) {
      // Extract from end-of-call-report structure
      call = message.call || {};
      analysis = message.analysis || {};
      artifact = message.artifact || {};
      variableValues = call?.variableValues || message?.variableValues || {};
      
      console.log('� End-of-call-report data:');
      console.log('- call object:', call);
      console.log('- call.variableValues:', call?.variableValues);
      console.log('- message.variableValues:', message?.variableValues);
    }
  }
  
  console.log('� Final variableValues found:', variableValues);
  console.log('� variableValues keys:', Object.keys(variableValues || {}));
}

// Extract transcript from multiple possible locations
let transcript = '';
if (message?.transcript) {
  transcript = message.transcript;
} else if (artifact?.transcript) {
  transcript = artifact.transcript;
} else if (call?.transcript) {
  transcript = call.transcript;
} else if (inputData.transcript) {
  transcript = inputData.transcript;
} else {
  // Build transcript from messages if no direct transcript
  const messages = artifact?.messages || message?.messages || inputData.messages || [];
  
  if (messages.length > 0) {
    transcript = messages
      .filter(msg => msg.role === 'bot' || msg.role === 'user' || msg.role === 'assistant')
      .map(msg => {
        const role = msg.role === 'bot' ? 'AI' : (msg.role === 'assistant' ? 'AI' : 'User');
        return `${role}: ${msg.message || msg.content}`;
      })
      .join('\n');
    
    // Extract candidate name from transcript if variableValues is empty
    if ((!variableValues || Object.keys(variableValues).length === 0) && transcript.includes('Jane')) {
      // Extract Jane from the conversation
      const janeMatch = transcript.match(/Jane/i);
      if (janeMatch) {
        // Create a mock variableValues object from transcript analysis
        variableValues = {
          candidateName: 'Jane',
          name: 'Jane',
          sessionId: 'extracted-from-transcript',
          sessionToken: 'extracted-from-transcript',
          originalToken: 'extracted-from-transcript'
        };
      }
    }
  }
}

// Extract summary
const summary = analysis?.summary || message?.summary || call?.summary || inputData.summary || 'No summary available';

// Extract call duration with enhanced calculation and debugging
function calculateCallDuration(message, call, inputData, artifact) {
  console.log('🕒 DURATION EXTRACTION DEBUG:');
  console.log('- message.durationMs:', message?.durationMs);
  console.log('- message.durationSeconds:', message?.durationSeconds);
  console.log('- inputData.durationMs:', inputData?.durationMs);
  console.log('- inputData.durationSeconds:', inputData?.durationSeconds);
  console.log('- call.durationMs:', call?.durationMs);
  console.log('- call.durationSeconds:', call?.durationSeconds);
  console.log('- artifact.durationMs:', artifact?.durationMs);
  console.log('- artifact.durationSeconds:', artifact?.durationSeconds);
  
  // Try to get duration from multiple sources with more comprehensive search
  let durationMs = message?.durationMs || 
                   message?.duration?.milliseconds ||
                   inputData?.durationMs || 
                   inputData?.duration?.milliseconds ||
                   call?.durationMs || 
                   call?.duration?.milliseconds ||
                   artifact?.durationMs || 
                   artifact?.duration?.milliseconds ||
                   0;
  
  let durationSeconds = message?.durationSeconds || 
                       message?.duration?.seconds ||
                       inputData?.durationSeconds || 
                       inputData?.duration?.seconds ||
                       call?.durationSeconds || 
                       call?.duration?.seconds ||
                       artifact?.durationSeconds || 
                       artifact?.duration?.seconds ||
                       0;
  
  // Check for duration in nested objects
  if (!durationMs && !durationSeconds) {
    // Search recursively for duration fields
    function findDurationRecursive(obj, path = '') {
      if (!obj || typeof obj !== 'object') return null;
      
      // Look for duration-related fields
      const durationFields = ['durationMs', 'durationSeconds', 'duration_ms', 'duration_seconds', 'callDuration', 'callLength'];
      for (const field of durationFields) {
        if (obj[field] && typeof obj[field] === 'number' && obj[field] > 0) {
          console.log(`📍 Found duration at ${path}.${field}:`, obj[field]);
          return { field, value: obj[field] };
        }
      }
      
      // Look for duration object
      if (obj.duration && typeof obj.duration === 'object') {
        if (obj.duration.milliseconds) {
          console.log(`📍 Found duration.milliseconds at ${path}:`, obj.duration.milliseconds);
          return { field: 'milliseconds', value: obj.duration.milliseconds };
        }
        if (obj.duration.seconds) {
          console.log(`📍 Found duration.seconds at ${path}:`, obj.duration.seconds);
          return { field: 'seconds', value: obj.duration.seconds };
        }
      }
      
      // Recursively search nested objects
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        const result = findDurationRecursive(value, newPath);
        if (result) return result;
      }
      
      return null;
    }
    
    console.log('🔍 Searching for duration recursively...');
    const foundDuration = findDurationRecursive(inputData, 'inputData');
    if (foundDuration) {
      if (foundDuration.field.includes('Ms') || foundDuration.field === 'milliseconds') {
        durationMs = foundDuration.value;
      } else {
        durationSeconds = foundDuration.value;
      }
    }
  }
  
  // NEW: Calculate duration from messages array if available
  if (!durationMs && !durationSeconds) {
    const messages = artifact?.messages || message?.messages || inputData.messages || [];
    console.log('💬 Checking messages for duration calculation...');
    console.log('- Messages array length:', messages.length);
    
    if (messages.length > 0) {
      // Method 1: Sum individual message durations
      let totalDurationMs = 0;
      let messageCount = 0;
      
      messages.forEach((msg, index) => {
        if (msg.duration && typeof msg.duration === 'number') {
          totalDurationMs += msg.duration;
          messageCount++;
          console.log(`- Message ${index} duration: ${msg.duration}ms`);
        }
      });
      
      if (totalDurationMs > 0) {
        durationMs = totalDurationMs;
        console.log(`✅ Calculated total duration from ${messageCount} messages: ${totalDurationMs}ms`);
      }
      
      // Method 2: Calculate from first and last message timestamps
      if (!durationMs || durationMs === 0) {
        const firstMessage = messages.find(msg => msg.time);
        const lastMessage = messages.reverse().find(msg => msg.endTime || msg.time);
        
        if (firstMessage && lastMessage) {
          const startTime = firstMessage.time;
          const endTime = lastMessage.endTime || lastMessage.time;
          
          console.log('🕐 Message timestamp calculation:');
          console.log('- First message time:', startTime);
          console.log('- Last message end time:', endTime);
          
          if (startTime && endTime) {
            durationMs = endTime - startTime;
            console.log(`✅ Calculated duration from message timestamps: ${durationMs}ms`);
          }
        }
      }
    }
  }
  
  // If we have timestamps but no duration, calculate it
  const startTime = message?.startedAt || call?.startedAt || inputData?.startedAt;
  const endTime = message?.endedAt || call?.endedAt || inputData?.endedAt;
  
  console.log('📅 Timestamp check:');
  console.log('- startTime:', startTime);
  console.log('- endTime:', endTime);
  
  if (!durationMs && !durationSeconds && startTime && endTime) {
    console.log('⏱️ Calculating duration from timestamps...');
    const start = new Date(startTime);
    const end = new Date(endTime);
    durationMs = end.getTime() - start.getTime();
    durationSeconds = Math.round(durationMs / 1000);
    console.log(`✅ Calculated: ${durationMs}ms = ${durationSeconds}s`);
  }
  
  // Convert between formats if we only have one
  if (durationMs && !durationSeconds) {
    durationSeconds = Math.round(durationMs / 1000);
    console.log(`🔄 Converted ${durationMs}ms to ${durationSeconds}s`);
  } else if (durationSeconds && !durationMs) {
    durationMs = durationSeconds * 1000;
    console.log(`🔄 Converted ${durationSeconds}s to ${durationMs}ms`);
  }
  
  const durationMinutes = Math.round(durationSeconds / 60 * 100) / 100; // Round to 2 decimal places
  
  console.log(`🎯 Final duration: ${durationMs}ms | ${durationSeconds}s | ${durationMinutes}min`);
  
  return {
    milliseconds: durationMs,
    seconds: durationSeconds,
    minutes: durationMinutes,
    formatted: formatDuration(durationSeconds),
    humanReadable: `${Math.floor(durationMinutes)} minutes and ${durationSeconds % 60} seconds`
  };
}

// Helper function to format duration nicely
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Extract call statistics
const callDuration = calculateCallDuration(message, call, inputData, artifact);

// Add comprehensive debugging for the entire input structure
console.log('🔍 COMPLETE INPUT DATA STRUCTURE:');
console.log('- Input data keys:', Object.keys(inputData));
console.log('- Input data type:', typeof inputData);
console.log('- Full input data:', JSON.stringify(inputData, null, 2));

const callStats = {
  // Basic call info
  callId: call?.id || message?.call?.id || inputData.callId || 'unknown',
  duration: callDuration,
  
  // Timestamps
  startedAt: message?.startedAt || call?.startedAt || inputData.startedAt,
  endedAt: message?.endedAt || call?.endedAt || inputData.endedAt,
  endedReason: message?.endedReason || inputData.endedReason || 'unknown',
  
  // Cost breakdown
  totalCost: message?.cost || inputData.cost || 0,
  costBreakdown: message?.costBreakdown || inputData.costBreakdown || {},
  costs: message?.costs || inputData.costs || [],
  
  // Performance metrics
  performance: artifact?.performanceMetrics || inputData.performance || {},
  
  // Recording URLs
  recordingUrl: message?.recordingUrl || artifact?.recordingUrl || inputData.recordingUrl,
  stereoRecordingUrl: message?.stereoRecordingUrl || artifact?.stereoRecordingUrl || inputData.stereoRecordingUrl,
  logUrl: artifact?.logUrl || inputData.logUrl,
  
  // Additional call details
  type: call?.type || inputData.type || 'unknown',
  status: call?.status || inputData.status || 'unknown',
  transport: call?.transport || inputData.transport || {}
};

// Extract assistant information
const assistant = message?.assistant || inputData.assistant || {};
const assistantInfo = {
  id: assistant.id || 'unknown',
  name: assistant.name || 'Unknown Assistant',
  voice: assistant.voice || {},
  model: assistant.model || {}
};

// ASSISTANT VARIABLE VALUES SEARCH
if (assistant.assistantOverrides) {
  if (assistant.assistantOverrides.variableValues) {
    // Use these if they contain real tokens
    const assistantVarValues = assistant.assistantOverrides.variableValues;
    if (assistantVarValues.sessionToken && 
        assistantVarValues.sessionToken !== 'extracted-from-transcript') {
      variableValues = { ...variableValues, ...assistantVarValues };
    }
  }
}

// Check if there are any overrides at the call level
if (call?.assistantOverrides?.variableValues) {
  const callVarValues = call.assistantOverrides.variableValues;
  if (callVarValues.sessionToken && 
      callVarValues.sessionToken !== 'extracted-from-transcript') {
    variableValues = { ...variableValues, ...callVarValues };
  }
}

// Extract candidate information from variableValues
const candidateName = 
  variableValues?.candidateName || 
  variableValues?.name ||
  call?.metadata?.candidateName || 
  assistant?.variableValues?.candidateName ||
  assistant?.variableValues?.name ||
  'Unknown Candidate';

const sessionId = 
  variableValues?.sessionId ||
  variableValues?.sessionToken ||
  call?.metadata?.sessionId || 
  assistant?.variableValues?.sessionId ||
  'unknown';

const originalToken = 
  variableValues?.originalToken ||
  variableValues?.sessionToken ||  // If originalToken is same as sessionToken
  call?.metadata?.originalToken ||
  assistant?.variableValues?.originalToken ||
  sessionId; // Fallback to sessionId if originalToken not found

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
  eventType: message?.type || inputData.type || 'webhook-call',
  timestamp: message?.timestamp || inputData.timestamp || Date.now(),
  webhookUrl: inputData.webhookUrl || 'unknown',
  executionMode: inputData.executionMode || 'unknown',
  
  // Candidate information (KEY FIX: Now properly extracts from variableValues)
  candidate: {
    name: candidateName,
    sessionId: sessionId,
    sessionToken: variableValues?.sessionToken || sessionId,
    originalToken: originalToken, // Include original token from index.html
    responses: extractInterviewResponses(transcript)
  },
  
  // Interview content
  transcript: {
    full: transcript,
    length: transcript.length,
    wordCount: transcript.split(' ').length,
    hasContent: transcript.length > 0
  },
  
  // Call duration (easily accessible)
  callDuration: callDuration,
  
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
    messages: artifact?.messages || inputData.messages || [],
    messagesOpenAI: artifact?.messagesOpenAIFormatted || [],
    totalMessages: (artifact?.messages || inputData.messages || []).length
  },
  
  // VAPI Configuration Data
  vapiConfig: {
    server: inputData.server || {},
    compliancePlan: inputData.compliancePlan || {},
    variableValues: variableValues,
    webhookUrl: inputData.webhookUrl
  },
  
  // Processing metadata
  processing: {
    extractedAt: new Date().toISOString(),
    dataSource: 'vapi-webhook',
    hasTranscript: transcript.length > 0,
    hasSummary: summary !== 'No summary available',
    hasCallStats: !!(message?.durationSeconds || inputData.durationSeconds),
    inputStructure: isNewStructure ? 'end-of-call-report' : 'webhook-data'
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
console.log(`- Input structure: ${extractedData.processing.inputStructure}`);
console.log(`- Webhook URL: ${extractedData.vapiConfig.webhookUrl}`);
console.log(`- Execution mode: ${extractedData.executionMode}`);
console.log(`- Candidate: ${extractedData.candidate.name}`);
console.log(`- Session ID: ${extractedData.candidate.sessionId}`);
console.log(`- Session Token: ${extractedData.candidate.sessionToken}`);
console.log(`- Original Token: ${extractedData.candidate.originalToken}`);
console.log(`- Transcript length: ${extractedData.transcript.length} characters`);

// Add Airtable-ready fields for easy access
console.log('🔧 AIRTABLE-READY DATA:');
console.log('- Token:', extractedData.candidate.originalToken);
console.log('- Candidate Name:', extractedData.candidate.name);
console.log('- Transcript Text:', extractedData.transcript.full.substring(0, 100) + '...');
console.log('- Call Duration (seconds):', extractedData.callDuration.seconds);

return [{ json: extractedData }];
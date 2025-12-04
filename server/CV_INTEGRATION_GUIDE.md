# CV/Resume Integration for VAPI Interviews

## Overview
The system now passes candidate CV/Resume data to the VAPI agent during phone interviews, allowing the AI to reference the candidate's background, experience, and qualifications during the conversation.

---

## How It Works

### Data Flow:
```
Airtable (CV fields) 
  ↓
Backend API (validate-token)
  ↓
index.html (stores in sessionStorage)
  ↓
interview.html (retrieves from sessionStorage)
  ↓
VAPI Agent (receives as variableValues + metadata)
```

---

## Airtable Setup

### Required Fields in "Candidates" Table:

| Field Name | Field Type | Purpose | Required |
|------------|-----------|---------|----------|
| **CV URL** or **Resume URL** | URL | Link to uploaded CV file | No |
| **CV Text** or **Resume Text** | Long text | Full CV content as text | No |
| **CV Summary** or **Resume Summary** | Long text | Brief summary of CV | No |
| **Position Applied** or **Position** | Single line text | Job position | No |
| **Years of Experience** or **Experience** | Number or Text | Years of experience | No |
| **Skills** | Long text | List of skills | No |
| **Education** | Long text | Education background | No |

**Note:** The system supports multiple field naming conventions. At minimum, provide one of:
- CV Text (recommended for best results)
- CV Summary (if full text is too long)
- CV URL (VAPI can access if configured)

---

## Implementation Details

### 1. Backend Changes (`services/airtable.js`)

The `findCandidateByToken()` function now retrieves CV-related fields:

```javascript
return {
  id: record.id,
  token: record.fields.Token,
  email: record.fields.Email,
  name: record.fields['Candidate Name'],
  appointmentTime: record.fields['Interview Time'],
  // CV/Resume fields
  cvUrl: record.fields['CV URL'] || record.fields['Resume URL'],
  cvText: record.fields['CV Text'] || record.fields['Resume Text'],
  cvSummary: record.fields['CV Summary'] || record.fields['Resume Summary'],
  experience: record.fields['Years of Experience'] || record.fields.Experience,
  position: record.fields['Position Applied'] || record.fields.Position,
  skills: record.fields.Skills,
  education: record.fields.Education,
  ...record.fields
};
```

### 2. Frontend Changes (`index.html`)

Stores full candidate data in sessionStorage when proceeding to interview:

```javascript
function proceedToInterview() {
  const candidateData = window.candidateData;
  // Store full candidate data for interview page
  sessionStorage.setItem('candidateData', JSON.stringify(candidateData));
  
  const params = new URLSearchParams({
    session: token,
    name: candidateData.name
  });
  window.location.href = `/interview.html?${params.toString()}`;
}
```

### 3. Interview Page Changes (`interview.html`)

#### Retrieves CV Data:
```javascript
const candidateDataStr = sessionStorage.getItem('candidateData');
if (candidateDataStr) {
  candidateFullData = JSON.parse(candidateDataStr);
  console.log('📋 Retrieved candidate data:', candidateFullData);
}
```

#### Builds CV Context:
```javascript
let cvContext = '';
if (candidateFullData) {
  const cvParts = [];
  
  if (candidateFullData.cvText) {
    cvParts.push(`CV/Resume: ${candidateFullData.cvText}`);
  } else if (candidateFullData.cvSummary) {
    cvParts.push(`CV Summary: ${candidateFullData.cvSummary}`);
  }
  
  if (candidateFullData.position) {
    cvParts.push(`Position Applied: ${candidateFullData.position}`);
  }
  
  if (candidateFullData.experience) {
    cvParts.push(`Experience: ${candidateFullData.experience}`);
  }
  
  if (candidateFullData.skills) {
    cvParts.push(`Skills: ${candidateFullData.skills}`);
  }
  
  if (candidateFullData.education) {
    cvParts.push(`Education: ${candidateFullData.education}`);
  }
  
  cvContext = cvParts.join('. ');
}
```

#### Passes to VAPI:
```javascript
window.vapiSDK.run({
  assistantOverrides: {
    variableValues: {
      name: candidateName,
      candidateCV: cvContext,  // Full CV context
      cvUrl: candidateFullData?.cvUrl || '',
      cvSummary: candidateFullData?.cvSummary || '',
      position: candidateFullData?.position || '',
      experience: candidateFullData?.experience || '',
      skills: candidateFullData?.skills || '',
      education: candidateFullData?.education || ''
    },
    metadata: {
      hasCV: !!cvContext,
      cvUrl: candidateFullData?.cvUrl || '',
      position: candidateFullData?.position || ''
    }
  }
});
```

---

## VAPI Assistant Configuration

### Using Variable Values in VAPI

In your VAPI assistant, you can now reference these variables:

```
{{candidateCV}} - Full CV context
{{cvUrl}} - URL to CV document
{{cvSummary}} - Summary of CV
{{position}} - Position applied for
{{experience}} - Years of experience
{{skills}} - Candidate's skills
{{education}} - Education background
{{name}} - Candidate's name
```

### Example VAPI System Prompt:

```
You are an HR interviewer for Bloom Buddies childcare organization. 

You are interviewing {{name}} for the {{position}} position.

CANDIDATE BACKGROUND:
{{candidateCV}}

INTERVIEW GUIDELINES:
1. Review the candidate's CV and tailor questions to their specific experience
2. Ask about relevant skills: {{skills}}
3. Discuss their education: {{education}}
4. Explore their {{experience}} of experience
5. Assess their fit for the {{position}} role

Be conversational, professional, and reference specific details from their CV to show you've reviewed their background.
```

### Alternative Approach - Use CV as Context:

If your VAPI setup supports knowledge bases or documents:

```javascript
// In your VAPI assistant configuration
knowledge: [
  {
    type: 'text',
    content: cvContext  // Pass CV as knowledge base
  }
]
```

---

## Testing

### Step 1: Add CV Data to Airtable

1. Open your Airtable "Candidates" table
2. Find a test candidate record (e.g., token: `c182ffbee37f4b4f`)
3. Add CV information:

**Example CV Text:**
```
John Doe has 5 years of experience in early childhood education. 
Previously worked at Little Stars Preschool as Lead Teacher. 
Holds Bachelor's degree in Education from State University. 
Certified in CPR and First Aid. 
Specializes in Montessori teaching methods and child development.
```

**Example CV Summary:**
```
Experienced early childhood educator with 5 years in preschool settings. 
Bachelor's in Education. Montessori certified.
```

### Step 2: Test the Flow

1. Start the server:
```bash
cd C:\webcall-server
node index.js
```

2. Visit validation page:
```
http://localhost:3000/?token=c182ffbee37f4b4f
```

3. Click "Start Interview"

4. Open browser console (F12) and look for:
```
📋 Retrieved candidate data: {...}
📄 CV Context available: true
📋 CV Preview: CV/Resume: John Doe has 5 years...
```

5. Start the VAPI call

6. The AI should now have access to the CV data

### Step 3: Verify VAPI Received Data

In VAPI dashboard, check the call logs:
- Look for `variableValues` in the call data
- Should see `candidateCV`, `position`, `skills`, etc.

---

## Example Airtable Record

Here's a complete example of a candidate record with CV data:

| Field | Value |
|-------|-------|
| **Token** | abc123test |
| **Candidate Name** | Sarah Johnson |
| **Email** | sarah.johnson@example.com |
| **Interview Time** | 2025-11-10 14:00:00 |
| **Status** | pending |
| **Position Applied** | Lead Preschool Teacher |
| **Years of Experience** | 7 |
| **Education** | M.Ed. Early Childhood Education, University of California |
| **Skills** | Montessori Method, Classroom Management, Curriculum Development, Parent Communication, Child Development Assessment |
| **CV Summary** | Dedicated early childhood educator with 7 years of experience in diverse preschool settings. Montessori certified with expertise in individualized learning plans and positive behavior management. |
| **CV Text** | [Full resume text - 500-2000 words] |
| **CV URL** | https://example.com/resumes/sarah-johnson.pdf |

---

## Best Practices

### 1. CV Text Format

**DO:**
- Use clear, structured text
- Include key qualifications
- Mention relevant experience
- Keep it concise (500-2000 words)

**DON'T:**
- Include formatting characters
- Use special characters that might break JSON
- Make it too long (>3000 words may hit API limits)
- Include PII beyond what's necessary

### 2. CV Summary (Recommended)

If full CV text is long, create a CV Summary (150-300 words):
```
[Name] is a [position] with [X] years of experience in [field].

KEY QUALIFICATIONS:
- [Qualification 1]
- [Qualification 2]
- [Qualification 3]

EDUCATION: [Degree] from [School]

NOTABLE ACHIEVEMENTS:
- [Achievement 1]
- [Achievement 2]
```

### 3. Fallback Strategy

The system uses a fallback strategy:
1. Try `CV Text` first (most detailed)
2. If not available, use `CV Summary`
3. If neither, build context from individual fields (position, experience, skills, education)

---

## Troubleshooting

### Issue: "CV Context available: false"

**Possible causes:**
1. No CV fields populated in Airtable
2. Field names don't match expected names
3. Session storage was cleared

**Solutions:**
- Add CV data to at least one field in Airtable
- Check field names match: "CV Text", "CV Summary", "CV URL", etc.
- Ensure you go through index.html before interview.html

### Issue: VAPI doesn't seem to use CV data

**Solutions:**
1. **Update VAPI Assistant Prompt** to reference `{{candidateCV}}`
2. **Check VAPI Dashboard** logs to confirm variableValues were received
3. **Test with explicit questions** like "What experience does the candidate have?"
4. **Verify CV data exists** in browser console

### Issue: CV text too long

**Solutions:**
- Use CV Summary instead of CV Text
- Truncate CV Text to first 2000 characters
- Break into sections and send most relevant parts

---

## Advanced Configuration

### Parsing PDF CVs

To automatically parse PDF CVs, add a server endpoint:

```javascript
// Install: npm install pdf-parse

const pdfParse = require('pdf-parse');
const axios = require('axios');

app.post('/api/parse-cv', async (req, res) => {
  const { cvUrl } = req.body;
  
  try {
    // Download PDF
    const response = await axios.get(cvUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(response.data);
    
    // Parse PDF
    const data = await pdfParse(pdfBuffer);
    const cvText = data.text;
    
    // Optionally: summarize with AI
    // const summary = await summarizewithOpenAI(cvText);
    
    res.json({ cvText, success: true });
  } catch (error) {
    console.error('PDF parse error:', error);
    res.status(500).json({ error: 'Failed to parse CV' });
  }
});
```

### AI Summary Generation

Generate CV summaries automatically:

```javascript
// Install: npm install openai

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateCVSummary(cvText) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Summarize this CV in 150 words, highlighting key qualifications, experience, and skills relevant for a childcare position."
      },
      {
        role: "user",
        content: cvText
      }
    ]
  });
  
  return completion.choices[0].message.content;
}
```

---

## Security Considerations

### Data Privacy

1. **Sensitive Information**: CVs may contain personal data (DOB, address, etc.)
   - Consider stripping unnecessary PII before sending to VAPI
   - Ensure VAPI/AI provider is GDPR/CCPA compliant

2. **Storage**: CV data is temporarily in:
   - Airtable (persistent - secure)
   - SessionStorage (temporary - cleared on tab close)
   - VAPI logs (check retention policy)

3. **Access Control**:
   - Only authenticated users can access dashboard
   - Token validation prevents unauthorized access
   - Consider encrypting CV URLs in transit

### Recommended Security Measures:

```javascript
// Strip sensitive data before sending to VAPI
function sanitizeCV(cvText) {
  // Remove phone numbers
  cvText = cvText.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  // Remove emails (keep work email only)
  cvText = cvText.replace(/\b[\w.%+-]+@(?!example\.com)[\w.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');
  // Remove addresses
  cvText = cvText.replace(/\b\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi, '[ADDRESS]');
  return cvText;
}
```

---

## Future Enhancements

- [ ] Automatic PDF parsing from CV URL
- [ ] AI-generated CV summaries
- [ ] CV keyword extraction for matching
- [ ] Multi-language CV support
- [ ] CV comparison against job requirements
- [ ] Structured CV data (JSON format)
- [ ] CV upload directly in dashboard
- [ ] Integration with LinkedIn profiles
- [ ] Real-time CV updates during interview

---

## Support

For CV integration issues:
1. Check browser console for CV data loading
2. Verify Airtable field names and data
3. Review VAPI assistant configuration
4. Test with simple CV text first
5. Check VAPI dashboard logs

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0

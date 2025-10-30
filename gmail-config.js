/**
 * Updated Gmail Email Configuration for Interview Reports
 * Based on actual Airtable record structure
 */

// Subject Line Configuration
const subjectLine = `🌸 Interview Report: {{ $node["Update record"].json.fields["Candidate Name"] }} - {{ $node["Update record"].json.fields.Recommandation }} ({{ $node["Update record"].json.fields.score }}/10)`;

// HTML Email Body Configuration
const htmlEmailBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Report - {{ $node["Update record"].json.fields["Candidate Name"] }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f8fafc;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #5dc399, #7be1b6); 
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 2.2em; 
            margin-bottom: 10px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .header-info { 
            margin-top: 20px; 
        }
        .score-row { 
            margin-top: 15px; 
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .header-table td {
            background: rgba(255,255,255,0.2);
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            vertical-align: top;
        }
        .header-table.info-row td {
            width: 20%;
        }
        .header-table.score-row td {
            width: 25%;
        }
        .header-table tr td:not(:last-child) {
            padding-right: 8px;
        }
        .header-table tr td:not(:first-child) {
            padding-left: 8px;
        }
        .header-item { 
            background: rgba(255,255,255,0.2); 
            padding: 12px; 
            border-radius: 8px; 
            text-align: center;
        }
        .content { padding: 30px; }
        .score-section { 
            margin-bottom: 30px;
            text-align: center;
        }
        .main-score { 
            font-size: 4em; 
            font-weight: bold; 
            color: #2563eb;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .score-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
            gap: 15px; 
            margin: 25px 0; 
        }
        .score-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center;
            border: 2px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        .score-card:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .score-value { 
            font-size: 2.5em; 
            font-weight: bold; 
            margin-bottom: 5px;
        }
        .score-label { 
            font-size: 0.9em; 
            color: #64748b; 
            font-weight: 500; 
        }
        .recommendation { 
            padding: 25px; 
            border-radius: 12px; 
            margin: 25px 0;
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-left: 6px solid #f59e0b;
        }
        .recommendation.hire { 
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            border-left-color: #10b981;
        }
        .recommendation.pass { 
            background: linear-gradient(135deg, #fef2f2, #fecaca);
            border-left-color: #ef4444;
        }
        .section { 
            margin-bottom: 25px; 
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #5dc399;
        }
        .section h3 { 
            color: #065f46; 
            margin-bottom: 15px; 
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .two-column { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 25px; 
        }
        .info-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 10px 20px;
            margin: 15px 0;
        }
        .info-label {
            font-weight: 600;
            color: #4b5563;
        }
        .info-value {
            color: #1f2937;
        }
        .transcript-box { 
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb;
            white-space: pre-wrap; 
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            line-height: 1.4;
            max-height: 400px;
            overflow-y: auto;
        }
        .availability-text {
            background: #fff3cd;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #ffc107;
            margin: 10px 0;
            font-style: italic;
        }
        .footer { 
            background: #f1f5f9;
            text-align: center; 
            color: #64748b; 
            padding: 20px;
            border-top: 1px solid #e2e8f0;
        }
        @media (max-width: 768px) {
            .two-column { grid-template-columns: 1fr; }
            .score-grid { grid-template-columns: repeat(2, 1fr); }
            .header h1 { font-size: 1.8em; }
            .main-score { font-size: 3em; }
            body { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🌸 Bloom Buddies Interview Report</h1>
            
            <!-- Info Row -->
            <table class="header-table info-row">
                <tr>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Candidate</strong><br>
                        {{ $node["Update record"].json.fields["Candidate Name"] }}
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Interview Date</strong><br>
                        {{ new Date($node["Update record"].json.fields["Interview Time"]).toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                        }) }}
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Duration</strong><br>
                        {{ $node["Update record"].json.fields["Interview Length"] }} minutes
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Email</strong><br>
                        {{ $node["Update record"].json.fields.Email }}
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Status</strong><br>
                        {{ $node["Update record"].json.fields.status }}
                    </td>
                </tr>
            </table>
            
            <!-- Score Row -->
            <table class="header-table score-row">
                <tr>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Communication</strong><br>
                        <span style="font-size: 1.5em; font-weight: bold; color: {{ $node["Update record"].json.fields.Communication >= 7 ? '#007bff' : ($node["Update record"].json.fields.Communication >= 5 ? '#ff8c00' : '#dc3545') }};">{{ $node["Update record"].json.fields.Communication }}/10</span>
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Enthusiasm</strong><br>
                        <span style="font-size: 1.5em; font-weight: bold; color: {{ $node["Update record"].json.fields.enthusiasm >= 7 ? '#007bff' : ($node["Update record"].json.fields.enthusiasm >= 5 ? '#ff8c00' : '#dc3545') }};">{{ $node["Update record"].json.fields.enthusiasm }}/10</span>
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Professionalism</strong><br>
                        <span style="font-size: 1.5em; font-weight: bold; color: {{ $node["Update record"].json.fields.professionalism >= 7 ? '#007bff' : ($node["Update record"].json.fields.professionalism >= 5 ? '#ff8c00' : '#dc3545') }};">{{ $node["Update record"].json.fields.professionalism }}/10</span>
                    </td>
                    <td style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; text-align: center;">
                        <strong>Overall Score</strong><br>
                        <span style="font-size: 1.8em; font-weight: bold; color: {{ $node["Update record"].json.fields.score >= 7 ? '#007bff' : ($node["Update record"].json.fields.score >= 5 ? '#ff8c00' : '#dc3545') }};">{{ $node["Update record"].json.fields.score }}/10</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="content">
            <!-- Availability Information -->
            <div class="section">
                <h3>📅 Candidate Availability</h3>
                <div class="availability-text">
                    {{ $node["Update record"].json.fields.availability }}
                </div>
            </div>

            <!-- Recommendation -->
            <div class="recommendation {{ $node['Update record'].json.fields.Recommandation.toLowerCase().replace(' ', '') }}">
                <h3 style="margin-bottom: 15px; font-size: 1.5em;">
                    🎯 Recommendation: {{ $node["Update record"].json.fields.Recommandation }}
                </h3>
                <div style="font-size: 1.1em; margin-bottom: 15px;">
                    <strong>Executive Summary:</strong><br>
                    {{ $node["Update record"].json.fields["Interview Summary"] }}
                </div>
                <div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 8px;">
                    <strong>Detailed Analysis:</strong><br>
                    {{ $node["Update record"].json.fields["Interview Analysis"] }}
                </div>
            </div>

            <!-- Next Action -->
            <div class="section">
                <h3>🎯 Next Action</h3>
                <p style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                    {{ $node["Update record"].json.fields["Next Action Recommendation"] }}
                </p>
            </div>

            <!-- Interview Transcript -->
            <div class="section">
                <h3>📞 Interview Transcript</h3>
                <div class="transcript-box">{{ $node["Update record"].json.fields["Interview Transcript"] }}</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Bloom Buddies Interview Analysis System</strong></p>
            <p>Report generated on {{ new Date().toLocaleString() }}</p>
            <p><em>Record ID: {{ $node["Update record"].json.id }}</em></p>
        </div>
    </div>
</body>
</html>
`;

// Export for n8n Gmail node configuration
module.exports = {
    subject: subjectLine,
    htmlBody: htmlEmailBody
};
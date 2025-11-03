// Airtable API Integration
class AirtableManager {
    constructor() {
        this.baseUrl = CONFIG.airtable.baseUrl;
        this.baseId = CONFIG.airtable.baseId;
        this.tableName = CONFIG.airtable.tableName;
        this.personalAccessToken = CONFIG.airtable.personalAccessToken;
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes (reduced from 5 minutes for faster updates)
        
        // Check if token is provided
        if (!this.personalAccessToken || this.personalAccessToken === '' || this.personalAccessToken === 'YOUR_AIRTABLE_PAT_HERE') {
            console.log('⚠️ No Airtable token found, showing setup instructions');
            
            // If we're on GitHub Pages and user just logged in, show a friendly setup message
            if (window.location.hostname.includes('github.io')) {
                setTimeout(() => {
                    this.showTokenSetupInstructions();
                }, 500); // Small delay to ensure DOM is ready
            } else {
                this.showTokenSetupInstructions();
            }
        } else {
            console.log('✅ Airtable token found, proceeding with initialization');
            // Token is available, we can proceed normally
            this.initializeWithToken();
        }
    }

    // Initialize when token is available
    initializeWithToken() {
        console.log('🔗 Airtable initialized with token');
        // Test connection by trying to fetch candidates
        this.fetchCandidates().then(candidates => {
            console.log('✅ Airtable connection test passed');
            // Trigger dashboard to load data
            if (window.dashboard) {
                window.dashboard.init();
            }
        }).catch(error => {
            console.error('❌ Airtable connection test failed:', error);
            // Still try to initialize dashboard so user can see error state
            if (window.dashboard) {
                window.dashboard.init();
            }
        });
    }

    // Show setup instructions when no token is provided
    showTokenSetupInstructions() {
        const container = document.querySelector('.main-content');
        if (container) {
            const isGitHubPages = window.location.hostname.includes('github.io');
            const setupContent = isGitHubPages ? this.getGitHubPagesSetup() : this.getLocalSetup();
            
            container.innerHTML = `
                <div class="setup-instructions">
                    <h2><i class="fas fa-key"></i> Almost Ready! Final Step Required</h2>
                    <div style="background: #e7f5e7; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #10b981;">
                        <p><strong>✅ Login Successful!</strong> Now let's connect to your Airtable data.</p>
                    </div>
                    <p>To load your candidate data, please configure your Airtable Personal Access Token.</p>
                    
                    ${setupContent}
                    
                    <div class="setup-note">
                        <p><strong>Note:</strong> Your token is only stored in browser memory and never saved to servers.</p>
                        <p>This ensures your data remains secure and private.</p>
                    </div>
                    
                    ${isGitHubPages ? this.getInteractiveSetup() : ''}
                </div>
            `;
        }
    }

    getInteractiveSetup() {
        return `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 2px dashed #5dc399;">
                <h3 style="color: #5dc399; margin-top: 0;">⚡ Quick Token Setup</h3>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input type="password" id="tokenInput" placeholder="Paste your Airtable token here" 
                           style="flex: 1; min-width: 300px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;">
                    <button onclick="window.configureToken()" 
                            style="padding: 12px 24px; background: #5dc399; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        Configure & Load Data
                    </button>
                </div>
                <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                    💡 Paste your token above and click the button. The page will automatically refresh with your data.
                </p>
            </div>
        `;
    }

    getGitHubPagesSetup() {
        return `
            <div class="instruction-steps">
                <h3>🚀 Demo Setup (GitHub Pages):</h3>
                <ol>
                    <li><strong>Option 1 - Use Demo Helper:</strong>
                        <br>Open browser console (F12) and run:
                        <br><code>DEMO_HELPER.configureAirtable('your_token_here')</code>
                    </li>
                    <li><strong>Option 2 - Direct Config:</strong>
                        <br>In console, run:
                        <br><code>CONFIG.airtable.personalAccessToken = 'your_token_here';</code>
                    </li>
                    <li><strong>Refresh</strong> the page to load your data</li>
                </ol>
                <p><small>💡 Replace 'your_token_here' with your actual Airtable token</small></p>
                
                <div style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                    <h4>🔗 Get Your Airtable Token:</h4>
                    <p>Visit: <a href="https://airtable.com/developers/web/api/introduction" target="_blank" style="color: #0ea5e9;">airtable.com/developers</a></p>
                    <p>Create a token with <code>data.records:read</code> and <code>data.records:write</code> permissions</p>
                </div>
            </div>
        `;
    }

    getLocalSetup() {
        return `
            <div class="instruction-steps">
                <h3>🔧 Local Development Setup:</h3>
                <ol>
                    <li>Create <code>dashboard/config-local.js</code> with your token</li>
                    <li>Or update <code>config.js</code> directly (not recommended)</li>
                    <li>Or use browser console: <code>CONFIG.airtable.personalAccessToken = 'your_token';</code></li>
                </ol>
                
                <div style="margin-top: 1rem; padding: 1rem; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <h4>🔑 Get Your Airtable Token:</h4>
                    <p>Visit: <a href="https://airtable.com/developers/web/api/introduction" target="_blank" style="color: #d97706;">airtable.com/developers</a></p>
                </div>
            </div>
        `;
    }

    // Get API headers for Personal Access Token
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Construct API URL
    getApiUrl(endpoint = '') {
        const encodedTableName = encodeURIComponent(this.tableName);
        return `${this.baseUrl}/${this.baseId}/${encodedTableName}${endpoint}`;
    }

    // Fetch all candidates with caching and pagination
    async fetchCandidates(forceRefresh = false) {
        const cacheKey = 'candidates';
        
        // Check cache first
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Returning cached candidates');
                return cached.data;
            }
        }

        try {
            // Add pagination to limit initial load - get first 100 records
            // Removed sorting to avoid field name issues
            const url = this.getApiUrl('?maxRecords=100');
            console.log('Fetching candidates from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Airtable API error response:', errorText);
                throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const candidates = this.processCandidateData(data.records);

            // Cache the results
            this.cache.set(cacheKey, {
                data: candidates,
                timestamp: Date.now()
            });

            return candidates;
        } catch (error) {
            console.error('Error fetching candidates:', error);
            
            // Return cached data if available
            if (this.cache.has(cacheKey)) {
                console.log('Returning cached data due to error');
                return this.cache.get(cacheKey).data;
            }
            
            throw error;
        }
    }

    // Process raw Airtable data into usable format
    processCandidateData(records) {
        return records.map(record => {
            const fields = record.fields;
            const rawStatus = fields[CONFIG.fields.status] || '';
            const processed = {
                id: record.id,
                candidateName: fields[CONFIG.fields.candidateName] || 'Unknown',
                email: fields[CONFIG.fields.email] || '',
                status: this.normalizeStatus(rawStatus),
                rawStatus: rawStatus, // Keep original Airtable status for filtering
                overallScore: parseInt(fields[CONFIG.fields.overallScore]) || 0,
                communication: parseInt(fields[CONFIG.fields.communication]) || 0,
                enthusiasm: parseInt(fields[CONFIG.fields.enthusiasm]) || 0,
                professionalism: parseInt(fields[CONFIG.fields.professionalism]) || 0,
                interviewDate: this.formatDate(fields[CONFIG.fields.interviewDate]),
                interviewLength: fields[CONFIG.fields.interviewLength] || 0,
                recommendation: fields[CONFIG.fields.recommendation] || '',
                summary: fields[CONFIG.fields.summary] || '',
                analysis: fields[CONFIG.fields.analysis] || '',
                transcript: fields[CONFIG.fields.transcript] || '',
                availability: fields[CONFIG.fields.availability] || '',
                nextAction: fields[CONFIG.fields.nextAction] || '',
                lastUpdated: new Date(record.createdTime)
            };

            // Add computed fields
            processed.scoreCategory = this.getScoreCategory(processed.overallScore);
            processed.statusClass = `status-${processed.status}`;
            processed.timeAgo = this.getTimeAgo(processed.lastUpdated);

            return processed;
        });
    }

    // Normalize status values to match Airtable dropdown options
    normalizeStatus(status) {
        if (!status) return 'pending';
        
        const normalizedStatus = status.toLowerCase().trim();
        
        // Map Airtable dropdown values to display values
        if (normalizedStatus === 'accept' || normalizedStatus === 'hired') {
            return 'accepted'; // Display as 'accepted' in UI
        } else if (normalizedStatus === 'reject') {
            return 'rejected'; // Display as 'rejected' in UI
        } else if (normalizedStatus === 'waiting for interview' || 
                   normalizedStatus === 'interviewed' || 
                   normalizedStatus === 'rescheduled' ||
                   normalizedStatus === 'interview personally') {
            return 'pending'; // Display as 'pending' in UI - these can be accepted/rejected
        } else if (normalizedStatus === 'missed') {
            return 'pending'; // Display as 'pending' - missed interviews can still be accepted/rejected
        } else {
            return 'pending'; // Default to pending
        }
    }

    // Get score category for styling
    getScoreCategory(score) {
        if (score >= 7) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Get time ago string
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            return 'Recently';
        }
    }

    // Map display status to Airtable dropdown values
    mapStatusToAirtable(status) {
        const statusMap = {
            'accept': 'accept',
            'reject': 'reject',
            'accepted': 'accept',
            'rejected': 'reject',
            'pending': 'waiting for interview',
            'interviewed': 'interviewed',
            'missed': 'missed',
            'rescheduled': 'rescheduled',
            'hired': 'hired',
            'interview personally': 'interview personally'
        };
        
        return statusMap[status] || status;
    }

    // Update candidate status
    async updateCandidateStatus(candidateId, newStatus) {
        try {
            const url = this.getApiUrl(`/${candidateId}`);
            
            // Map the status to Airtable dropdown value
            const airtableStatus = this.mapStatusToAirtable(newStatus);
            
            const updateData = {
                fields: {
                    [CONFIG.fields.status]: airtableStatus
                }
            };

            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
            }

            const updatedRecord = await response.json();
            
            // Send webhook notification for accept/reject actions
            if (newStatus === 'accept' || newStatus === 'reject') {
                try {
                    await this.sendWebhookNotification(updatedRecord, newStatus);
                } catch (webhookError) {
                    console.warn('Webhook notification failed, but status was updated:', webhookError);
                }
            }
            
            // Clear cache to force refresh
            this.cache.delete('candidates');
            
            return updatedRecord;
        } catch (error) {
            console.error('Error updating candidate status:', error);
            throw error;
        }
    }

    // Send webhook notification to n8n
    async sendWebhookNotification(record, action) {
        const webhookUrl = CONFIG.webhooks[action];
        
        if (!webhookUrl || webhookUrl === '') {
            console.log(`No webhook URL configured for action: ${action}`);
            return;
        }

        try {
            console.log(`Sending webhook notification for ${action} to:`, webhookUrl);
            
            // Prepare webhook payload with candidate data
            const payload = {
                action: action,
                timestamp: new Date().toISOString(),
                candidate: {
                    id: record.id,
                    fields: record.fields
                }
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
            }

            console.log(`✅ Webhook notification sent successfully for ${action}`);
            return await response.json();
            
        } catch (error) {
            console.error(`❌ Failed to send webhook notification for ${action}:`, error);
            throw error;
        }
    }

    // Get statistics from candidates data
    getStatistics(candidates) {
        const stats = {
            total: candidates.length,
            pending: 0,
            accepted: 0,
            rejected: 0,
            averageScore: 0
        };

        let totalScore = 0;

        candidates.forEach(candidate => {
            switch (candidate.status) {
                case 'pending':
                    stats.pending++;
                    break;
                case 'accepted':
                    stats.accepted++;
                    break;
                case 'rejected':
                    stats.rejected++;
                    break;
            }
            totalScore += candidate.overallScore;
        });

        stats.averageScore = candidates.length > 0 ? 
            Math.round(totalScore / candidates.length * 10) / 10 : 0;

        return stats;
    }

    // Filter candidates based on criteria
    filterCandidates(candidates, filters) {
        return candidates.filter(candidate => {
            // Status filter - only check normalized status for clean filtering
            if (filters.status && filters.status !== 'all' && candidate.status !== filters.status) {
                return false;
            }

            // Score filter
            if (filters.score && filters.score !== 'all') {
                const scoreCategory = this.getScoreCategory(candidate.overallScore);
                if (scoreCategory !== filters.score) {
                    return false;
                }
            }

            // Search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = `${candidate.candidateName} ${candidate.email} ${candidate.recommendation}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    }

    // Sort candidates
    sortCandidates(candidates, sortBy = 'lastUpdated', sortOrder = 'desc') {
        return [...candidates].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle different data types
            if (sortBy === 'lastUpdated' || sortBy === 'interviewDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }
}

// Global function for interactive token configuration
window.configureToken = function() {
    const tokenInput = document.getElementById('tokenInput');
    if (!tokenInput) {
        alert('Token input not found');
        return;
    }
    
    const token = tokenInput.value.trim();
    if (!token) {
        alert('Please enter your Airtable token');
        return;
    }
    
    if (!token.startsWith('pat') || token.length < 20) {
        alert('Invalid token format. Airtable tokens start with "pat" and are longer.');
        return;
    }
    
    // Configure the token
    CONFIG.airtable.personalAccessToken = token;
    
    // Show success message
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '✅ Configured! Refreshing...';
    button.style.background = '#10b981';
    
    // Log success
    console.log('✅ Airtable token configured successfully!');
    
    // Refresh after short delay
    setTimeout(() => {
        window.location.reload();
    }, 1500);
};

// AirtableManager will be initialized by main script

// Airtable manager will be initialized by main script
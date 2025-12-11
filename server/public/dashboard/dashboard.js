// Main Dashboard Controller
class Dashboard {
    constructor() {
        this.candidates = [];
        this.filteredCandidates = [];
        this.currentFilters = {
            status: 'all',
            score: 'all',
            search: ''
        };
        this.selectedCandidate = null;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        if (!auth.isAuthenticated()) {
            return; // Wait for authentication
        }

        // Show user management button for admins
        if (auth.currentUser && auth.currentUser.role === 'admin') {
            const userManagementBtn = document.getElementById('userManagementBtn');
            if (userManagementBtn) {
                userManagementBtn.style.display = 'inline-block';
            }
        }

        this.setupEventListeners();
        this.loadCandidates();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Filter controls
        const statusFilter = document.getElementById('statusFilter');
        const scoreFilter = document.getElementById('scoreFilter');
        const searchInput = document.getElementById('searchInput');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
                this.updateStatCardActive(e.target.value);
            });
        }

        if (scoreFilter) {
            scoreFilter.addEventListener('change', (e) => {
                this.currentFilters.score = e.target.value;
                this.applyFilters();
            });
        }

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }

        // Stat card click listeners
        this.setupStatCardListeners();

        // Modal event listeners
        this.setupModalEventListeners();
    }

    setupStatCardListeners() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const filter = card.dataset.filter;
                
                // Update active state
                statCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                // Update status filter dropdown
                const statusFilter = document.getElementById('statusFilter');
                if (statusFilter) {
                    statusFilter.value = filter;
                }
                
                // Apply filter
                this.currentFilters.status = filter;
                this.applyFilters();
            });
        });
    }

    setupModalEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Accept/Reject buttons
        const acceptBtn = document.getElementById('acceptBtn');
        const rejectBtn = document.getElementById('rejectBtn');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.handleCandidateAction('accept'));
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.handleCandidateAction('reject'));
        }

        // Confirmation modal buttons
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');

        if (confirmYes) {
            confirmYes.addEventListener('click', () => this.confirmAction());
        }

        if (confirmNo) {
            confirmNo.addEventListener('click', () => this.closeModal('confirmModal'));
        }
    }

    async loadCandidates(showLoading = true) {
        // Verify user is authenticated
        if (!auth.currentUser) {
            console.log('⚠️ No authenticated user, redirecting to login');
            this.showLoading(false);
            return;
        }

        if (showLoading) {
            this.showLoading(true);
        }

        try {
            // Check if Airtable manager exists and is configured
            if (!window.airtable) {
                console.error('❌ Airtable manager not initialized');
                this.showError('Airtable manager not initialized. Please refresh the page.');
                return;
            }

            if (!window.airtable.isConfigured()) {
                console.log('ℹ️ Airtable not configured, showing setup instructions');
                this.showError('Airtable is not configured. Please configure your token using the setup instructions.');
                return;
            }

            this.candidates = await window.airtable.fetchCandidates();
            this.filteredCandidates = [...this.candidates];
            
            this.updateStatistics();
            this.renderCandidates();
            
            // Set "all" stat card as active by default
            this.updateStatCardActive('all');
            
            if (showLoading) {
                this.showLoading(false);
            }

            console.log(`Loaded ${this.candidates.length} candidates`);
        } catch (error) {
            console.error('Error loading candidates:', error);
            this.showError('Failed to load candidates. Please check your Airtable configuration.');
            
            if (showLoading) {
                this.showLoading(false);
            }
        }
    }

    async refreshData() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadCandidates(false);
            this.showSuccess('Data refreshed successfully');
        } catch (error) {
            this.showError('Failed to refresh data');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
                refreshBtn.disabled = false;
            }
        }
    }

    applyFilters() {
        this.filteredCandidates = window.airtable.filterCandidates(this.candidates, this.currentFilters);
        this.renderCandidates();
    }

    updateStatCardActive(filter) {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            if (card.dataset.filter === filter) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    updateStatistics() {
        const stats = window.airtable.getStatistics(this.candidates);
        
        this.updateStatElement('totalCandidates', stats.total);
        this.updateStatElement('scheduled', stats.scheduled);
        this.updateStatElement('pendingReviews', stats.pending);
        this.updateStatElement('accepted', stats.accepted);
        this.updateStatElement('rejected', stats.rejected);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    renderCandidates() {
        const grid = document.getElementById('candidatesGrid');
        if (!grid) return;

        if (this.filteredCandidates.length === 0) {
            grid.innerHTML = `
                <div class="no-candidates">
                    <i class="fas fa-users" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
                    <h3>No candidates found</h3>
                    <p>Try adjusting your filters or refresh the data.</p>
                </div>
            `;
            return;
        }

        // Sort candidates by most recent first
        const sortedCandidates = window.airtable.sortCandidates(this.filteredCandidates, 'lastUpdated', 'desc');

        grid.innerHTML = sortedCandidates.map((candidate, index) => 
            this.createCandidateCard(candidate, index)
        ).join('');

        // Add click event listeners to cards
        this.attachCardEventListeners();
    }

    createCandidateCard(candidate, index) {
        const scoreClass = `score-${candidate.scoreCategory}`;
        const hasPermission = auth.hasPermission('write');

        return `
            <div class="candidate-card" data-candidate-id="${candidate.id}" style="animation-delay: ${index * 50}ms">
                <div class="candidate-header">
                    <div class="candidate-name">${this.escapeHtml(candidate.candidateName)}</div>
                    <div class="candidate-email">${this.escapeHtml(candidate.email)}</div>
                    ${candidate.phone ? `<div class="candidate-phone">${this.escapeHtml(candidate.phone)}</div>` : ''}
                    <div class="status-badge ${candidate.statusClass}">
                        ${this.formatStatus(candidate.status)}
                    </div>
                </div>
                
                <div class="candidate-body">
                    <div class="score-section">
                        <div class="overall-score ${scoreClass}">
                            ${candidate.overallScore}/10
                        </div>
                        <div class="sub-scores">
                            <div class="score-item">
                                <div class="score-value ${scoreClass}">${candidate.communication}</div>
                                <div>Comm</div>
                            </div>
                            <div class="score-item">
                                <div class="score-value ${scoreClass}">${candidate.enthusiasm}</div>
                                <div>Enth</div>
                            </div>
                            <div class="score-item">
                                <div class="score-value ${scoreClass}">${candidate.professionalism}</div>
                                <div>Prof</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="interview-info">
                        <div><i class="fas fa-calendar"></i> ${candidate.interviewDate}</div>
                        <div><i class="fas fa-clock"></i> ${candidate.interviewLength} minutes</div>
                        <div><i class="fas fa-thumbs-up"></i> ${this.escapeHtml(candidate.recommendation)}</div>
                    </div>
                    
                    <div class="candidate-actions">
                        <button class="btn btn-warning btn-small view-details" data-candidate-id="${candidate.id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachCardEventListeners() {
        // View details buttons
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const candidateId = btn.dataset.candidateId;
                this.showCandidateDetails(candidateId);
            });
        });

        // Card click to view details
        document.querySelectorAll('.candidate-card').forEach(card => {
            card.addEventListener('click', () => {
                const candidateId = card.dataset.candidateId;
                this.showCandidateDetails(candidateId);
            });
        });
    }

    showCandidateDetails(candidateId) {
        const candidate = this.candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        this.selectedCandidate = candidate;
        
        // Populate modal
        document.getElementById('modalCandidateName').textContent = candidate.candidateName;
        
        const modalBody = document.querySelector('#interviewModal .modal-body');
        modalBody.innerHTML = this.createCandidateDetailsHTML(candidate);
        
        // Show/hide action buttons based on status, permissions, and interview completion
        const acceptBtn = document.getElementById('acceptBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        const hasPermission = auth.hasPermission('write');
        
        // Check if interview has been completed or started
        const interviewStarted = candidate.action === 'interviewed' || candidate.interviewCompleted === true;
        
        if (acceptBtn && rejectBtn) {
            // Only show buttons if: has permission, status is pending, AND interview has been completed
            if (hasPermission && candidate.status === 'pending' && interviewStarted) {
                acceptBtn.style.display = 'inline-flex';
                rejectBtn.style.display = 'inline-flex';
            } else {
                acceptBtn.style.display = 'none';
                rejectBtn.style.display = 'none';
            }
        }
        
        this.showModal('interviewModal');
    }

    createCandidateDetailsHTML(candidate) {
        const scoreClass = `score-${candidate.scoreCategory}`;
        
        return `
            <div class="interview-details">
                <div class="detail-section">
                    <h3><i class="fas fa-user"></i> Candidate Information</h3>
                    <div class="info-grid">
                        <strong>Name:</strong> <span>${this.escapeHtml(candidate.candidateName)}</span>
                        <strong>Email:</strong> <span>${this.escapeHtml(candidate.email)}</span>
                        <strong>Status:</strong> <span class="status-badge ${candidate.statusClass}">${this.formatStatus(candidate.status)}</span>
                        <strong>Interview Date:</strong> <span>${candidate.interviewDate}</span>
                        <strong>Duration:</strong> <span>${candidate.interviewLength} minutes</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-chart-bar"></i> Interview Scores</h3>
                    <div class="score-breakdown">
                        <div class="score-item-large">
                            <span>Overall Score:</span>
                            <span class="score-value-large ${scoreClass}">${candidate.overallScore}/10</span>
                        </div>
                        <div class="sub-scores-detailed">
                            <div class="score-item-large">
                                <span>Communication:</span>
                                <span class="score-value ${scoreClass}">${candidate.communication}/10</span>
                            </div>
                            <div class="score-item-large">
                                <span>Enthusiasm:</span>
                                <span class="score-value ${scoreClass}">${candidate.enthusiasm}/10</span>
                            </div>
                            <div class="score-item-large">
                                <span>Professionalism:</span>
                                <span class="score-value ${scoreClass}">${candidate.professionalism}/10</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-thumbs-up"></i> Recommendation</h3>
                    <p><strong>${this.escapeHtml(candidate.recommendation)}</strong></p>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-clipboard-list"></i> Interview Summary</h3>
                    <p>${this.escapeHtml(candidate.summary)}</p>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-search"></i> Detailed Analysis</h3>
                    <p>${this.escapeHtml(candidate.analysis)}</p>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-calendar-check"></i> Availability</h3>
                    <p>${this.escapeHtml(candidate.availability)}</p>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-tasks"></i> Next Action</h3>
                    <p>${this.escapeHtml(candidate.nextAction)}</p>
                </div>
                
                <div class="detail-section">
                    <h3><i class="fas fa-file-alt"></i> Interview Transcript</h3>
                    <div class="transcript-box">${this.escapeHtml(candidate.transcript)}</div>
                </div>
            </div>
        `;
    }

    async handleCandidateAction(action) {
        if (!this.selectedCandidate) return;
        
        const actionText = action === 'accept' ? 'Accept' : 'Reject';
        const confirmed = await this.showConfirmDialog(
            `${actionText} Candidate`,
            `Are you sure you want to ${action} ${this.selectedCandidate.candidateName}?`
        );

        if (confirmed) {
            await this.processCandidateAction(this.selectedCandidate.id, action);
            this.closeModal('interviewModal');
        }
    }

    async processCandidateAction(candidateId, action) {
        try {
            const newStatus = action === 'accept' ? 'accepted' : 'rejected';
            
            // Use new backend endpoints for accept/reject that handle email sending
            const endpoint = action === 'accept' ? `/api/candidates/${candidateId}/accept` : `/api/candidates/${candidateId}/reject`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'the position',
                    nextSteps: action === 'accept' ? 'You will hear from us shortly with next steps.' : undefined,
                    feedback: action === 'reject' ? 'Thank you for your interest in our company.' : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Refresh data
            await this.loadCandidates(false);
            
            this.showSuccess(`Candidate ${action}ed successfully! Email notification sent.`);
        } catch (error) {
            console.error(`Error ${action}ing candidate:`, error);
            this.showError(`Failed to ${action} candidate. Please try again.`);
        }
    }

    async triggerEmailWorkflow(candidateId, action) {
        const candidate = this.candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        const webhookUrl = action === 'accept' ? CONFIG.webhooks.accept : CONFIG.webhooks.reject;
        
        if (!webhookUrl || webhookUrl.includes('your-n8n-instance')) {
            console.warn('Webhook URL not configured for', action);
            return;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    candidateId: candidateId,
                    action: action,
                    candidate: candidate,
                    timestamp: new Date().toISOString(),
                    user: auth.getCurrentUser()
                })
            });

            if (!response.ok) {
                console.warn('Webhook call failed:', response.status);
            }
        } catch (error) {
            console.warn('Error calling webhook:', error);
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            document.getElementById('confirmTitle').textContent = title;
            document.getElementById('confirmMessage').textContent = message;
            
            this.showModal('confirmModal');
            
            // Store resolve function for later use
            this.confirmResolve = resolve;
        });
    }

    confirmAction() {
        if (this.confirmResolve) {
            this.confirmResolve(true);
            this.confirmResolve = null;
        }
        this.closeModal('confirmModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Resolve confirmation dialog with false if cancelled
        if (modalId === 'confirmModal' && this.confirmResolve) {
            this.confirmResolve(false);
            this.confirmResolve = null;
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('candidatesGrid');
        
        if (spinner && grid) {
            if (show) {
                spinner.style.display = 'block';
                grid.style.display = 'none';
            } else {
                spinner.style.display = 'none';
                grid.style.display = 'grid';
            }
        }
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Only auto-refresh every 5 minutes instead of 30 seconds
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refreshing candidates...');
            this.loadCandidates(false);
        }, CONFIG.ui.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        auth.showSuccess(message);
    }

    showError(message) {
        auth.showError(message);
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
    }
}

// Dashboard will be initialized by main script

// Global function to close modals (called from HTML)
function closeModal(modalId) {
    if (window.dashboard) {
        window.dashboard.closeModal(modalId);
    }
}

// Add additional CSS for detailed view
const additionalStyles = `
.info-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    align-items: center;
}

.score-breakdown {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.score-item-large {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
}

.score-value-large {
    font-size: 1.5rem;
    font-weight: bold;
}

.sub-scores-detailed {
    display: grid;
    gap: 0.5rem;
}

.no-candidates {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: #6b7280;
}
`;

const additionalStyleSheet = document.createElement('style');
additionalStyleSheet.textContent = additionalStyles;
document.head.appendChild(additionalStyleSheet);
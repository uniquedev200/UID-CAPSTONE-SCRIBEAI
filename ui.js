console.log('[OK] ui.js loaded');

if (typeof sendChatMessage === 'undefined') {
  console.error('[ERR] sendChatMessage not defined!');
}
if (typeof askMeetingQuestion === 'undefined') {
  console.error('[ERR] askMeetingQuestion not defined!');
}
console.log('sendChatMessage type:', typeof sendChatMessage);
console.log('askMeetingQuestion type:', typeof askMeetingQuestion);

const AppState = {
  transcripts: [],
  selectedTranscript: null,
  searchQuery: '',
  filterSentiment: 'all'
};

async function initDashboard() {
  console.group('[DBG] Dashboard Initialization');
  
  const user = await requireAuth();
  if (!user) {
    console.groupEnd();
    return;
  }
  
  
  let transcripts = await loadTranscriptsFromBackend();
  
  
  if (transcripts.length === 0) {
    console.log('[DBG] No transcripts in backend - trying to seed...');
    await seedToBackend();
    transcripts = await loadTranscriptsFromBackend();
  }
  
  
  if (transcripts.length === 0) {
    console.log('[DBG] Using local sample data...');
    transcripts = getLocalSampleData();
  }
  
  AppState.transcripts = transcripts;
  console.log(`[DBG] Loaded ${transcripts.length} transcripts`);
  
  renderSidebar();
  renderTranscriptsList();
  initChatWidget();
  
  console.groupEnd();
}

async function loadTranscriptsFromBackend() {
  try {
    const { data, error } = await fetchTranscripts();
    if (error || !data || data.length === 0) {
      return [];
    }
    return data;
  } catch (e) {
    console.error('Backend fetch failed:', e);
    return [];
  }
}

async function seedToBackend() {
  try {
    await seedSampleData();
  } catch (e) {
    console.error('Seed failed:', e);
  }
}

function getLocalSampleData() {
  if (window.sampleMeetings && window.sampleMeetings.length > 0) {
    return window.sampleMeetings.map((m, i) => ({
      ...m,
      id: m.id || i + 1,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      status: 'completed'
    }));
  }
  return getDefaultSampleData();
}

function getDefaultSampleData() {
  return [
    {
      id: 1,
      title: 'Project Kickoff - Mobile App MVP',
      duration: '52:30',
      status: 'completed',
      sentiment: 'positive',
      speakers: ['Suraj', 'Sarah', 'Alex'],
      createdAt: new Date().toISOString(),
      summary: 'Discussed mobile app MVP timeline and technology stack. Team agreed on React Native for cross-platform development.',
      actionItems: [
        { title: 'Set up React Native project structure', assignee: 'Suraj', completed: true },
        { title: 'Design mobile app UI mockups', assignee: 'Sarah', completed: false },
        { title: 'Set up CI/CD pipeline with Expo', assignee: 'Alex', completed: false }
      ],
      transcriptText: 'Suraj: Hey team, thanks for joining...'
    },
    {
      id: 2,
      title: 'Budget Review - Q4 Infrastructure',
      duration: '38:15',
      status: 'completed',
      sentiment: 'neutral',
      speakers: ['Sarah', 'Suraj', 'Alex'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      summary: 'Reviewed server expenditure and cloud infrastructure costs. Identified areas for optimization.',
      actionItems: [
        { title: 'Switch to reserved EC2 instances', assignee: 'Suraj', completed: false },
        { title: 'Optimize database queries', assignee: 'Alex', completed: false }
      ],
      transcriptText: 'Sarah: Okay, let\'s start the Q4 budget review...'
    },
    {
      id: 3,
      title: 'Client Interview - Acme Corp Feedback',
      duration: '45:00',
      status: 'completed',
      sentiment: 'positive',
      speakers: ['Client', 'Suraj', 'Sarah'],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      summary: 'Received overwhelmingly positive feedback from Acme Corp. Client praised the clean interface.',
      actionItems: [
        { title: 'Implement dark mode feature', assignee: 'Sarah', completed: false },
        { title: 'Schedule follow-up meeting', assignee: 'Suraj', completed: false }
      ],
      transcriptText: 'Client: Thank you for taking the time to meet with us...'
    },
    {
      id: 4,
      title: 'Sprint Retrospective - Week 8',
      duration: '28:45',
      status: 'completed',
      sentiment: 'negative',
      speakers: ['Sarah', 'Alex', 'Suraj'],
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      summary: 'Difficult retrospective addressing communication gaps and missed deadlines.',
      actionItems: [
        { title: 'Add requirements review step', assignee: 'Suraj', completed: false },
        { title: 'Allocate 30% for testing', assignee: 'Sarah', completed: false }
      ],
      transcriptText: 'Sarah: Okay everyone, let\'s start the retrospective...'
    },
    {
      id: 5,
      title: 'Product Roadmap 2025 Planning',
      duration: '1:15:00',
      status: 'completed',
      sentiment: 'positive',
      speakers: ['CEO', 'Sarah', 'Suraj', 'Alex'],
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      summary: 'Strategic planning session for 2025 product direction.',
      actionItems: [
        { title: 'Post mobile developer job listing', assignee: 'CEO', completed: false },
        { title: 'Design mobile app architecture', assignee: 'Suraj', completed: false }
      ],
      transcriptText: 'CEO: Thanks everyone for joining. Let\'s discuss our 2025 product roadmap...'
    }
  ];
}

async function seedAndReload() {
  console.group('[DBG] Seed and Reload');
  await seedToBackend();
  const transcripts = await loadTranscriptsFromBackend();
  if (transcripts.length === 0) {
    AppState.transcripts = getLocalSampleData();
  } else {
    AppState.transcripts = transcripts;
  }
  renderTranscriptsList();
  console.log(`[OK] Loaded ${AppState.transcripts.length} transcripts`);
  console.groupEnd();
}

async function loadTranscripts() {
  
  const { data, error } = await fetchTranscripts();
  
  if (error || !data || data.length === 0) {
    
    await seedSampleData();
    const retry = await fetchTranscripts();
    if (!retry.error && retry.data && retry.data.length > 0) {
      return { transcripts: retry.data, error: null };
    }
    
    const local = JSON.parse(localStorage.getItem('scribeai_transcripts') || '[]');
    return { transcripts: local, error: null };
  }
  
  return { transcripts: data, error: null };
}

function renderSidebar() {
  updateAuthUI();
}

function renderTranscriptsList() {
  const container = document.getElementById('transcripts-list');
  if (!container) return;
  
  let filtered = [...AppState.transcripts];
  
  
  if (AppState.searchQuery) {
    const query = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.summary?.toLowerCase().includes(query)
    );
  }
  
  
  if (AppState.filterSentiment !== 'all') {
    filtered = filtered.filter(t => t.sentiment === AppState.filterSentiment);
  }
  
  
  updateStats(filtered);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 3rem; margin-bottom: 16px;">[DBG]</div>
        <p style="color: var(--text-muted);">No meetings found</p>
        <button class="btn btn-primary" onclick="seedAndReload()" style="margin-top: 16px;">
          Load Sample Data
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map((t, i) => {
    const actionItems = typeof t.actionItems === 'string' ? JSON.parse(t.actionItems || '[]') : (t.actionItems || []);
    return `
    <div class="meeting-card animate-fade-in-up ${AppState.selectedTranscript?.id === t.id ? 'active' : ''}" 
         onclick="selectTranscript(${t.id})" style="animation-delay: ${i * 0.05}s;">
      <div class="meeting-card-header">
        <div>
          <h3>${escapeHtml(t.title)}</h3>
          <span class="date">${formatDate(t.createdAt || t.created_at || t.date)}</span>
        </div>
        <span class="badge badge-${t.sentiment === 'positive' ? 'success' : t.sentiment === 'negative' ? 'error' : 'warning'}">
          ${t.sentiment || 'neutral'}
        </span>
      </div>
      <p>${escapeHtml(t.summary?.substring(0, 120) || '')}...</p>
      <div class="meeting-meta">
        <span class="badge badge-info">${t.duration || '0:00'}</span>
        <span class="meeting-duration">${actionItems.length} tasks</span>
      </div>
    </div>
  `}).join('');
}

function renderTranscriptDetail(transcript) {
  const container = document.getElementById('transcript-detail');
  if (!container || !transcript) return;
  
  AppState.selectedTranscript = transcript;
  const transcriptText = transcript.transcript_text || transcript.transcriptText || '';
  const speakers = extractSpeakers(transcriptText);
  const actionItems = typeof transcript.actionItems === 'string' 
    ? JSON.parse(transcript.actionItems || '[]') 
    : (transcript.actionItems || []);
  
  const sentimentBadge = getSentimentBadge(transcript.sentiment);
  
  container.innerHTML = `
    <!-- Meeting Header -->
    <div class="meeting-detail-header">
      <div class="meeting-title-row">
        <h2>${escapeHtml(transcript.title)}</h2>
        ${sentimentBadge}
      </div>
      <div class="meeting-meta-row">
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${transcript.duration}
        </span>
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${formatDate(transcript.createdAt || transcript.created_at || transcript.date)}
        </span>
        <span class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          ${speakers.map(s => s.name).join(', ')}
        </span>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="quick-action-btn ${actionItems.some(a => !a.completed) ? 'active' : ''}" onclick="showTab('actions')">
        <span class="quick-action-count">${actionItems.filter(a => !a.completed).length}</span>
        <span>Open Actions</span>
      </button>
      <button class="quick-action-btn" onclick="showTab('transcript')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Full Transcript</span>
      </button>
      <button class="quick-action-btn" onclick="showTab('chat')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Ask AI</span>
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Summary Tab (default) -->
      <div class="tab-panel active" id="tab-summary">
        <div class="summary-section">
          <h3>Summary</h3>
          <p>${escapeHtml(transcript.summary || 'No summary available for this meeting.')}</p>
        </div>
        
        ${speakers.length > 0 ? `
        <div class="speakers-section">
          <h3>Speaking Time</h3>
          <div class="speakers-breakdown">
            ${speakers.map((s, i) => `
              <div class="speaker-bar-item">
                <div class="speaker-info">
                  <span class="speaker-dot" style="background: ${getSpeakerColor(i)}"></span>
                  <span class="speaker-name">${s.name}</span>
                </div>
                <div class="speaker-bar">
                  <div class="speaker-bar-fill" style="width: ${s.percentage}%; background: ${getSpeakerColor(i)}"></div>
                </div>
                <span class="speaker-percent">${s.percentage}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
      
      <!-- Actions Tab -->
      <div class="tab-panel" id="tab-actions">
        <div class="actions-header">
          <h3>Action Items</h3>
          <span class="action-count">${actionItems.filter(a => !a.completed).length} remaining</span>
        </div>
        <div class="action-items-list">
          ${actionItems.length > 0 ? actionItems.map((item, i) => `
            <div class="action-card ${item.completed ? 'completed' : ''}">
              <div class="action-checkbox ${item.completed ? 'checked' : ''}" onclick="toggleAction(${i})"></div>
              <div class="action-content">
                <div class="action-title">${escapeHtml(item.title)}</div>
                <div class="action-meta">
                  <span class="action-assignee">${escapeHtml(item.assignee || 'Unassigned')}</span>
                </div>
              </div>
            </div>
          `).join('') : '<p class="no-actions">No action items for this meeting.</p>'}
        </div>
      </div>
      
      <!-- Transcript Tab -->
      <div class="tab-panel" id="tab-transcript">
        <div class="transcript-container">
          ${renderTranscriptLines(transcriptText, speakers)}
        </div>
      </div>
      
      <!-- Chat Tab -->
      <div class="tab-panel" id="tab-chat">
        <div class="ai-chat-container">
          <div class="ai-suggestions">
            <span class="suggestion-label">Quick questions:</span>
            <button class="suggestion-chip" onclick="askQuickQuestion('What were the key decisions?')">Key decisions?</button>
            <button class="suggestion-chip" onclick="askQuickQuestion('Summarize the main points')">Summarize</button>
            <button class="suggestion-chip" onclick="askQuickQuestion('What needs follow up?')">Follow up?</button>
          </div>
          <div class="ai-messages" id="ai-messages">
            <div class="ai-message bot">
              <div class="ai-avatar">AI</div>
              <div class="ai-bubble">Ask me anything about this meeting. I'll search through the transcript to find answers.</div>
            </div>
          </div>
          <div class="ai-input-container">
            <input type="text" id="ai-input" placeholder="Ask about this meeting..." onkeypress="handleAIKeypress(event)">
            <button class="ai-send-btn" onclick="askMeetingQuestion()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  renderTranscriptsList();
}

function showTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.quick-action-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  event.target.closest('.quick-action-btn')?.classList.add('active');
}

function askQuickQuestion(question) {
  document.getElementById('ai-input').value = question;
  askMeetingQuestion();
}

function handleAIKeypress(e) {
  if (e.key === 'Enter') askMeetingQuestion();
}

function toggleAction(index) {
  const transcript = AppState.selectedTranscript;
  if (!transcript || !transcript.actionItems) return;
  
  const actions = typeof transcript.actionItems === 'string' 
    ? JSON.parse(transcript.actionItems)
    : transcript.actionItems;
  
  if (actions[index]) {
    actions[index].completed = !actions[index].completed;
    transcript.actionItems = actions;
    
    
    const actionsTab = document.getElementById('tab-actions');
    if (actionsTab) {
      const actionCount = actions.filter(a => !a.completed).length;
      actionsTab.querySelector('.action-count').textContent = `${actionCount} remaining`;
      actionsTab.querySelector('.action-items-list').innerHTML = actions.map((item, i) => `
        <div class="action-card ${item.completed ? 'completed' : ''}">
          <div class="action-checkbox ${item.completed ? 'checked' : ''}" onclick="toggleAction(${i})"></div>
          <div class="action-content">
            <div class="action-title">${escapeHtml(item.title)}</div>
            <div class="action-meta">
              <span class="action-assignee">${escapeHtml(item.assignee || 'Unassigned')}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

async function askMeetingQuestion() {
  const input = document.getElementById('ai-input');
  const messages = document.getElementById('ai-messages');
  if (!input?.value.trim()) return;
  
  if (!AppState.selectedTranscript) {
    messages.innerHTML += `
      <div class="ai-message bot">
        <div class="ai-avatar">AI</div>
        <div class="ai-bubble">Please select a meeting first to ask questions about it.</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
    return;
  }
  
  const question = input.value.trim();
  input.value = '';
  
  
  messages.innerHTML += `
    <div class="ai-message user">
      <div class="ai-bubble">${escapeHtml(question)}</div>
    </div>
  `;
  
  
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message bot typing';
  typingDiv.innerHTML = `
    <div class="ai-avatar">AI</div>
    <div class="ai-bubble typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  messages.appendChild(typingDiv);
  messages.scrollTop = messages.scrollHeight;
  
  try {
    
    const { data, error } = await askMeetingAI(
      AppState.selectedTranscript.id, 
      question
    );
    
    typingDiv.classList.remove('typing');
    
    if (error) {
      typingDiv.innerHTML = `
        <div class="ai-avatar">AI</div>
        <div class="ai-bubble" style="color: var(--accent-error);">Error: ${escapeHtml(error)}</div>
      `;
    } else {
      typingDiv.innerHTML = `
        <div class="ai-avatar">AI</div>
        <div class="ai-bubble">${escapeHtml(data?.response || 'I could not process that request.')}</div>
      `;
    }
  } catch (err) {
    console.error('askMeetingQuestion error:', err);
    typingDiv.classList.remove('typing');
    typingDiv.innerHTML = `
      <div class="ai-avatar">AI</div>
      <div class="ai-bubble" style="color: var(--accent-error);">Error: ${escapeHtml(err.message)}</div>
    `;
  }
  
  messages.scrollTop = messages.scrollHeight;
}

async function getLocalAnswer(question, transcript) {
  const q = question.toLowerCase();
  const text = (transcript.transcript_text || transcript.transcriptText || '').toLowerCase();
  const summary = (transcript.summary || '').toLowerCase();
  const actions = transcript.actionItems || [];
  
  
  if (q.includes('key decision') || q.includes('decisions')) {
    const decisions = extractDecisions(text);
    return decisions.length > 0 
      ? `Key decisions from this meeting:\n${decisions.map(d => '• ' + d).join('\n')}`
      : 'No specific decisions were recorded in this meeting.';
  }
  
  if (q.includes('summar') || q.includes('summary')) {
    return transcript.summary || 'No summary available for this meeting.';
  }
  
  if (q.includes('action') || q.includes('task') || q.includes('follow')) {
    if (actions.length > 0) {
      const open = actions.filter(a => !a.completed);
      const completed = actions.filter(a => a.completed);
      let response = '';
      if (open.length > 0) {
        response += `Open action items (${open.length}):\n`;
        response += open.map(a => `• ${a.title} (${a.assignee || 'Unassigned'})`).join('\n');
      }
      if (completed.length > 0) {
        if (response) response += '\n\n';
        response += `Completed items:\n`;
        response += completed.map(a => `✓ ${a.title}`).join('\n');
      }
      return response;
    }
    return 'No action items for this meeting.';
  }
  
  if (q.includes('who') && (q.includes('said') || q.includes('speak'))) {
    const speakers = extractSpeakers(transcript.transcript_text || transcript.transcriptText);
    if (speakers.length > 0) {
      return `Participants in this meeting:\n${speakers.map(s => `• ${s.name} (${s.percentage}% talk time)`).join('\n')}`;
    }
    return 'Could not identify speakers in this meeting.';
  }
  
  
  const keywords = q.split(' ').filter(w => w.length > 3);
  const sentences = text.split(/[.!?]+/).filter(s => {
    const lower = s.toLowerCase();
    return keywords.some(k => lower.includes(k));
  });
  
  if (sentences.length > 0) {
    return `Found ${sentences.length} relevant passage(s):\n\n"${sentences.slice(0, 3).join('."\n\n"').trim()}"`;
  }
  
  return "I couldn't find specific information about that in this meeting's transcript. Try asking about key decisions, actions, or summarize.";
}

function extractDecisions(text) {
  const patterns = [
    /decided\s+to\s+([^.]+)/gi,
    /agreed\s+to\s+([^.]+)/gi,
    /we\s+will\s+([^.]+)/gi,
    /let's\s+([^.]+)/gi,
    /approved\s+([^.]+)/gi
  ];
  
  const decisions = [];
  patterns.forEach(p => {
    let match;
    while ((match = p.exec(text)) !== null) {
      decisions.push(match[1].trim());
    }
  });
  
  return decisions.slice(0, 5);
}

function getSentimentBadge(sentiment) {
  const colors = {
    positive: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
    neutral: { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
    negative: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
  };
  const style = colors[sentiment] || colors.neutral;
  return `<span class="sentiment-badge" style="background: ${style.bg}; color: ${style.color};">${sentiment || 'neutral'}</span>`;
}

function getSpeakerColor(index) {
  const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  return colors[index % colors.length];
}

function renderTranscriptLines(text, speakers) {
  if (!text) return '<p class="no-transcript">No transcript available.</p>';
  
  const lines = text.split('\n').filter(l => l.trim());
  const speakerMap = {};
  speakers.forEach((s, i) => speakerMap[s.name.toLowerCase()] = i);
  
  return lines.map(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const speakerIdx = speakerMap[match[1].toLowerCase()];
      const color = getSpeakerColor(speakerIdx ?? Math.abs(hashCode(match[1])) % 6);
      return `
        <div class="transcript-line">
          <div class="line-speaker" style="color: ${color}">${escapeHtml(match[1])}</div>
          <div class="line-text">${escapeHtml(match[2])}</div>
        </div>
      `;
    }
    return `<div class="transcript-line"><div class="line-text">${escapeHtml(line)}</div></div>`;
  }).join('');
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return hash;
}

function renderTranscriptText(text) {
  if (!text) return '<p style="color: var(--text-tertiary);">No transcript available.</p>';
  
  
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      return `
        <div class="speaker-segment">
          <div class="speaker-name">${escapeHtml(match[1])}</div>
          <div class="speaker-text">${escapeHtml(match[2])}</div>
        </div>
      `;
    }
    return `<p>${escapeHtml(line)}</p>`;
  }).join('');
}

function extractSpeakers(text) {
  if (!text) return [];
  
  const speakerCounts = {};
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^(\w+):\s/);
    if (match) {
      speakerCounts[match[1]] = (speakerCounts[match[1]] || 0) + 1;
    }
  });
  
  const total = Object.values(speakerCounts).reduce((a, b) => a + b, 0);
  
  return Object.entries(speakerCounts).map(([name, count]) => ({
    name,
    percentage: Math.round((count / total) * 100)
  }));
}

function updateStats(transcripts) {
  const totalMeetings = document.getElementById('stat-meetings');
  const totalHours = document.getElementById('stat-hours');
  const totalTasks = document.getElementById('stat-tasks');
  
  if (totalMeetings) totalMeetings.textContent = transcripts.length;
  
  const hours = transcripts.reduce((acc, t) => {
    const match = t.duration?.match(/(\d+):(\d+)/);
    if (match) return acc + parseInt(match[1]) / 60;
    return acc;
  }, 0);
  if (totalHours) totalHours.textContent = hours.toFixed(1);
  
  const tasks = transcripts.reduce((acc, t) => acc + (t.actionItems?.length || 0), 0);
  if (totalTasks) totalTasks.textContent = tasks;
}

function selectTranscript(id) {
  console.group(`[DBG] Select Transcript #${id}`);
  
  const transcript = AppState.transcripts.find(t => t.id === id);
  
  if (!transcript) {
    console.error('Transcript not found');
    console.groupEnd();
    return;
  }
  
  AppState.selectedTranscript = transcript;
  renderTranscriptDetail(transcript);
  
  console.log('[OK] Selected:', transcript.title);
  console.groupEnd();
}

async function regenerateActions(id) {
  console.group('[REFRESH] Regenerate Action Items');
  
  const transcript = AppState.transcripts.find(t => t.id === id);
  if (!transcript) {
    console.groupEnd();
    return;
  }
  
  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>';
  
  const { data, error } = await generateSummary(id, transcript.transcript_text || '');
  
  if (!error && data?.actionItems) {
    transcript.actionItems = data.actionItems;
    renderTranscriptDetail(transcript);
  }
  
  btn.disabled = false;
  btn.textContent = 'Regenerate';
  console.groupEnd();
}

function handleSearch(query) {
  AppState.searchQuery = query;
  renderTranscriptsList();
}

function handleHeaderSearch(event) {
  if (event.key === 'Enter') {
    handleSearch(event.target.value);
  }
}

function handleFilter(sentiment) {
  AppState.filterSentiment = sentiment;
  renderTranscriptsList();
}

async function handleFileUpload(file) {
  if (!file) return;
  
  console.group('[DBG] Upload Workflow');
  console.log('File:', file.name);
  
  
  const newTranscript = {
    id: Date.now(),
    title: file.name.replace(/\.[^/.]+$/, ''),
    duration: '0:00',
    status: 'processing',
    sentiment: 'neutral',
    date: new Date().toISOString(),
    summary: 'Processing...',
    transcript_text: '',
    actionItems: []
  };
  
  
  AppState.transcripts.unshift(newTranscript);
  renderTranscriptsList();
  
  
  const progress = document.getElementById('progress-bar');
  if (progress) {
    progress.classList.add('active');
  }
  
  
  await simulateProcessing(newTranscript.id, file);
  
  
  if (progress) {
    progress.classList.remove('active');
  }
  
  console.groupEnd();
}

async function simulateProcessing(id, file) {
  
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 100));
  }
  
  
  const transcript = AppState.transcripts.find(t => t.id === id);
  if (transcript) {
    
    transcript.status = 'completed';
    transcript.duration = '3:45';
    transcript.summary = `Transcription of "${file.name}" completed. The meeting covered key discussion points and decisions.`;
    transcript.transcript_text = `Speaker 1: Welcome everyone to the meeting.\nSpeaker 2: Thank you for joining.\nSpeaker 1: Let's discuss the agenda for today.\nSpeaker 2: Yes, we have several important topics.`;
    transcript.actionItems = [
      { title: 'Follow up on action items', assignee: 'Team', completed: false },
      { title: 'Schedule next meeting', assignee: 'Speaker 1', completed: false }
    ];
  }
  
  renderTranscriptsList();
  
  if (transcript) {
    selectTranscript(transcript.id);
  }
}

function initChatWidget() {
  const toggle = document.getElementById('chat-toggle');
  const close = document.getElementById('chat-close');
  const send = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  
  toggle?.addEventListener('click', () => {
    document.getElementById('chat-window')?.classList.toggle('open');
  });
  
  close?.addEventListener('click', () => {
    document.getElementById('chat-window')?.classList.remove('open');
  });
  
  send?.addEventListener('click', sendChatMessage);
  input?.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  
  if (!input?.value.trim()) return;
  
  const question = input.value.trim();
  input.value = '';
  
  messages.innerHTML += `
    <div class="chat-message user">
      <div class="message-avatar">You</div>
      <div class="message-content">${escapeHtml(question)}</div>
    </div>`;
  
  messages.innerHTML += `
    <div class="chat-message bot">
      <div class="message-avatar">AI</div>
      <div class="message-content">Thinking...</div>
    </div>`;
  
  messages.scrollTop = messages.scrollTop + 1000;
  
  try {
    const { data, error } = await chatWithAI(question);
    
    const lastBot = messages.querySelector('.chat-message.bot:last-child .message-content');
    if (error) {
      lastBot.textContent = 'Error: ' + error;
      showToast('AI Error', error, 'error');
    } else {
      lastBot.textContent = data?.response || 'I could not process that request.';
    }
  } catch (err) {
    console.error('sendChatMessage error:', err);
    const lastBot = messages.querySelector('.chat-message.bot:last-child .message-content');
    lastBot.textContent = 'Error: ' + err.message;
    showToast('AI Error', err.message, 'error');
  }
  
  messages.scrollTop = messages.scrollTop + 1000;
}

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toggleMobileSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

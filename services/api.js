console.log('[OK] api.js loaded (local mode)');

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(window.STORAGE_KEYS.TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

function post(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
}

function patch(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
}

function del(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

async function apiRequest(endpoint, options = {}) {
  console.log(`[DBG] Local API: ${options.method || 'GET'} ${endpoint}`);
  
  const path = endpoint.replace('/api/', '');
  
  if (path === 'transcripts') {
    return handleTranscripts(options.method, options.body);
  }
  if (path.match(/^transcripts\/\d+$/)) {
    const id = parseInt(path.split('/')[1]);
    return handleTranscript(id, options.method, options.body);
  }
  if (path === 'seed') {
    return handleSeed();
  }
  if (path === 'chat') {
    return handleChat(options.body);
  }
  if (path === 'contact') {
    return handleContact(options.body);
  }
  
  return { data: null, error: 'Unknown endpoint' };
}

function getStoredTranscripts() {
  const data = localStorage.getItem(window.STORAGE_KEYS.TRANSCRIPTS);
  return data ? JSON.parse(data) : [];
}

function setStoredTranscripts(transcripts) {
  localStorage.setItem(window.STORAGE_KEYS.TRANSCRIPTS, JSON.stringify(transcripts));
}

function getUsers() {
  const data = localStorage.getItem(window.STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

function setUsers(users) {
  localStorage.setItem(window.STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getStoredUser() {
  const data = localStorage.getItem(window.STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

function setStoredUser(user) {
  if (user) {
    localStorage.setItem(window.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(window.STORAGE_KEYS.CURRENT_USER);
  }
}

function handleTranscripts(method, body) {
  const user = getStoredUser();
  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }
  
  const transcripts = getStoredTranscripts().filter(t => t.userId === user.id);
  
  if (method === 'GET' || !method) {
    return { data: transcripts };
  }
  
  return { data: null, error: 'Method not allowed' };
}

function handleTranscript(id, method, body) {
  const user = getStoredUser();
  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }
  
  const transcripts = getStoredTranscripts();
  const transcript = transcripts.find(t => t.id === id && t.userId === user.id);
  
  if (method === 'GET' || !method) {
    if (!transcript) {
      return { data: null, error: 'Transcript not found' };
    }
    return { data: transcript };
  }
  
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const data = body ? JSON.parse(body) : {};
    const index = transcripts.findIndex(t => t.id === id);
    if (index >= 0) {
      transcripts[index] = { ...transcripts[index], ...data };
      setStoredTranscripts(transcripts);
      return { data: transcripts[index] };
    }
    return { data: null, error: 'Transcript not found' };
  }
  
  if (method === 'DELETE') {
    if (!transcript) {
      return { data: null, error: 'Transcript not found' };
    }
    const filtered = transcripts.filter(t => t.id !== id);
    setStoredTranscripts(filtered);
    return { success: true };
  }
  
  return { data: null, error: 'Method not allowed' };
}

function handleSeed() {
  const user = getStoredUser();
  if (!user) {
    return { data: null, error: 'Unauthorized' };
  }
  
  const existing = getStoredTranscripts().find(t => t.userId === user.id);
  if (existing) {
    return { message: 'Data already exists' };
  }
  
  const sampleTranscripts = getSampleData(user.id);
  const allTranscripts = getStoredTranscripts();
  allTranscripts.push(...sampleTranscripts);
  setStoredTranscripts(allTranscripts);
  
  return { success: true, message: 'Sample data created' };
}

function getSampleData(userId) {
  return [
    {
      userId,
      id: Date.now(),
      title: 'Project Kickoff - New App Build',
      duration: '52:30',
      status: 'completed',
      sentiment: 'positive',
      summary: 'Initial meeting to discuss the new application build. Suraj will lead development with a deadline of next Friday. Key technologies include React for frontend and Node.js for backend. Team agreed on agile methodology with bi-weekly sprints.',
      transcriptText: `Suraj: Hey team, thanks for joining today's kickoff meeting. Let's get started.

Sarah: Thanks for organizing this, Suraj. I'm excited about the new project.

Suraj: Great! So the main goal is to build a transcription platform. The deadline is next Friday, so we need to move quickly.

Alex: That's tight. What's the tech stack?

Suraj: We'll use React for the frontend and Node.js with Express for the backend. I'll be leading development.

Sarah: I can handle the UI design. What about deployment?

Suraj: We'll use Vercel for frontend and Railway for backend. Alex, can you set up the CI/CD pipeline?

Alex: Sure, I'll take care of that this week.

Suraj: Perfect. Let's schedule daily standups at 9 AM. Any questions?

Sarah: No, I think we have a solid plan.

Suraj: Great! Let's make it happen.`,
      actionItems: JSON.stringify([
        { title: 'Set up project repository and CI/CD pipeline', assignee: 'Alex', completed: false },
        { title: 'Design UI components and wireframes', assignee: 'Sarah', completed: false },
        { title: 'Build backend API structure', assignee: 'Suraj', completed: true },
        { title: 'Integrate transcription service', assignee: 'Suraj', completed: false }
      ])
    },
    {
      userId,
      id: Date.now() + 1,
      title: 'Budget Review - Q4 2024',
      duration: '38:15',
      status: 'completed',
      sentiment: 'neutral',
      summary: 'Quarterly budget review focusing on server costs and infrastructure spending. The team discussed Stripe integration for payment processing. Infrastructure costs have increased 25% due to scaling. New budget allocation approved for cloud services.',
      transcriptText: `Sarah: Okay, let's start the budget review for Q4.

Suraj: Sure, I prepared the cost analysis. Server costs are our biggest expense.

Sarah: I see a 25% increase from last quarter. What's driving that?

Suraj: Growth. We're processing 3x more users than last month. We need to scale up.

Alex: We could optimize by switching to reserved instances. I ran the numbers - we could save 40%.

Sarah: That's significant. What about the Stripe integration costs?

Suraj: Stripe charges 2.9% plus 30 cents per transaction. For our volume, it's about $200/month.

Sarah: Reasonable. Let's approve the new budget allocation for cloud services.

Alex: Agreed. I'll draft the infrastructure upgrade plan.

Suraj: Perfect. I'll handle the Stripe integration by end of week.`,
      actionItems: JSON.stringify([
        { title: 'Implement Stripe payment integration', assignee: 'Suraj', completed: false },
        { title: 'Switch to reserved cloud instances', assignee: 'Alex', completed: true },
        { title: 'Approve new budget allocation', assignee: 'Sarah', completed: false }
      ])
    },
    {
      userId,
      id: Date.now() + 2,
      title: 'Client Feedback - Acme Corp',
      duration: '45:00',
      status: 'completed',
      sentiment: 'positive',
      summary: 'Received overwhelmingly positive feedback from Acme Corp. They love the UI design and found the transcription accuracy excellent. The main request was implementing dark mode. Client is satisfied with the current project timeline and expressed interest in a long-term partnership.',
      transcriptText: `Client: Thank you for taking the time to meet with us.

Suraj: Of course! We're always happy to hear your feedback.

Client: Well, I have to say, the UI is absolutely stunning. Our team loves it.

Sarah: Thank you so much! We put a lot of work into the design.

Client: The transcription accuracy is impressive too. 99% is impressive.

Suraj: Thanks! We use advanced AI models for that.

Client: We do have one request though - dark mode. Many of our team members work late and would appreciate it.

Sarah: That's a great suggestion. I'll prioritize it in the next sprint.

Client: Excellent. We're very satisfied with the progress.

Suraj: We're committed to making this a long-term partnership. We value your business.

Client: Same here. Looking forward to the dark mode update!`,
      actionItems: JSON.stringify([
        { title: 'Implement dark mode feature', assignee: 'Sarah', completed: false },
        { title: 'Schedule follow-up meeting for next month', assignee: 'Suraj', completed: false },
        { title: 'Send project timeline update to client', assignee: 'Alex', completed: true }
      ])
    },
    {
      userId,
      id: Date.now() + 3,
      title: 'Sprint Retrospective - Week 5',
      duration: '28:45',
      status: 'completed',
      sentiment: 'negative',
      summary: 'Difficult retrospective session addressing missed deadlines and communication gaps. The team identified several blockers including unclear requirements and insufficient testing time. Action items focus on improving process and communication going forward.',
      transcriptText: `Sarah: Okay everyone, let's start the retrospective. What didn't go well this sprint?

Alex: I think the main issue was unclear requirements. I spent two days building something that wasn't what the client wanted.

Suraj: I agree. We need better specification reviews before starting work.

Sarah: And we missed the Thursday deadline again. What's causing the delays?

Alex: Testing. We're always rushing testing at the end. We need to factor in more time.

Suraj: I think we also have a communication problem. People aren't updating the task board regularly.

Sarah: That's fair. Let's make updating tickets a daily priority. Any other concerns?

Alex: Yeah, I felt like we had too many meetings. Three hours of meetings yesterday alone.

Suraj: Good point. Let's try to batch meetings in the mornings only.

Sarah: Alright, let's wrap up. We need to do better next sprint.`,
      actionItems: JSON.stringify([
        { title: 'Review requirements with team before starting tasks', assignee: 'Suraj', completed: false },
        { title: 'Add 2 extra days for testing in sprint planning', assignee: 'Sarah', completed: false },
        { title: 'Update task board daily by 10 AM', assignee: 'Alex', completed: false },
        { title: 'Batch all meetings before noon', assignee: 'Suraj', completed: false }
      ])
    },
    {
      userId,
      id: Date.now() + 4,
      title: 'Product Roadmap Planning 2025',
      duration: '1:15:00',
      status: 'completed',
      sentiment: 'positive',
      summary: 'Strategic planning session for 2025 product direction. Team discussed major features including mobile app, API access, and team collaboration tools. Budget allocation of $150K approved for new features. Q1 will focus on mobile app development.',
      transcriptText: `CEO: Thanks everyone for joining. Let's discuss our 2025 roadmap.

Sarah: I think we should prioritize the mobile app. Our users have been requesting it for months.

CEO: That's a good point. What do we need for mobile?

Suraj: React Native would be the fastest route. I can have a prototype in 6 weeks.

Alex: Can we integrate it with our existing backend easily?

Suraj: Yes, we'll build a REST API first. That'll also let third parties integrate.

Sarah: What about team collaboration? That's one of our most requested features.

CEO: Let's plan it for Q2. We need to nail the mobile app first.

Alex: What's the budget looking like?

CEO: I've allocated $150K for new features. That should cover mobile and the API.

Sarah: Perfect. Let's make Q1 all about mobile.

Suraj: Agreed. I'll start the technical spec tomorrow.

CEO: Great meeting everyone. Let's make 2025 our best year yet!`,
      actionItems: JSON.stringify([
        { title: 'Write mobile app technical specification', assignee: 'Suraj', completed: false },
        { title: 'Design mobile app UI mockups', assignee: 'Sarah', completed: false },
        { title: 'Build REST API for mobile integration', assignee: 'Alex', completed: false },
        { title: 'Plan Q2 team collaboration features', assignee: 'Sarah', completed: false },
        { title: 'Set up mobile app development environment', assignee: 'Suraj', completed: false }
      ])
    }
  ];
}

async function handleChat(body) {
  const { message } = body ? JSON.parse(body) : { message: '' };
  
  if (!window.GROQ_API_KEY) {
    return { data: null, error: 'Groq API not configured' };
  }
  
  try {
    const response = await fetch(window.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${window.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: message }],
        temperature: 0.5,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
    return { response: botResponse };
  } catch (error) {
    console.error('[ERR] Chat error:', error);
    return { data: null, error: 'Chat failed: ' + error.message };
  }
}

function handleContact(body) {
  const data = body ? JSON.parse(body) : {};
  const leads = localStorage.getItem('scribeai_leads') || '[]';
  const parsed = JSON.parse(leads);
  parsed.push({ ...data, createdAt: Date.now() });
  localStorage.setItem('scribeai_leads', JSON.stringify(parsed));
  return { success: true, data: { ...data } };
}

async function fetchTranscripts() {
  console.group('[DBG] Fetch Transcripts');
  
  if (!isAuthenticated()) {
    console.log('[ERR] Not authenticated');
    console.groupEnd();
    return { data: [], error: 'Not authenticated' };
  }
  
  const result = await apiRequest('/api/transcripts');
  
  if (result.error) {
    console.error('[ERR] Error:', result.error);
    console.groupEnd();
    return { data: [], error: result.error };
  }
  
  const transcripts = result.data?.data || result.data || [];
  console.log(`[OK] Found ${transcripts.length} transcripts`);
  console.groupEnd();
  return { data: transcripts, error: null };
}

async function fetchTranscript(id) {
  console.group(`[DBG] Fetch Transcript #${id}`);
  
  if (!isAuthenticated()) {
    console.log('[ERR] Not authenticated');
    console.groupEnd();
    return { data: null, error: 'Not authenticated' };
  }
  
  const result = await apiRequest(`/api/transcripts/${id}`);
  
  if (result.error) {
    console.error('[ERR] Error:', result.error);
    console.groupEnd();
    return { data: null, error: result.error };
  }
  
  const transcript = result.data?.data || result.data;
  console.log('[OK] Transcript loaded:', transcript?.title);
  console.groupEnd();
  return { data: transcript, error: null };
}

async function createTranscript(transcriptData) {
  console.group('[DBG] Create Transcript Flow');
  
  if (!isAuthenticated()) {
    console.log('[ERR] Not authenticated');
    console.groupEnd();
    return { data: null, error: 'Not authenticated' };
  }
  
  const user = getStoredUser();
  const newTranscript = {
    ...transcriptData,
    id: Date.now(),
    userId: user.id,
    createdAt: new Date().toISOString()
  };
  
  const allTranscripts = getStoredTranscripts();
  allTranscripts.push(newTranscript);
  setStoredTranscripts(allTranscripts);
  
  console.log('[OK] Created:', newTranscript.id);
  console.groupEnd();
  return { data: newTranscript, error: null };
}

async function updateTranscript(id, updates) {
  console.group(`[DBG] Update Transcript #${id}`);
  
  if (!isAuthenticated()) {
    console.groupEnd();
    return { data: null, error: 'Not authenticated' };
  }
  
  const allTranscripts = getStoredTranscripts();
  const index = allTranscripts.findIndex(t => t.id === id);
  
  if (index < 0) {
    console.log('[ERR] Not found');
    console.groupEnd();
    return { data: null, error: 'Not found' };
  }
  
  allTranscripts[index] = { ...allTranscripts[index], ...updates };
  setStoredTranscripts(allTranscripts);
  
  console.log('[OK] Updated');
  console.groupEnd();
  return { data: allTranscripts[index], error: null };
}

async function deleteTranscript(id) {
  console.group(`[DBG] Delete Transcript #${id}`);
  
  const allTranscripts = getStoredTranscripts();
  const filtered = allTranscripts.filter(t => t.id !== id);
  setStoredTranscripts(filtered);
  
  console.log('[OK] Deleted');
  console.groupEnd();
  return { success: true, error: null };
}

async function chatWithAI(message) {
  console.group('[DBG] AI Chat Request');
  console.log('Message:', message.substring(0, 50) + '...');
  
  const result = await handleChat(JSON.stringify({ message }));
  
  if (result.error || result.data?.error) {
    console.error('[ERR] Error:', result.error || result.data?.error);
    console.groupEnd();
    return { data: null, error: result.error || result.data?.error };
  }
  
  console.log('[OK] Response received');
  console.groupEnd();
  return { data: result, error: null };
}

async function askMeetingAI(transcriptId, question) {
  console.group(`[DBG] Ask Meeting #${transcriptId}`);
  console.log('Question:', question);
  
  const allTranscripts = getStoredTranscripts();
  const user = getStoredUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }
  
  const transcript = allTranscripts.find(t => t.id === transcriptId && t.userId === user.id);
  
  if (!transcript) {
    console.error('[ERR] Transcript not found');
    console.groupEnd();
    return { data: null, error: 'Transcript not found' };
  }
  
  const transcriptText = transcript.transcriptText || transcript.transcript_text || '';
  
  if (!transcriptText) {
    console.error('[ERR] Transcript has no text content');
    console.groupEnd();
    return { data: null, error: 'No transcript provided for this meeting.' };
  }
  
  const shortContext = transcriptText.length > 3000 
    ? transcriptText.substring(0, 3000) + '...\n[truncated]'
    : transcriptText;
    
  const contextPrompt = `MEETING TRANSCRIPT:
${shortContext}

Based on the transcript above, answer this question: ${question}

If the answer isn't in the transcript, say so briefly. Keep responses concise.`;
  
  console.log('[DBG] Sending to AI...');
  
  const result = await chatWithAI(contextPrompt);
  
  console.log(result.error ? '[ERR] Error' : '[OK] Answer generated');
  console.groupEnd();
  return result;
}

async function generateSummary(transcriptId, transcriptText) {
  console.group('[DBG] AI Summary Generation');
  console.log(`Generating summary for transcript #${transcriptId}...`);
  
  const prompt = `Analyze this meeting transcript and provide:
1. A brief summary (2-3 sentences)
2. Key decisions made
3. Action items with assignees (if any)

Transcript:
${transcriptText.substring(0, 3000)}

Respond in JSON format:
{
  "summary": "...",
  "decisions": ["..."],
  "actionItems": [{"title": "...", "assignee": "..."}]
}`;
  
  const result = await chatWithAI(prompt);
  
  if (result.error) {
    console.error('[ERR] Summary generation failed');
    console.groupEnd();
    return { data: null, error: result.error };
  }
  
  try {
    const response = result.data?.data?.response || result.data?.response || '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    console.log('[OK] Summary generated:', parsed.summary?.substring(0, 50) + '...');
    console.groupEnd();
    return { data: parsed, error: null };
  } catch (e) {
    console.error('[ERR] Parse error:', e);
    console.groupEnd();
    return { data: { summary: result.data?.data?.response || result.data?.response || '' }, error: null };
  }
}

async function submitContact(name, email, message) {
  console.group('[DBG] Contact Form Submission');
  
  const result = handleContact(JSON.stringify({ name, email, message }));
  
  console.log(result.error ? '[ERR] Error' : '[OK] Message sent');
  console.groupEnd();
  return result;
}

async function seedSampleData() {
  console.group('[DBG] Seed Sample Data');
  
  const result = handleSeed();
  
  console.log(result.error ? '[ERR] Error' : '[OK] Sample data seeded');
  console.groupEnd();
  return result;
}

function showLoading(container) {
  if (!container) return;
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; gap: 16px;">
      <div class="loading" style="width: 40px; height: 40px; border-width: 3px;"></div>
      <p style="color: var(--text-muted);">Loading...</p>
    </div>
  `;
}

function showError(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: var(--accent-error);">
      <p>[WARN] ${message}</p>
    </div>
  `;
}

function showEmpty(container, message = 'No data found') {
  if (!container) return;
  container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: var(--text-muted);">
      <p>[DBG] ${message}</p>
    </div>
  `;
}

function disableButton(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span>';
}

function enableButton(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = btn.dataset.originalText || 'Submit';
}

const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  patch: (endpoint, data) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' })
};

window.api = api;
window.chatWithAI = chatWithAI;
window.askMeetingAI = askMeetingAI;
console.log('[OK] chatWithAI exposed to window:', typeof chatWithAI === 'function');
window.API_URL = window.CONFIG?.API_URL || 'http://localhost:3000';
window.CONFIG = { API_URL: window.API_URL };

window.GROQ_API_KEY = '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';
window.GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

window.STORAGE_KEYS = {
  TRANSCRIPTS: 'scribeai_transcripts',
  USERS: 'scribeai_users',
  CURRENT_USER: 'scribeai_current_user',
  TOKEN: 'scribeai_token'
};

console.log('[OK] config.js loaded');

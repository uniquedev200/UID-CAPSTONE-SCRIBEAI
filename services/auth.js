const TOKEN_KEY = window.STORAGE_KEYS.TOKEN;
const USER_KEY = window.STORAGE_KEYS.CURRENT_USER;

window.currentUser = null;
window.token = null;
window.authReady = false;

function generateToken(user) {
  return btoa(JSON.stringify({ id: user.id, email: user.email, time: Date.now() }));
}

function hashPassword(password) {
  let hash = 0;
  const salt = 'scribeai_2024';
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | hash;
  }
  return 'hash_' + Math.abs(hash);
}

function getUsers() {
  const data = localStorage.getItem(window.STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

function setUsers(users) {
  localStorage.setItem(window.STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getToken() {
  if (window.token) return window.token;
  window.token = localStorage.getItem(TOKEN_KEY);
  return window.token;
}

function setToken(newToken) {
  window.token = newToken;
  if (newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getStoredUser() {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function seedDemoUser() {
  const users = getUsers();
  const demoExists = users.find(u => u.email === 'demo@scribeai.com');
  if (!demoExists) {
    const demoUser = {
      id: 'demo_' + Date.now(),
      email: 'demo@scribeai.com',
      name: 'Demo User',
      passwordHash: hashPassword('demo123'),
      createdAt: new Date().toISOString()
    };
    users.push(demoUser);
    setUsers(users);
    console.log('[OK] Demo user created');
  }
}

async function initAuth() {
  console.group('[DBG] Auth Initialization');
  
  seedDemoUser();
  
  const token = getToken();
  const storedUser = getStoredUser();
  
  if (token && storedUser) {
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.id === storedUser.id && decoded.email === storedUser.email) {
        window.currentUser = storedUser;
        console.log('[OK] Token valid, user:', window.currentUser.email);
      } else {
        console.log('[ERR] Token invalid, clearing auth');
        clearAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (storedUser) {
        window.currentUser = storedUser;
        console.log('[WARN] Using cached user:', storedUser.email);
      }
    }
  } else if (storedUser) {
    window.currentUser = storedUser;
    console.log('[WARN] Using cached user (no token):', storedUser.email);
  }
  
  window.authReady = true;
  console.groupEnd();
  return window.currentUser;
}

function clearAuth() {
  window.currentUser = null;
  window.token = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function requireAuth() {
  console.group('[DBG] Auth Guard Check');
  
  if (!window.authReady) {
    console.log('[DBG] Waiting for auth to initialize...');
    await initAuth();
  }
  
  if (!window.currentUser) {
    console.log('[ERR] No user - redirecting to auth');
    console.groupEnd();
    window.location.href = 'auth.html';
    return false;
  }
  
  console.log('[OK] Authenticated:', window.currentUser.email);
  console.groupEnd();
  return window.currentUser;
}

function isAuthenticated() {
  return !!window.currentUser;
}

function getCurrentUser() {
  return window.currentUser;
}

async function signIn(email, password) {
  console.group('[DBG] Sign In Flow');
  
  if (email === 'demo@scribeai.com' && password === 'demo123') {
    const users = getUsers();
    const user = users.find(u => u.email === 'demo@scribeai.com');
    if (user) {
      const token = generateToken(user);
      setToken(token);
      setStoredUser(user);
      window.currentUser = user;
      console.log('[OK] Demo login successful');
      console.groupEnd();
      return { data: user, error: null };
    }
  }
  
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('[ERR] Login failed: User not found');
    console.groupEnd();
    return { data: null, error: 'Invalid credentials' };
  }
  
  const hashedInput = hashPassword(password);
  if (user.passwordHash !== hashedInput) {
    console.error('[ERR] Login failed: Wrong password');
    console.groupEnd();
    return { data: null, error: 'Invalid credentials' };
  }
  
  const token = generateToken(user);
  setToken(token);
  setStoredUser(user);
  window.currentUser = user;
  console.log('[OK] Login successful:', user.email);
  console.groupEnd();
  return { data: user, error: null };
}

async function signUp(email, password, name) {
  console.group('[DBG] Sign Up Flow');
  
  const users = getUsers();
  const existing = users.find(u => u.email === email);
  
  if (existing) {
    console.error('[ERR] Signup failed: User already exists');
    console.groupEnd();
    return { data: null, error: 'User already exists' };
  }
  
  const newUser = {
    id: Date.now().toString(),
    email,
    name: name || email.split('@')[0],
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  setUsers(users);
  
  const token = generateToken(newUser);
  setToken(token);
  setStoredUser(newUser);
  window.currentUser = newUser;
  console.log('[OK] Signup successful:', newUser.email);
  console.groupEnd();
  return { data: newUser, error: null };
}

function signInWithGoogle() {
  console.log('[WARN] Google OAuth not available in local mode');
}

async function signOut() {
  console.group('[DBG] Sign Out Flow');
  
  clearAuth();
  window.currentUser = null;
  console.log('[OK] Signed out');
  console.groupEnd();
  
  window.location.href = 'auth.html';
}

function updateAuthUI() {
  const user = window.currentUser;
  
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileAvatar = document.getElementById('profile-avatar');
  const headerAvatar = document.getElementById('header-avatar');
  const dropdownName = document.getElementById('dropdown-user-name');
  const dropdownEmail = document.getElementById('dropdown-user-email');
  
  if (profileName && user) {
    profileName.textContent = user.name || user.email.split('@')[0];
  }
  
  if (profileEmail && user) {
    profileEmail.textContent = user.email;
  }
  
  if (profileAvatar && user) {
    const initial = (user.name || user.email)[0].toUpperCase();
    profileAvatar.textContent = initial;
  }
  
  if (headerAvatar && user) {
    const initial = (user.name || user.email)[0].toUpperCase();
    headerAvatar.textContent = initial;
  }
  
  if (dropdownName && user) {
    dropdownName.textContent = user.name || user.email.split('@')[0];
  }
  
  if (dropdownEmail && user) {
    dropdownEmail.textContent = user.email;
  }
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('header-user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
    const user = window.currentUser;
    if (user) {
      const nameEl = document.getElementById('dropdown-user-name');
      const emailEl = document.getElementById('dropdown-user-email');
      if (nameEl) nameEl.textContent = user.name || user.email.split('@')[0];
      if (emailEl) emailEl.textContent = user.email;
    }
  }
}

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('header-user-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

function showHelpModal() {
  alert('ScribeAI Help\n\n- Click on a meeting to view details\n- Use the Ask AI tab to chat about your meeting\n- Upload new meetings using the Upload button in the sidebar');
}
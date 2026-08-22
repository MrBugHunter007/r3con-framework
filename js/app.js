/**
 * app.js — R3CON Bug Bounty Framework
 * Main application module. All Firebase calls are isolated here.
 */

import { CHECKLIST_PHASES } from './checklist-data.js';
import { generateAllDorks, getDorkSearchURL } from './dork-data.js';
import {
  getStoredConfig, storeConfig, clearStoredConfig, initFirebase
} from './firebase-init.js';

// ────────────────────────────────────────────────────────────
// GLOBAL STATE
// ────────────────────────────────────────────────────────────
let AUTH = null;
let DB = null;
let currentUser = null;
let allProjects = [];
let currentProjectId = null;
let currentEditProjectId = null;
let currentNoteId = null;

// ────────────────────────────────────────────────────────────
// FIREBASE DYNAMIC IMPORTS
// ────────────────────────────────────────────────────────────
async function getFirebaseModules() {
  const [authMod, firestoreMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
  ]);
  return { authMod, firestoreMod };
}

// ────────────────────────────────────────────────────────────
// BOOTSTRAP
// ────────────────────────────────────────────────────────────
async function bootstrap() {
  const cfg = getStoredConfig();
  if (!cfg) {
    showConfigModal();
    return;
  }

  try {
    const { auth, db } = await initFirebase(cfg);
    AUTH = auth;
    DB = db;

    const { authMod } = await getFirebaseModules();
    authMod.onAuthStateChanged(AUTH, async (user) => {
      if (user) {
        currentUser = user;
        showApp(user);
      } else {
        currentUser = null;
        showAuthScreen();
      }
    });
  } catch (err) {
    console.error('Firebase init error:', err);
    showMsg('auth-message', 'Firebase initialization failed. Check your config.', 'error');
    showConfigModal();
  }
}

// ────────────────────────────────────────────────────────────
// CONFIG MODAL
// ────────────────────────────────────────────────────────────
window.showConfigModal = function() {
  document.getElementById('config-modal').classList.remove('hidden');
  const existing = getStoredConfig();
  if (existing) {
    Object.keys(existing).forEach(k => {
      const el = document.getElementById('cfg-' + k);
      if (el) el.value = existing[k];
    });
  }
};

window.saveFirebaseConfig = async function() {
  const fields = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
  const cfg = {};
  let valid = true;
  fields.forEach(f => {
    const val = document.getElementById('cfg-' + f)?.value?.trim();
    if (!val) { valid = false; return; }
    cfg[f] = val;
  });

  if (!valid) {
    showMsg('config-message', 'Please fill in all Firebase config fields.', 'error');
    return;
  }

  try {
    storeConfig(cfg);
    const { auth, db } = await initFirebase(cfg);
    AUTH = auth;
    DB = db;
    document.getElementById('config-modal').classList.add('hidden');
    showMsg('config-message', 'Config saved!', 'success');

    const { authMod } = await getFirebaseModules();
    authMod.onAuthStateChanged(AUTH, (user) => {
      if (user) { currentUser = user; showApp(user); }
      else showAuthScreen();
    });
  } catch (err) {
    showMsg('config-message', 'Error: ' + err.message, 'error');
  }
};

window.clearConfig = function() {
  if (confirm('Clear Firebase config? App will reload.')) {
    clearStoredConfig();
    location.reload();
  }
};

// ────────────────────────────────────────────────────────────
// AUTH FLOWS
// ────────────────────────────────────────────────────────────
window.switchTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  hideMsg('auth-message');
};

window.doLogin = async function() {
  if (!AUTH) { showMsg('auth-message', 'Firebase not initialized. Set config first.', 'error'); showConfigModal(); return; }
  const email = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-password').value;
  if (!email || !pwd) { showMsg('auth-message', 'Email and password are required.', 'error'); return; }

  const btn = document.getElementById('login-btn-text');
  btn.textContent = 'Authenticating…';

  try {
    const { authMod } = await getFirebaseModules();
    await authMod.signInWithEmailAndPassword(AUTH, email, pwd);
  } catch (err) {
    btn.textContent = 'Authenticate';
    showMsg('auth-message', friendlyAuthError(err.code), 'error');
  }
};

window.doRegister = async function() {
  if (!AUTH) { showMsg('auth-message', 'Firebase not initialized. Set config first.', 'error'); showConfigModal(); return; }
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pwd = document.getElementById('reg-password').value;
  if (!name || !email || !pwd) { showMsg('auth-message', 'All fields are required.', 'error'); return; }
  if (pwd.length < 8) { showMsg('auth-message', 'Password must be at least 8 characters.', 'error'); return; }

  try {
    const { authMod } = await getFirebaseModules();
    const cred = await authMod.createUserWithEmailAndPassword(AUTH, email, pwd);
    await authMod.updateProfile(cred.user, { displayName: name });
    showMsg('auth-message', 'Account created! Signing you in…', 'success');
  } catch (err) {
    showMsg('auth-message', friendlyAuthError(err.code), 'error');
  }
};

window.doForgotPassword = async function() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showMsg('auth-message', 'Enter your email address first.', 'error'); return; }
  if (!AUTH) { showMsg('auth-message', 'Firebase not initialized.', 'error'); return; }
  try {
    const { authMod } = await getFirebaseModules();
    await authMod.sendPasswordResetEmail(AUTH, email);
    showMsg('auth-message', 'Password reset email sent!', 'success');
  } catch (err) {
    showMsg('auth-message', friendlyAuthError(err.code), 'error');
  }
};

window.doLogout = async function() {
  if (!AUTH) return;
  const { authMod } = await getFirebaseModules();
  await authMod.signOut(AUTH);
};

function friendlyAuthError(code) {
  const map = {
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account with that email.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/email-already-in-use': 'Email already registered.',
    'auth/weak-password': 'Password too weak (min 8 chars).',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Check email and password.',
  };
  return map[code] || 'Authentication error: ' + code;
}

// ────────────────────────────────────────────────────────────
// APP SHELL
// ────────────────────────────────────────────────────────────
function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp(user) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('login-btn-text').textContent = 'Authenticate';

  const name = user.displayName || user.email;
  document.getElementById('sidebar-user-info').textContent = user.email;
  document.getElementById('dashboard-greeting').textContent =
    `Welcome back, ${user.displayName || 'hunter'}.`;
  document.getElementById('settings-user-details').innerHTML =
    `<strong style="color:var(--text-0)">${name}</strong><br/>${user.email}<br/><span style="color:var(--text-3);font-size:12px">UID: ${user.uid}</span>`;

  loadProjects();
  showView('dashboard');
}

// ────────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────────
window.showView = function(viewId) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById('view-' + viewId);
  if (view) { view.classList.remove('hidden'); view.classList.add('active'); }
  const navBtn = document.getElementById('nav-' + viewId);
  if (navBtn) navBtn.classList.add('active');

  if (viewId === 'notes') populateNotesProjectSelect();
  if (viewId === 'dashboard') refreshDashboard();
};

window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
};

// ────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ────────────────────────────────────────────────────────────
function projectsRef() {
  // Each user's projects are under /users/{uid}/projects
  return window.__firebaseDb
    ? import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(m => ({
        m,
        ref: m.collection(DB, 'users', currentUser.uid, 'projects')
      }))
    : Promise.reject('DB not ready');
}

// ────────────────────────────────────────────────────────────
// PROJECTS
// ────────────────────────────────────────────────────────────
async function loadProjects() {
  if (!DB || !currentUser) return;
  try {
    const { m } = await projectsRef();
    const q = m.query(m.collection(DB, 'users', currentUser.uid, 'projects'), m.orderBy('createdAt', 'desc'));
    const snap = await m.getDocs(q);
    allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProjects(allProjects);
    refreshDashboard();
  } catch (err) {
    console.error('Load projects error:', err);
    showToast('Failed to load projects: ' + err.message, 'error');
  }
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-list');
  const recentGrid = document.getElementById('recent-projects-list');
  if (!grid) return;

  if (!projects.length) {
    const empty = `<div class="empty-state">
      <div class="empty-state-icon">◫</div>
      <div class="empty-state-title">No projects yet</div>
      <div class="empty-state-desc">Create your first bug bounty project to get started.</div>
    </div>`;
    grid.innerHTML = empty;
    if (recentGrid) recentGrid.innerHTML = empty;
    return;
  }

  const cards = projects.map(p => buildProjectCard(p)).join('');
  grid.innerHTML = cards;
  if (recentGrid) recentGrid.innerHTML = projects.slice(0, 6).map(p => buildProjectCard(p)).join('');
}

function buildProjectCard(p) {
  const progress = calcProgress(p);
  const created = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : 'N/A';
  const prioClass = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }[p.priority] || 'priority-low';
  return `
  <div class="project-card">
    <div class="project-card-header">
      <div class="project-card-name">${esc(p.name)}</div>
      <span class="priority-badge ${prioClass}">${p.priority || 'low'}</span>
    </div>
    <div class="project-card-scope">${esc(p.scope || '—')}</div>
    <div class="project-card-meta">
      <span class="project-card-platform">${esc(p.platform || '')}</span>
      <span class="project-card-date">${created}</span>
    </div>
    <div class="project-progress-mini">
      <div class="project-progress-text">${progress.done}/${progress.total} checks · ${progress.findings} findings</div>
      <div class="project-progress-bar">
        <div class="project-progress-fill" style="width:${progress.pct}%"></div>
      </div>
    </div>
    <div class="project-card-actions">
      <button class="card-action-btn" onclick="openChecklist('${p.id}')">✓ Checklist</button>
      <button class="card-action-btn" onclick="openProjectNotes('${p.id}')">◧ Notes</button>
      <button class="card-action-btn del" onclick="deleteProject('${p.id}', event)">✕ Delete</button>
    </div>
  </div>`;
}

function calcProgress(p) {
  const done = Object.values(p.checkedItems || {}).filter(Boolean).length;
  const total = CHECKLIST_PHASES.reduce((a, ph) => a + ph.items.length, 0);
  const findings = (p.findings || []).length;
  return { done, total, pct: total ? Math.round(done / total * 100) : 0, findings };
}

window.filterProjects = function() {
  const q = document.getElementById('project-search').value.toLowerCase();
  const filtered = allProjects.filter(p =>
    p.name.toLowerCase().includes(q) || (p.scope||'').toLowerCase().includes(q)
  );
  renderProjects(filtered);
};

// ─ PROJECT CRUD ────────────────────────────────────────────────
window.showNewProjectModal = function() {
  currentEditProjectId = null;
  document.getElementById('project-modal-title').textContent = 'New Project';
  ['proj-name','proj-scope','proj-notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('proj-platform').value = 'HackerOne';
  document.getElementById('proj-priority').value = 'medium';
  document.getElementById('new-project-modal').classList.remove('hidden');
};

window.saveProject = async function() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showToast('Project name is required.', 'error'); return; }
  if (!DB || !currentUser) return;

  const data = {
    name,
    scope: document.getElementById('proj-scope').value.trim(),
    platform: document.getElementById('proj-platform').value,
    priority: document.getElementById('proj-priority').value,
    notes: document.getElementById('proj-notes').value.trim(),
    updatedAt: new Date(),
  };

  try {
    const { m } = await projectsRef();
    const col = m.collection(DB, 'users', currentUser.uid, 'projects');
    if (currentEditProjectId) {
      await m.updateDoc(m.doc(col, currentEditProjectId), data);
    } else {
      data.createdAt = new Date();
      data.checkedItems = {};
      data.findings = [];
      await m.addDoc(col, data);
    }
    closeModal('new-project-modal');
    await loadProjects();
    showToast(currentEditProjectId ? 'Project updated!' : 'Project created!', 'success');
  } catch (err) {
    showToast('Error saving project: ' + err.message, 'error');
  }
};

window.deleteProject = async function(pid, e) {
  e.stopPropagation();
  if (!confirm('Delete this project and all its data?')) return;
  try {
    const { m } = await projectsRef();
    const col = m.collection(DB, 'users', currentUser.uid, 'projects');
    await m.deleteDoc(m.doc(col, pid));
    await loadProjects();
    showToast('Project deleted.', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

// ────────────────────────────────────────────────────────────
// CHECKLIST
// ────────────────────────────────────────────────────────────
window.openChecklist = async function(pid) {
  currentProjectId = pid;
  const proj = allProjects.find(p => p.id === pid);
  if (!proj) return;

  document.getElementById('checklist-project-title').textContent = proj.name;
  document.getElementById('checklist-breadcrumb').textContent = '← Projects';
  document.getElementById('checklist-breadcrumb').onclick = () => showView('projects');

  renderChecklist(proj);
  showView('checklist');
};

function renderChecklist(proj) {
  const container = document.getElementById('checklist-content');
  const checked = proj.checkedItems || {};
  const findings = proj.findings || [];

  let html = '';
  CHECKLIST_PHASES.forEach(phase => {
    const phaseChecked = phase.items.filter(i => checked[i.id]).length;
    const phaseTotal = phase.items.length;
    const isOpen = true;

    html += `
    <div class="checklist-phase" id="phase-${phase.id}">
      <div class="phase-header" onclick="togglePhase('${phase.id}')">
        <div class="phase-title-row">
          <span class="phase-icon">${phase.icon}</span>
          <span class="phase-title">${phase.title}</span>
          <span class="phase-badge badge-${phase.badge}">${phase.badge}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="phase-progress">${phaseChecked}/${phaseTotal}</span>
          <span class="phase-chevron open" id="chevron-${phase.id}">▼</span>
        </div>
      </div>
      <div class="phase-body" id="body-${phase.id}">
        ${phase.items.map(item => `
        <div class="checklist-item ${checked[item.id] ? 'done' : ''}"
             id="item-${item.id}"
             onclick="toggleCheck('${proj.id}','${item.id}')">
          <div class="item-checkbox"></div>
          <div class="item-text-block">
            <div class="item-text">${esc(item.text)}</div>
            ${item.sub ? `<div class="item-sub">${esc(item.sub)}</div>` : ''}
          </div>
          <span class="item-severity sev-${item.sev}">${item.sev}</span>
        </div>`).join('')}
      </div>
    </div>`;
  });

  // Findings section at the bottom
  html += buildFindingsSection(proj, findings);
  container.innerHTML = html;
  updateChecklistProgress(proj);
}

function buildFindingsSection(proj, findings) {
  const sevColors = { critical:'var(--red)', high:'var(--orange)', medium:'var(--yellow)', low:'var(--accent)', info:'var(--blue)' };
  const findingRows = findings.length
    ? findings.map((f, idx) => `
      <div class="finding-row" title="${esc(f.desc || '')}">
        <span class="item-severity sev-${f.severity}">${f.severity}</span>
        <span class="finding-row-title">${esc(f.title)}</span>
        <span class="finding-row-url">${esc(f.url || '')}</span>
        <span class="priority-badge" style="background:none;font-size:11px;color:var(--text-3)">${f.status || 'open'}</span>
        <button class="del-finding" onclick="deleteFinding('${proj.id}',${idx},event)">✕</button>
      </div>`).join('')
    : '<div style="color:var(--text-3);font-size:13px;padding:8px 0">No findings logged yet.</div>';

  return `
  <div class="checklist-phase">
    <div class="phase-header" style="cursor:default">
      <div class="phase-title-row">
        <span class="phase-icon">🐛</span>
        <span class="phase-title">Logged Findings</span>
        <span class="phase-badge badge-critical">findings</span>
      </div>
      <button class="btn-primary btn-sm" onclick="showFindingModal('${proj.id}')">+ Add Finding</button>
    </div>
    <div class="findings-section">${findingRows}</div>
  </div>`;
}

window.togglePhase = function(phaseId) {
  const body = document.getElementById('body-' + phaseId);
  const chevron = document.getElementById('chevron-' + phaseId);
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  chevron.classList.toggle('open', hidden);
};

window.toggleCheck = async function(pid, itemId) {
  if (!DB || !currentUser) return;
  const proj = allProjects.find(p => p.id === pid);
  if (!proj) return;

  proj.checkedItems = proj.checkedItems || {};
  proj.checkedItems[itemId] = !proj.checkedItems[itemId];

  const el = document.getElementById('item-' + itemId);
  if (el) el.classList.toggle('done', proj.checkedItems[itemId]);

  try {
    const { m } = await projectsRef();
    const col = m.collection(DB, 'users', currentUser.uid, 'projects');
    await m.updateDoc(m.doc(col, pid), { checkedItems: proj.checkedItems, updatedAt: new Date() });
    updateChecklistProgress(proj);
    refreshDashboard();
  } catch (err) {
    console.error('Toggle check error:', err);
  }
};

function updateChecklistProgress(proj) {
  const total = CHECKLIST_PHASES.reduce((a, ph) => a + ph.items.length, 0);
  const done = Object.values(proj.checkedItems || {}).filter(Boolean).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('checklist-progress-label').textContent = `${done} / ${total} completed`;
  document.getElementById('checklist-progress-pct').textContent = `${pct}%`;
  document.getElementById('checklist-progress-fill').style.width = pct + '%';
}

// ─ FINDINGS ──────────────────────────────────────────────────
window.showFindingModal = function(pid) {
  currentProjectId = pid;
  ['finding-title','finding-url','finding-desc','finding-cvss'].forEach(id =>
    document.getElementById(id) && (document.getElementById(id).value = ''));
  document.getElementById('finding-severity').value = 'medium';
  document.getElementById('finding-status').value = 'open';
  document.getElementById('finding-modal').classList.remove('hidden');
};

window.saveFinding = async function() {
  const title = document.getElementById('finding-title').value.trim();
  if (!title) { showToast('Finding title is required.', 'error'); return; }
  if (!DB || !currentUser || !currentProjectId) return;

  const finding = {
    title,
    severity: document.getElementById('finding-severity').value,
    status: document.getElementById('finding-status').value,
    url: document.getElementById('finding-url').value.trim(),
    desc: document.getElementById('finding-desc').value.trim(),
    cvss: document.getElementById('finding-cvss').value || '',
    createdAt: new Date().toISOString(),
  };

  const proj = allProjects.find(p => p.id === currentProjectId);
  if (!proj) return;
  proj.findings = proj.findings || [];
  proj.findings.push(finding);

  try {
    const { m } = await projectsRef();
    const col = m.collection(DB, 'users', currentUser.uid, 'projects');
    await m.updateDoc(m.doc(col, currentProjectId), { findings: proj.findings, updatedAt: new Date() });
    closeModal('finding-modal');
    renderChecklist(proj);
    showToast('Finding logged!', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

window.deleteFinding = async function(pid, idx, e) {
  e.stopPropagation();
  const proj = allProjects.find(p => p.id === pid);
  if (!proj) return;
  proj.findings.splice(idx, 1);
  try {
    const { m } = await projectsRef();
    const col = m.collection(DB, 'users', currentUser.uid, 'projects');
    await m.updateDoc(m.doc(col, pid), { findings: proj.findings, updatedAt: new Date() });
    renderChecklist(proj);
    showToast('Finding removed.', 'success');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

// ────────────────────────────────────────────────────────────
// NOTES
// ────────────────────────────────────────────────────────────
function populateNotesProjectSelect() {
  const sel = document.getElementById('notes-project-select');
  sel.innerHTML = '<option value="">— Select Project —</option>' +
    allProjects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
}

window.openProjectNotes = function(pid) {
  showView('notes');
  const sel = document.getElementById('notes-project-select');
  sel.value = pid;
  loadNotesForProject();
};

window.loadNotesForProject = async function() {
  const pid = document.getElementById('notes-project-select').value;
  document.getElementById('notes-list').innerHTML = '';
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
  currentNoteId = null;
  if (!pid || !DB || !currentUser) return;

  try {
    const { m } = await getFirebaseModules().then(r => r.firestoreMod ? Promise.resolve({m:r.firestoreMod}) : import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js').then(mm => ({m:mm})));
    const col = m.collection(DB, 'users', currentUser.uid, 'projects', pid, 'notes');
    const q = m.query(col, m.orderBy('updatedAt', 'desc'));
    const snap = await m.getDocs(q);
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderNotesList(notes, pid);
  } catch (err) {
    console.error('Load notes error:', err);
  }
};

function renderNotesList(notes, pid) {
  const list = document.getElementById('notes-list');
  if (!notes.length) {
    list.innerHTML = '<div style="color:var(--text-3);font-size:12px;padding:8px 0">No notes yet. Start typing to create one.</div>';
    return;
  }
  list.innerHTML = notes.map(n => {
    const d = n.updatedAt?.toDate ? n.updatedAt.toDate().toLocaleDateString() : '';
    return `
    <div class="note-item ${currentNoteId === n.id ? 'active' : ''}" onclick="openNote('${n.id}','${pid}')">
      <div class="note-item-title">${esc(n.title || 'Untitled')}</div>
      <div class="note-item-date">${d}</div>
      <div class="note-item-actions">
        <button class="note-del-btn" onclick="deleteNote('${n.id}','${pid}',event)">✕ Delete</button>
      </div>
    </div>`;
  }).join('');
}

window.openNote = async function(nid, pid) {
  currentNoteId = nid;
  const { m } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const ref = m.doc(DB, 'users', currentUser.uid, 'projects', pid, 'notes', nid);
  const snap = await m.getDoc(ref);
  if (snap.exists()) {
    document.getElementById('note-title').value = snap.data().title || '';
    document.getElementById('note-body').value = snap.data().body || '';
  }
};

window.saveNote = async function() {
  const pid = document.getElementById('notes-project-select').value;
  if (!pid) { showToast('Select a project first.', 'error'); return; }
  const title = document.getElementById('note-title').value.trim() || 'Untitled';
  const body = document.getElementById('note-body').value;
  if (!DB || !currentUser) return;

  const { m } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const col = m.collection(DB, 'users', currentUser.uid, 'projects', pid, 'notes');

  try {
    if (currentNoteId) {
      await m.updateDoc(m.doc(col, currentNoteId), { title, body, updatedAt: new Date() });
    } else {
      const ref = await m.addDoc(col, { title, body, createdAt: new Date(), updatedAt: new Date() });
      currentNoteId = ref.id;
    }
    await loadNotesForProject();
    showToast('Note saved!', 'success');
  } catch (err) {
    showToast('Error saving note: ' + err.message, 'error');
  }
};

window.deleteNote = async function(nid, pid, e) {
  e.stopPropagation();
  if (!confirm('Delete this note?')) return;
  const { m } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  await m.deleteDoc(m.doc(DB, 'users', currentUser.uid, 'projects', pid, 'notes', nid));
  currentNoteId = null;
  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value = '';
  await loadNotesForProject();
  showToast('Note deleted.', 'success');
};

// ────────────────────────────────────────────────────────────
// DORK LIBRARY
// ────────────────────────────────────────────────────────────
window.generateDorks = function() {
  const domain = document.getElementById('dork-target').value.trim();
  if (!domain) { showToast('Enter a target domain.', 'error'); return; }

  const allDorks = generateAllDorks(domain);
  const container = document.getElementById('dork-output');
  container.innerHTML = allDorks.map(cat => `
    <div class="dork-category">
      <div class="dork-category-header">
        <span class="dork-category-icon">${cat.icon}</span>
        <span class="dork-category-title">${cat.title}</span>
        <span style="color:var(--text-3);font-size:12px;margin-left:auto">${cat.queries.length} dorks</span>
      </div>
      <div class="dork-category-body">
        ${cat.queries.map(dq => {
          const url = getDorkSearchURL(cat.id, dq.q);
          return `
          <div class="dork-item">
            <span class="dork-query">${esc(dq.q)}</span>
            <div class="dork-btn">
              <a href="${esc(url)}" target="_blank" rel="noopener" class="dork-open-btn">Open ↗</a>
              <button class="dork-copy-btn" onclick="copyDork('${esc(dq.q)}',this)">Copy</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
};

window.copyDork = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => btn.textContent = orig, 1500);
  });
};

// ────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ────────────────────────────────────────────────────────────
function refreshDashboard() {
  document.getElementById('stat-projects').textContent = allProjects.length;
  let critical = 0, high = 0, medium = 0, low = 0;
  allProjects.forEach(p => {
    (p.findings || []).forEach(f => {
      if (f.severity === 'critical') critical++;
      else if (f.severity === 'high') high++;
      else if (f.severity === 'medium') medium++;
      else if (f.severity === 'low') low++;
    });
  });
  document.getElementById('stat-critical').textContent = critical;
  document.getElementById('stat-high').textContent = high;
  document.getElementById('stat-medium').textContent = medium;
  document.getElementById('stat-low').textContent = low;
}

// ────────────────────────────────────────────────────────────
// MODAL / UI HELPERS
// ────────────────────────────────────────────────────────────
window.closeModal = function(id) {
  document.getElementById(id).classList.add('hidden');
};

window.showFindingModal = window.showFindingModal;

function showMsg(elId, msg, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-message ' + type;
  el.classList.remove('hidden');
}

function hideMsg(elId) {
  const el = document.getElementById(elId);
  if (el) el.classList.add('hidden');
}

let toastTimer;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}
window.showToast = showToast;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay && overlay.id !== 'config-modal') {
      overlay.classList.add('hidden');
    }
  });
});

// Keyboard: Escape closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      if (m.id !== 'config-modal') m.classList.add('hidden');
    });
  }
});

// ────────────────────────────────────────────────────────────
// START
// ────────────────────────────────────────────────────────────
bootstrap();

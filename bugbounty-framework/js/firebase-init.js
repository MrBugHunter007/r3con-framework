/**
 * firebase-init.js
 * Loads Firebase config from localStorage (NEVER hardcoded).
 * Exposes: window.__firebaseAuth, window.__firebaseDb
 */

const CONFIG_KEY = 'r3con_fb_cfg';

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storeConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export function clearStoredConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

export async function initFirebase(cfg) {
  // Dynamically import Firebase SDKs from CDN (no bundler needed)
  const [
    { initializeApp, getApps, getApp },
    { getAuth },
    { getFirestore }
  ] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
  ]);

  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.__firebaseApp = app;
  window.__firebaseAuth = auth;
  window.__firebaseDb = db;
  window.__firebaseLoaded = true;

  return { auth, db };
}

// Auto-init if config exists
const existingCfg = getStoredConfig();
if (existingCfg) {
  initFirebase(existingCfg).catch(err => {
    console.warn('Firebase auto-init failed:', err.message);
  });
}

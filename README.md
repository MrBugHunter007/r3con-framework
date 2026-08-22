# ⬡ R3CON — Bug Bounty Intelligence Framework

A professional, self-hosted bug bounty checklist and project management tool.  
Built for security engineers who want full control of their data.

---

## ✨ Features

- 🔐 **Firebase Auth** — Email/password login, no third-party OAuth
- 🗄️ **Firestore Sync** — All projects, checklists, findings, and notes stored per-user in your own Firebase
- ✅ **Full Methodology Checklist** — 130+ items across 14 phases (Recon → Cloud)
- 🐛 **Findings Tracker** — Log Critical/High/Medium/Low findings with CVSS, URL, PoC, and status
- 📝 **Notes System** — Rich scoped notes per project, auto-saved to Firebase
- 🔎 **Dork Library** — Auto-generates Google, GitHub, Shodan, URLScan & cert-transparency dorks for any domain
- 📊 **Dashboard** — Live stats across all projects and findings
- 📱 **Fully Responsive** — Works on desktop and mobile

---

## 🚀 Hosting on GitHub Pages (Recommended)

### 1. Fork / Clone this repo

```bash
git clone https://github.com/yourusername/r3con-framework.git
cd r3con-framework
```

### 2. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Create a new project (disable Google Analytics if not needed)
3. Under **Authentication** → Enable **Email/Password** sign-in method
4. Under **Firestore Database** → Create database in **Production mode**
5. Go to **Project Settings** → **Web App** → Register app → Copy the config object

### 3. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures **each user can only access their own data** — no cross-account access possible.

### 4. Enable GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings** → **Pages**
3. Set **Source** to `GitHub Actions`
4. The included workflow (`.github/workflows/deploy.yml`) will auto-deploy on push to `main`

### 5. First login

1. Open your GitHub Pages URL (e.g. `https://yourusername.github.io/r3con-framework/`)
2. The app will prompt you for your **Firebase config** — paste it from step 2
3. Config is saved in **localStorage only** — never in source code or committed to git
4. Register your account, then log in

---

## 🔒 Security Design

| Concern | How R3CON handles it |
|---|---|
| Firebase config in source | ❌ Never — stored in browser localStorage only |
| Cross-user data access | Firestore rules enforce `uid` isolation |
| Password storage | Firebase Auth manages it (hashed, never visible) |
| Token exposure | No tokens in URLs; all requests use Firebase SDK |
| XSS | All user content is HTML-escaped before rendering |
| GitHub exposure | `.gitignore` blocks all secret files |

---

## 📁 Project Structure

```
r3con-framework/
├── index.html              # Single-page app shell
├── css/
│   └── style.css           # Full dark-theme design system
├── js/
│   ├── firebase-init.js    # Secure Firebase bootstrap (localStorage config)
│   ├── app.js              # Main application logic
│   ├── checklist-data.js   # 130+ item checklist methodology
│   └── dork-data.js        # Dork generator (Google, GitHub, Shodan, URLScan)
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages auto-deploy
├── .gitignore
└── README.md
```

---

## 🛠 Local Development

No build step required. Just serve the directory:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`

---

## 📋 Checklist Coverage

| Phase | Items |
|---|---|
| Passive Recon | 11 |
| JS Analysis & API Discovery | 8 |
| OSINT Dorking | 7 |
| Fuzzing & Directory Discovery | 6 |
| Broken Authentication & Session | 12 |
| JWT & Token Analysis | 9 |
| IDOR & BOLA | 10 |
| Privilege Escalation & RBAC | 9 |
| Injection Vulnerabilities | 9 |
| SSRF, Redirect & Smuggling | 5 |
| CSRF, CORS & Headers | 7 |
| File Upload & Storage | 6 |
| Business Logic & Race Conditions | 6 |
| Cloud & Infrastructure | 7 |

---

## ⚖️ Legal

For use only on programs where you have explicit written permission.  
Always follow responsible disclosure policies.

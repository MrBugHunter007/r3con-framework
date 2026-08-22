/**
 * dork-data.js
 * Auto-generates dork queries for a given domain.
 */

export function generateAllDorks(domain) {
  const bare = domain.replace(/^www\./, '').replace(/\/$/, '');
  const ext = bare.split('.').slice(-2).join('.'); // e.g. example.com
  const org = bare.split('.')[0]; // e.g. example

  return [
    {
      id: 'google',
      title: 'Google Dorks',
      icon: '🔍',
      queries: [
        // Sensitive files & configs
        { q: `site:${bare} ext:env`, label: '.env files' },
        { q: `site:${bare} ext:sql`, label: 'SQL dump files' },
        { q: `site:${bare} ext:bak OR ext:backup OR ext:old`, label: 'Backup files' },
        { q: `site:${bare} ext:log`, label: 'Log files' },
        { q: `site:${bare} ext:xml inurl:config`, label: 'Config XML' },
        { q: `site:${bare} ext:yaml OR ext:yml`, label: 'YAML configs' },
        { q: `site:${bare} ext:json inurl:config OR inurl:secret OR inurl:key`, label: 'JSON configs' },
        { q: `site:${bare} filetype:pem OR filetype:cer OR filetype:p12`, label: 'SSL certificates' },
        // Admin & login panels
        { q: `site:${bare} inurl:admin OR inurl:administrator OR inurl:dashboard`, label: 'Admin panels' },
        { q: `site:${bare} inurl:login OR inurl:signin OR inurl:auth`, label: 'Login pages' },
        { q: `site:${bare} inurl:panel OR inurl:cpanel OR inurl:wp-admin`, label: 'Control panels' },
        { q: `site:${bare} inurl:portal`, label: 'Portals' },
        // API & debug
        { q: `site:${bare} inurl:api inurl:v1 OR inurl:v2 OR inurl:v3`, label: 'API versioned endpoints' },
        { q: `site:${bare} inurl:graphql OR inurl:graphiql`, label: 'GraphQL endpoints' },
        { q: `site:${bare} inurl:swagger OR inurl:api-docs OR inurl:openapi`, label: 'API documentation' },
        { q: `site:${bare} inurl:debug OR inurl:test OR inurl:dev`, label: 'Debug/dev pages' },
        { q: `site:${bare} inurl:phpinfo OR inurl:phpmyadmin`, label: 'PHP info/admin' },
        // Error & info disclosure
        { q: `site:${bare} intext:"SQL syntax" OR intext:"mysql_fetch" OR intext:"ORA-"`, label: 'SQL error disclosure' },
        { q: `site:${bare} intext:"stack trace" OR intext:"exception" OR intext:"traceback"`, label: 'Error stack traces' },
        { q: `site:${bare} intext:"password" filetype:txt OR filetype:log`, label: 'Password in text/logs' },
        { q: `site:${bare} intext:"apikey" OR intext:"api_key" OR intext:"secret_key"`, label: 'API keys in pages' },
        // Subdomains & related
        { q: `site:*.${bare} -site:www.${bare}`, label: 'All subdomains' },
        { q: `site:*.${bare} inurl:login`, label: 'Subdomain login pages' },
        // Indexed sensitive pages
        { q: `site:${bare} inurl:internal OR inurl:private OR inurl:staging`, label: 'Internal/private pages' },
        { q: `site:${bare} inurl:redirect OR inurl:return_url OR inurl:next`, label: 'Open redirect params' },
        { q: `site:${bare} "Powered by" inurl:.php`, label: 'PHP tech disclosure' },
        { q: `cache:${bare}`, label: 'Google cached version' },
      ]
    },
    {
      id: 'github',
      title: 'GitHub Dorks',
      icon: '🐙',
      queries: [
        // Secrets & credentials
        { q: `"${bare}" password`, label: 'Password references' },
        { q: `"${bare}" secret`, label: 'Secret references' },
        { q: `"${bare}" api_key`, label: 'API key references' },
        { q: `"${bare}" apikey`, label: 'apikey references' },
        { q: `"${bare}" token`, label: 'Token references' },
        { q: `"${bare}" private_key`, label: 'Private key references' },
        { q: `"${bare}" access_token`, label: 'Access tokens' },
        { q: `"${bare}" client_secret`, label: 'Client secrets' },
        { q: `"${bare}" DB_PASSWORD OR "${bare}" DATABASE_PASSWORD`, label: 'DB passwords' },
        // Config files
        { q: `"${bare}" filename:.env`, label: '.env files' },
        { q: `"${bare}" filename:config.json`, label: 'config.json files' },
        { q: `"${bare}" filename:wp-config.php`, label: 'WordPress configs' },
        { q: `"${bare}" filename:.npmrc`, label: 'NPM config with tokens' },
        { q: `"${bare}" filename:docker-compose.yml`, label: 'Docker compose' },
        { q: `"${bare}" filename:.bash_history`, label: 'Bash history' },
        { q: `"${bare}" filename:id_rsa`, label: 'SSH private keys' },
        // Internal tools & endpoints
        { q: `"${bare}" internal`, label: 'Internal references' },
        { q: `"${bare}" staging`, label: 'Staging env references' },
        { q: `org:${org} password`, label: `${org} org password` },
        { q: `org:${org} secret`, label: `${org} org secrets` },
        { q: `org:${org} internal`, label: `${org} org internal` },
        // Vulnerabilities
        { q: `"${bare}" BEGIN RSA PRIVATE KEY`, label: 'RSA private keys' },
        { q: `"${bare}" AKIA`, label: 'AWS access key IDs' },
        { q: `"${bare}" "sk_live_"`, label: 'Stripe live keys' },
        { q: `"${bare}" "sq0csp-"`, label: 'Square keys' },
        { q: `"${bare}" "xoxb-" OR "xoxp-"`, label: 'Slack tokens' },
      ]
    },
    {
      id: 'shodan',
      title: 'Shodan Dorks',
      icon: '📡',
      queries: [
        { q: `hostname:${bare}`, label: 'All exposed hosts' },
        { q: `hostname:${bare} port:8080`, label: 'Alt HTTP (8080)' },
        { q: `hostname:${bare} port:8443`, label: 'Alt HTTPS (8443)' },
        { q: `hostname:${bare} port:22`, label: 'SSH exposed' },
        { q: `hostname:${bare} port:3306`, label: 'MySQL exposed' },
        { q: `hostname:${bare} port:5432`, label: 'PostgreSQL exposed' },
        { q: `hostname:${bare} port:6379`, label: 'Redis exposed' },
        { q: `hostname:${bare} port:27017`, label: 'MongoDB exposed' },
        { q: `hostname:${bare} port:9200`, label: 'Elasticsearch exposed' },
        { q: `hostname:${bare} port:2375`, label: 'Docker API exposed' },
        { q: `ssl.cert.subject.cn:${bare}`, label: 'SSL cert CN match' },
        { q: `ssl.cert.subject.cn:"*.${bare}"`, label: 'Wildcard SSL certs' },
        { q: `http.title:"${org}"`, label: 'HTTP title match' },
        { q: `org:"${org}"`, label: 'Organization match' },
        { q: `hostname:${bare} "401 Unauthorized"`, label: 'Auth-required services' },
        { q: `hostname:${bare} "X-Powered-By"`, label: 'Technology disclosure' },
        { q: `hostname:${bare} http.favicon.hash:-1616143106`, label: 'Default Apache favicon' },
        { q: `ssl:${bare} 200`, label: 'HTTPS 200 OK hosts' },
      ]
    },
    {
      id: 'urlscan',
      title: 'URLScan.io Dorks',
      icon: '🔬',
      queries: [
        { q: `page.domain:${bare}`, label: 'All scanned pages' },
        { q: `page.domain:${bare} AND page.statuscode:200`, label: 'Live 200 OK pages' },
        { q: `page.domain:${bare} AND page.url:*login*`, label: 'Login pages scanned' },
        { q: `page.domain:${bare} AND page.url:*admin*`, label: 'Admin pages scanned' },
        { q: `page.domain:${bare} AND page.url:*api*`, label: 'API endpoints scanned' },
        { q: `page.domain:${bare} AND page.url:*.json`, label: 'JSON endpoints' },
        { q: `page.domain:${bare} AND page.url:*.xml`, label: 'XML endpoints' },
        { q: `page.domain:${bare} AND page.url:*redirect*`, label: 'Redirect params' },
        { q: `page.domain:*.${bare}`, label: 'All subdomains scanned' },
        { q: `page.domain:${bare} AND hash.dom:*`, label: 'DOM hash analysis' },
        { q: `page.domain:${bare} AND page.url:*token*`, label: 'Token in URL (leakage)' },
        { q: `page.domain:${bare} AND page.url:*access_token*`, label: 'Access token in URL' },
        { q: `domain:${bare}`, label: 'All domain references' },
        { q: `page.ip:${bare}`, label: 'IP address matches' },
        { q: `page.domain:${bare} AND task.time:>now-7d`, label: 'Scanned in last 7 days' },
        { q: `page.domain:${bare} AND page.url:*debug*`, label: 'Debug pages' },
        { q: `page.domain:${bare} AND page.url:*swagger*`, label: 'Swagger UI pages' },
        { q: `page.domain:${bare} AND page.url:*graphql*`, label: 'GraphQL endpoints' },
      ]
    },
    {
      id: 'certs',
      title: 'Certificate Transparency',
      icon: '📜',
      queries: [
        { q: `https://crt.sh/?q=%.${bare}&output=json`, label: 'crt.sh wildcard search' },
        { q: `https://crt.sh/?q=${bare}&output=json`, label: 'crt.sh exact domain' },
        { q: `https://api.certspotter.com/v1/issuances?domain=${bare}&include_subdomains=true&expand=dns_names`, label: 'CertSpotter API' },
        { q: `https://otx.alienvault.com/api/v1/indicators/domain/${bare}/passive_dns`, label: 'AlienVault OTX' },
        { q: `https://api.hackertarget.com/hostsearch/?q=${bare}`, label: 'HackerTarget host search' },
        { q: `https://jldc.me/anubis/subdomains/${bare}`, label: 'Anubis subdomain DB' },
        { q: `https://rapiddns.io/subdomain/${bare}?full=1`, label: 'RapidDNS' },
        { q: `https://www.virustotal.com/ui/domains/${bare}/subdomains`, label: 'VirusTotal subdomains' },
      ]
    },
  ];
}

export const GITHUB_BASE = 'https://github.com/search?type=code&q=';
export const SHODAN_BASE = 'https://www.shodan.io/search?query=';
export const URLSCAN_BASE = 'https://urlscan.io/search/#';
export const GOOGLE_BASE = 'https://www.google.com/search?q=';

export function getDorkSearchURL(categoryId, query) {
  const q = encodeURIComponent(query);
  switch(categoryId) {
    case 'google': return `${GOOGLE_BASE}${q}`;
    case 'github': return `${GITHUB_BASE}${q}`;
    case 'shodan': return `${SHODAN_BASE}${q}`;
    case 'urlscan': return query.startsWith('https://') ? query : `${URLSCAN_BASE}${q}`;
    case 'certs': return query.startsWith('https://') ? query : `https://crt.sh/?q=${q}`;
    default: return `${GOOGLE_BASE}${q}`;
  }
}

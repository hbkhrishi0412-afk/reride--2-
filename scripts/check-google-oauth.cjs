#!/usr/bin/env node
/**
 * Diagnose Google OAuth redirect_uri_mismatch for ReRide + Supabase.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ref = 'pqtrsoytudolnvuydvfo';
const requiredRedirect = `https://${ref}.supabase.co/auth/v1/callback`;

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = { ...loadEnv(path.join(root, '.env')), ...loadEnv(path.join(root, '.env.local')) };

(async () => {
  console.log('=== ReRide Google OAuth check ===\n');
  console.log('Error this fixes: Google "Error 400: redirect_uri_mismatch"\n');

  if (!env.SUPABASE_ACCESS_TOKEN) {
    console.log('FAIL: SUPABASE_ACCESS_TOKEN missing in .env.local');
    process.exit(1);
  }

  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
  });
  const j = await r.json();
  if (!r.ok) {
    console.log('FAIL: could not read Supabase auth config', r.status, j);
    process.exit(1);
  }

  const clientField = String(j.external_google_client_id || '');
  const additional = String(j.external_google_additional_client_ids || '');
  const allClients = `${clientField},${additional}`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  console.log('Supabase Google enabled:', j.external_google_enabled);
  console.log('Supabase Google client ID(s):', allClients.join('\n  - ') || '(none)');
  console.log('Skip nonce check:', j.external_google_skip_nonce_check);
  console.log('Site URL:', j.site_url);
  console.log('Redirect allow list includes login origins:', String(j.uri_allow_list || '').includes('reride.co.in'));

  const viteId = (env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim();
  console.log('\nVITE_GOOGLE_WEB_CLIENT_ID:', viteId || '(not set)');
  if (viteId && allClients.includes(viteId)) {
    console.log('PASS: Vite Web client ID is listed in Supabase Google provider');
  } else if (viteId) {
    console.log('FAIL: Vite Web client ID is NOT in Supabase Google provider — native tokens may be rejected');
  }

  console.log('\n--- Fix redirect_uri_mismatch (required in Google Cloud) ---');
  console.log('1. Open: https://console.cloud.google.com/apis/credentials');
  console.log('2. Open the OAuth 2.0 Web client that matches Supabase (first ID above).');
  console.log('3. Under Authorized redirect URIs, add EXACTLY:');
  console.log(`   ${requiredRedirect}`);
  console.log('4. Save. Wait ~1 minute, then try Google sign-in again on https://www.reride.co.in/login');
  console.log('\nDo NOT put https://www.reride.co.in/... in Google redirect URIs for Supabase OAuth.');
  console.log('Site URLs belong in Supabase → Authentication → URL Configuration → Redirect URLs.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

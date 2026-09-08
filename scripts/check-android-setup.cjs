#!/usr/bin/env node
/**
 * End-to-end check for Android Capacitor setup checklist:
 * 1) google-services.json + VITE_ANDROID_PUSH_ENABLED
 * 2) Google OAuth Web client ID + SHA-1 fingerprints to register
 * 3) Reminder to run npm install + android:bundle
 * 4) Confirm open path is android/ (not repo root)
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const androidApp = path.join(root, 'android', 'app');
const googleServicesPath = path.join(androidApp, 'google-services.json');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const envLocal = loadEnvFile(path.join(root, '.env.local'));
const envDot = loadEnvFile(path.join(root, '.env'));
const env = { ...envDot, ...envLocal };

const results = [];
function check(ok, title, detail) {
  results.push({ ok, title, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${title}`);
  if (detail) console.log(`       ${detail}`);
}

// 1) google-services.json
let gs = null;
if (fs.existsSync(googleServicesPath)) {
  try {
    gs = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
  } catch (e) {
    check(false, 'google-services.json parses', String(e.message || e));
  }
} else {
  check(false, 'android/app/google-services.json exists', 'Missing — download from Firebase Console');
}

if (gs) {
  const clients = Array.isArray(gs.client) ? gs.client : [];
  const androidClient = clients.find(
    (c) => c?.client_info?.android_client_info?.package_name === 'com.reride.app',
  );
  check(
    Boolean(androidClient),
    'google-services.json package is com.reride.app',
    androidClient
      ? `project_id=${gs.project_info?.project_id || '?'}`
      : 'No android_client_info for com.reride.app',
  );

  const oauthClients = androidClient?.oauth_client || [];
  const hasAndroidOauth = oauthClients.some((c) => Number(c.client_type) === 1);
  const hasWebOauth = oauthClients.some((c) => Number(c.client_type) === 3);
  check(
    hasWebOauth,
    'google-services.json includes Web OAuth client (type 3)',
    hasWebOauth
      ? oauthClients.find((c) => Number(c.client_type) === 3)?.client_id
      : 'Add Web client / re-download google-services.json',
  );
  check(
    hasAndroidOauth,
    'google-services.json includes Android OAuth client (type 1)',
    hasAndroidOauth
      ? oauthClients.find((c) => Number(c.client_type) === 1)?.client_id
      : 'Missing — create Android OAuth client with package com.reride.app + SHA-1, then re-download google-services.json',
  );
}

// Push flag
const pushEnabled = env.VITE_ANDROID_PUSH_ENABLED === 'true';
check(
  pushEnabled,
  'VITE_ANDROID_PUSH_ENABLED=true in .env.local/.env',
  pushEnabled ? 'Set' : 'Add VITE_ANDROID_PUSH_ENABLED=true before npm run android:bundle',
);

// Google Web client ID
const webClientId = (env.VITE_GOOGLE_WEB_CLIENT_ID || '').trim();
check(
  Boolean(webClientId),
  'VITE_GOOGLE_WEB_CLIENT_ID set',
  webClientId || 'Required for native Google Sign-In',
);

if (webClientId && gs) {
  const clients = Array.isArray(gs.client) ? gs.client : [];
  const androidClient = clients.find(
    (c) => c?.client_info?.android_client_info?.package_name === 'com.reride.app',
  );
  const oauthIds = (androidClient?.oauth_client || []).map((c) => c.client_id);
  const otherIds = (androidClient?.services?.appinvite_service?.other_platform_oauth_client || []).map(
    (c) => c.client_id,
  );
  const allIds = [...oauthIds, ...otherIds];
  check(
    allIds.includes(webClientId),
    'VITE_GOOGLE_WEB_CLIENT_ID matches google-services.json',
    allIds.includes(webClientId)
      ? 'Matched'
      : 'Web client ID in env does not appear in google-services.json — keep them in sync',
  );
}

// 2) SHA-1 fingerprints from Gradle if possible
let debugSha1 = null;
let releaseSha1 = null;
try {
  const report = execSync('gradlew.bat :app:signingReport', {
    cwd: path.join(root, 'android'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  });
  const debugBlock = report.match(/Variant: debug[\s\S]*?(?=Variant:|$)/);
  const releaseBlock = report.match(/Variant: release[\s\S]*?(?=Variant:|$)/);
  const sha1From = (block) => {
    if (!block) return null;
    const m = block[0].match(/SHA1:\s*([0-9A-F:]+)/i);
    return m ? m[1].toUpperCase() : null;
  };
  debugSha1 = sha1From(debugBlock);
  releaseSha1 = sha1From(releaseBlock);
  check(Boolean(debugSha1), 'Debug SHA-1 available', debugSha1 || 'Could not parse');
  check(Boolean(releaseSha1), 'Release SHA-1 available', releaseSha1 || 'Could not parse (keystore may be missing)');
} catch (e) {
  check(false, 'Gradle signingReport', String(e.message || e).slice(0, 200));
}

console.log('\n--- Register these SHA-1 fingerprints in Google Cloud ---');
console.log('Console: https://console.cloud.google.com/apis/credentials');
console.log('Create/edit Android OAuth client → package name: com.reride.app');
if (debugSha1) console.log(`Debug SHA-1:   ${debugSha1}`);
if (releaseSha1) console.log(`Release SHA-1: ${releaseSha1}`);
console.log('Then: Supabase → Auth → Providers → Google → Client IDs = Web ID, Android ID');
console.log('Re-download google-services.json into android/app/ after adding SHA-1.');

// 3) node_modules / bundle reminders
const hasNodeModules = fs.existsSync(path.join(root, 'node_modules'));
check(hasNodeModules, 'node_modules present', hasNodeModules ? 'OK' : 'Run: npm install');

const distIndex = path.join(root, 'dist', 'index.html');
const syncedIndex = path.join(androidApp, 'src', 'main', 'assets', 'public', 'index.html');
check(fs.existsSync(distIndex), 'dist/ built', fs.existsSync(distIndex) ? 'OK' : 'Run: npm run android:bundle');
check(
  fs.existsSync(syncedIndex),
  'android assets synced (cap sync)',
  fs.existsSync(syncedIndex) ? 'OK' : 'Run: npm run android:bundle',
);

// 4) Open path — only Capacitor android/ exists (root Gradle placeholder removed)
const rootSettings = path.join(root, 'settings.gradle.kts');
const rootAppModule = path.join(root, 'app');
const androidSettings = path.join(root, 'android', 'settings.gradle');
const androidSettingsKts = path.join(root, 'android', 'settings.gradle.kts');
check(
  fs.existsSync(androidSettings) || fs.existsSync(androidSettingsKts),
  'Capacitor Android project exists at android/',
  'Open ONLY this folder in Android Studio',
);
check(
  !fs.existsSync(rootSettings) && !fs.existsSync(rootAppModule),
  'No root Gradle / app/ placeholder',
  'Open android/ only — repo root must not be an Android Studio project',
);

const failed = results.filter((r) => !r.ok).length;
console.log(`\nSummary: ${results.length - failed} passed, ${failed} failed/needs action`);
process.exit(failed > 0 ? 1 : 0);

/**
 * Assert Google OAuth finish rules for service providers (no frameworks).
 * Run: node scripts/google-oauth-sp-finish.selfcheck.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('components/AppProvider/useAppAuthRuntime.ts', 'utf8');
const index = fs.readFileSync('index.tsx', 'utf8');

const spBlockStart = runtime.indexOf("pendingRole === 'service_provider'");
assert.ok(spBlockStart > 0, 'service_provider OAuth branch missing');
const spBlock = runtime.slice(spBlockStart, spBlockStart + 2800);
assert.ok(spBlock.includes('handleLogin({'), 'SP OAuth must call handleLogin');
assert.ok(spBlock.includes("role: 'service_provider'"), 'SP OAuth must set service_provider role');

const syncIdx = spBlock.indexOf('await syncServiceProviderOAuth');
assert.ok(syncIdx > 0, 'must await syncServiceProviderOAuth');
const beforeSync = spBlock.slice(0, syncIdx);
assert.ok(
  !beforeSync.includes('clearOAuthIntent()'),
  'must not clear oauth intent before SP sync completes',
);
assert.ok(
  spBlock.indexOf('clearOAuthIntent()') > syncIdx,
  'clearOAuthIntent must run after sync',
);

assert.ok(index.includes('needsOAuthBootstrap'), 'index must gate mount on OAuth code');
assert.ok(index.includes('completeWebSupabaseOAuthCallbackIfNeeded'), 'index must exchange PKCE');
assert.ok(index.includes('mountApp()'), 'index must mount after OAuth bootstrap');

console.log('google-oauth-sp-finish.selfcheck: ok');

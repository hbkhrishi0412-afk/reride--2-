/**
 * Must be imported before `./App` in `index.tsx` so fetch patching runs before other code.
 * Patches relative `/api/*` for Capacitor and for the apex host `reride.co.in` → canonical API on `www`.
 */
import { ensureRerideWebCanonicalHost, restoreOAuthRoleFromUrl, patchFetchForCapacitor } from './apiConfig.js';
import { warmUpNativeGoogleSignIn } from './nativeGoogleSignIn.js';
import { initNativeGoogleOAuthReturnHandler } from './oauthMobile.js';
import { initUniversalLinksHandler } from './universalLinks.js';
import { initCapacitorAndroidBack } from './capacitorAndroidBack.js';
import { hydrateNativeTokensFromPreferences } from './nativeTokenStorage.js';
import { hydrateSupabaseAuthTokenCache } from './supabaseNativeAuthStorage.js';
import { startNativeSessionHydrate } from './nativeSessionMirror.js';

ensureRerideWebCanonicalHost();
restoreOAuthRoleFromUrl();
patchFetchForCapacitor();
void hydrateNativeTokensFromPreferences();
void hydrateSupabaseAuthTokenCache();
// Session mirror runs in parallel with React mount (auth awaits whenNativeSessionReady).
void startNativeSessionHydrate();
initNativeGoogleOAuthReturnHandler();
initUniversalLinksHandler();
warmUpNativeGoogleSignIn();
initCapacitorAndroidBack();

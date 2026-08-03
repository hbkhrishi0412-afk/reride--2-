/**
 * Hide the native Capacitor splash once React has mounted (or after a safety timeout).
 * Keeps the splash visible through JS parse instead of a fixed 1.5s auto-hide gap.
 */
import { isCapacitorNative } from './apiConfig.js';

let hideAttempted = false;

export async function hideNativeSplashScreen(): Promise<void> {
  if (hideAttempted || !isCapacitorNative()) return;
  hideAttempted = true;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    /* Plugin may be missing in web / incomplete sync — non-fatal */
  }
}

/** Schedule a fallback hide so splash never sticks if mount signaling fails. */
export function scheduleNativeSplashFallbackHide(ms = 4000): void {
  if (!isCapacitorNative() || typeof window === 'undefined') return;
  window.setTimeout(() => {
    void hideNativeSplashScreen();
  }, ms);
}

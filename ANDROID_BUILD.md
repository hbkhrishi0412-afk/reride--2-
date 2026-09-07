# ReRide – Run from Android Studio

The app is a **Capacitor** (Vite + React) project. The Play Store testing link serves a pre-built bundle; running from Android Studio uses a **local** build. Follow these steps so the app runs correctly from Android Studio.

> **Important:** Open **`android/`** in Android Studio (File → Open → select the `android` folder).  
> Do **not** open the repository root — the root `app/` module is a placeholder and will install a broken/outdated APK.  
> Safe commands that open the right project: `npm run android` or `npm run cap:open:android` (both call `npx cap open android`).

Verify this machine’s checklist anytime:

```bash
npm run android:check
```

---

## 1. Environment variables (required for local build)

The web bundle is built with Vite and bakes in `VITE_*` variables at build time. Without them, the app can show a white screen or fail to connect.

- Prefer `.env.local` (Vite loads it automatically). You can also use `.env`:
  ```bash
  copy .env.example .env.local
  ```
  Or run: `npm run env:copy` (creates `.env` from `.env.example` only if `.env` doesn't exist).
- Edit and set at least:
  - `VITE_SUPABASE_URL` – your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` – your Supabase anon key
  - `VITE_GOOGLE_WEB_CLIENT_ID` – required for native Google Sign-In on device
  - `VITE_ANDROID_PUSH_ENABLED=true` – required for FCM push (with `android/app/google-services.json`)

Get Supabase keys from [Supabase Dashboard](https://app.supabase.com) → your project → **Settings** → **API**.

### Google Sign-In SHA-1 (required — Google Cloud Console)

Native Google Sign-In needs an **Android** OAuth client for package `com.reride.app` with these SHA-1 fingerprints (from `cd android && gradlew.bat :app:signingReport` on this machine):

| Build | SHA-1 |
|-------|-------|
| **Debug** | `6B:A5:75:41:B7:60:23:24:66:A4:F5:D0:C2:B5:F5:6A:FB:E4:CD:54` |
| **Release** (`reride-newrelease`) | `81:27:33:0C:0E:A7:6B:6B:DB:5E:EE:68:E1:B4:12:49:61:27:81:F7` |

### Google web login `redirect_uri_mismatch` (Error 400)

If Google shows **Access blocked / redirect_uri_mismatch** on `www.reride.co.in`:

1. Open [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit the **Web application** OAuth client used by Supabase (see `npm run google:oauth-check`)
3. Add this **Authorized redirect URI** (exact):

   `https://pqtrsoytudolnvuydvfo.supabase.co/auth/v1/callback`

4. Save and retry. Do **not** put `https://www.reride.co.in/...` in Google’s redirect list for this flow — that URL belongs only in Supabase Redirect URLs.

Steps for Android SHA-1:

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create (or edit) **OAuth client ID** → Application type **Android** → package `com.reride.app` → paste **Debug** SHA-1 (add a second Android client or extra SHA-1 for **Release**).
3. Keep your existing **Web application** client (used by Supabase + `VITE_GOOGLE_WEB_CLIENT_ID`).
4. Supabase → **Authentication** → **Providers** → **Google** → Client IDs: **Web client ID, Android client ID** (comma-separated). Enable **Skip nonce check** if native sign-in fails with a nonce error.
5. In Firebase Console for project `reride-ade6a`, ensure the Android app has the same SHA-1s, then **re-download** `google-services.json` into `android/app/` (it should then include an Android OAuth client `client_type: 1`, not only the Web client).

See also `docs/SUPABASE_MOBILE.md`.

---

## 2. Build the web app and sync to Android

**Always do this before running from Android Studio.** The Android app loads the built web assets from `dist`; if they're missing or stale, you get a white screen or old content.

From the **project root** (where `package.json` is):

```bash
npm install
npm run android:bundle
```

Or open Studio after sync:

```bash
npm run android
```

This will:

1. Build the web app for Capacitor (`build:android`).
2. Sync the build into the Android project (`cap sync android`).
3. Open the `android` folder in Android Studio (`npm run android` only).

`npm run android:bundle` clears any stuck live-reload URL and syncs without opening Studio.

Alternatively, run the steps separately:

```bash
npm run build:android
npx cap sync android
npx cap open android
```

---

## 3. In Android Studio

1. Wait for **Gradle sync** to finish (File → Sync Project with Gradle Files if needed).
2. Set **Gradle JDK** to **JDK 17**: File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK.
3. Select the **app** run configuration and a device or emulator (API 24+).
4. Click **Run**.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Have `.env.local` with `VITE_SUPABASE_*`, `VITE_GOOGLE_WEB_CLIENT_ID`, `VITE_ANDROID_PUSH_ENABLED=true`. |
| 2 | `android/app/google-services.json` present for `com.reride.app`. |
| 3 | Android OAuth SHA-1 registered in Google Cloud + Supabase Google provider. |
| 4 | Run `npm install` then `npm run android:bundle` from the project root. |
| 5 | Open **`android/`** only (or use `npm run android` / `cap:open:android`). |
| 6 | Optional verify: `npm run android:check`. |

---

## 4. Push notifications

1. **Firebase / Google Services**
   - Project `reride-ade6a` should already have Android app `com.reride.app`.
   - Keep `google-services.json` in `android/app/`.
   - Set `VITE_ANDROID_PUSH_ENABLED=true` in `.env.local` **before** `npm run android:bundle` so the flag is baked into the WebView bundle.
2. **Server push (optional)**
   - Apply `scripts/add-push-device-tokens.sql` in Supabase.
   - Set `FIREBASE_SERVICE_ACCOUNT_KEY` on the API host for FCM sends.
3. **Web/PWA push (VAPID key)**
   - Set `VITE_VAPID_PUBLIC_KEY` for browser push (separate from Android FCM).

---

## If it still doesn't run

- **White screen:** Re-run `npm run android:bundle` so the latest web build is synced (and live-reload URL is cleared); then run again from Android Studio.
- **Google Sign-In fails (ApiException 10 / DEVELOPER_ERROR):** Android OAuth client missing SHA-1 for `com.reride.app` — use the fingerprints in §1 and re-download `google-services.json`.
- **Push never registers:** Confirm `VITE_ANDROID_PUSH_ENABLED=true` was set **at build time**, then rebuild; confirm `google-services.json` exists so the Gradle plugin applies.
- **Gradle / build errors:** Ensure Android SDK is installed (including for compileSdk 36) and JDK 17 is selected.
- **App not installing:** Use a device or emulator with API 24 or higher.

---

## 5. Release signing (Play Store AAB)

Release builds use **`android/keystore.properties`** (gitignored). Copy from the example:

```bash
copy android\keystore.properties.example android\keystore.properties
```

Edit `storeFile`, `storeType`, `keyAlias`, and passwords. The active upload key is **`app/reride-newrelease`** (PKCS12, alias `reride-newrelease`).  
Do **not** pick `app/reride-release-key.jks` in Android Studio unless that is your real upload key — wrong file/password causes:

`BadPaddingException: Given final block not properly padded`

**Build a signed AAB from the project root (recommended — avoids Android Studio “safe contents” password errors):**

```bash
npm run android:aab
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Verify signing config:**

```bash
cd android
gradlew.bat :app:signingReport
```

**If Android Studio shows “failed to decrypt safe contents entry”:** that is the IDE’s saved password vault, not Gradle. Either re-enter keystore passwords in **Build → Generate Signed Bundle** (do not reuse saved passwords), or build with `npm run android:aab` instead.

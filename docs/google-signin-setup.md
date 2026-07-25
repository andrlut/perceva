# Google Sign-In — setup & activation

The native flow shipped in `feat/google-signin-icon`: the app already contains
`@react-native-google-signin/google-signin` (native module + config plugin),
`app/lib/auth/google.ts`, and the "Continuar com Google" button on the login
screen. The button is **self-disabling**: it only renders when
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is non-empty (and the platform is Android).
Every place that env var lives (`eas.json` build profiles, the CI workflow
`env:` blocks) currently ships it **empty on purpose** — nothing appears in
the app until the steps below are done.

The exchange is `Play Services → Google ID token → supabase.auth.signInWithIdToken`.
No deep links, no redirect URLs, no nonce — do not add any of those.

---

## 1. Google Cloud Console

Console: https://console.cloud.google.com/ → create a project (or reuse an
existing one — e.g. the project behind the Play Console service account).

### 1a. OAuth consent screen

**APIs & Services → OAuth consent screen**

- User type: **External**
- App name **Perceva**, support email, developer contact
- Scopes: the defaults (`email`, `profile`, `openid`) are enough — add nothing
- Publish the app (or add test users while in Testing mode)

### 1b. Create TWO OAuth clients

**APIs & Services → Credentials → Create credentials → OAuth client ID**

| # | Type | Fields | Where its ID goes |
|---|---|---|---|
| 1 | **Web application** | name it e.g. `perceva-web` — no redirect URIs needed | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` **and** Supabase (step 2) |
| 2 | **Android** | package name **`perceva.app`** + SHA-1 fingerprints (below) | nowhere — it just has to exist in the same project |

Yes, the *Web* client ID is the one the Android app uses — that is how
`webClientId` works in the google-signin library (the ID token's `aud` is the
web client, which is what Supabase validates). The Android client is what lets
Play Services mint tokens for our package/signature.

### 1c. Both SHA-1s for the Android client

Two distributions sign with two different keys — register **both** SHA-1s on
the Android OAuth client (you can add multiple fingerprints, or create one
Android client per fingerprint):

1. **EAS keystore** (internal `preview` APK and the upload key):

   ```bash
   cd app && eas credentials -p android
   ```

   Pick the production keystore, copy the **SHA-1**.

2. **Play App Signing** (what the Play Store app is actually signed with):
   Play Console → Perceva → **Test and release → App integrity → App signing** →
   copy the **App signing key certificate SHA-1** (NOT only the upload key).

Missing one of the two makes Google Sign-In fail **only on that distribution
channel** — see troubleshooting.

---

## 2. Supabase — enable the Google provider

Project ref: `uneqnpyzevosznwkmvvo`.

**Option A — Management API** (token-authed, same pattern as the mail
templates; `SUPABASE_ACCESS_TOKEN` is already a user-level env var):

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/uneqnpyzevosznwkmvvo/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "<WEB client ID from step 1b>"
  }'
```

**Option B — dashboard**: Auth → Providers → Google → enable, and paste the
**Web** client ID into **Authorized Client IDs** (this is the `aud` GoTrue
accepts). No client secret is needed for the ID-token flow.

Also apply the metadata migration so Google users get their real name +
avatar (instead of the email prefix):

```bash
supabase db push --linked   # applies 20260725000002_handle_new_user_oauth_metadata.sql
```

---

## 3. Activation path — NO rebuild needed

The native module is already inside every build made from this branch onward;
only the JS needs to learn the client ID. `EXPO_PUBLIC_*` vars are inlined
into the JS bundle **at export time from the exporting process's
environment** — and crucially, **`eas update` does NOT read `eas.json` build
env** (that only applies to `eas build`). So the value must live wherever the
OTA export actually runs. Once steps 1–2 are done:

1. **CI workflows (the primary OTA path).** Set the real Web client ID in the
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` entry of **both** workflow `env:`
   blocks. NOTE: the key does not pre-exist there — pushing workflow-file
   changes needs a PAT with the `workflow` scope (`gh auth refresh -h
   github.com -s workflow`) or the GitHub web editor; ADD the key next to
   the EXPO_PUBLIC_SUPABASE_* vars, then fill it:
   - `.github/workflows/ci.yml` → `publish-ota` job → "Publish update to
     preview channel" step (every merge to main republishes preview — if
     this one stays empty, the next merge silently turns the button back
     OFF on the internal APK);
   - `.github/workflows/promote-production.yml` → "Publish to production
     channel" step (the Play Store app).

   The value is public-safe (like the Supabase publishable key), so plain
   `env:` is fine — no secret needed.
2. **Local shell / `.env.local`** — for manual `eas update` runs
   (`/ota-update`): set it in `app/.env.local` (see `app/.env.example`),
   which also covers local dev. `eas update` run from a shell picks it up
   from the process env / dotenv, NOT from `eas.json`.
3. **`app/eas.json`** → both `build.preview.env` and `build.production.env` —
   this covers **future `eas build`s only**. Keep it in sync so fresh builds
   are born with the button, but on its own it activates nothing via OTA.
4. Ship any `eas update` through one of the paths above (merge to main for
   preview; Promote to Production workflow for the Play Store app). The
   exported bundle inlines the env var → `isGoogleSignInAvailable` flips
   true → the button appears. No `eas build` required.

The one-time rebuild that *was* required (native module + version 1.2.0) is
the build produced from this branch itself. Builds older than 1.2.0 never get
the button (different runtimeVersion, OTA can't reach them) — which is
correct, since they lack the native module.

---

## 4. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Button doesn't appear at all | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` was empty **in the environment of the process that exported that bundle**, or running on web. For OTA that means the workflow `env:` blocks (ci.yml / promote-production.yml) or the local shell — `eas.json` env is irrelevant to `eas update`. Fix the right env, re-publish on the right channel. |
| `idToken` comes back null (alert "Falha ao entrar com Google") | `webClientId` is missing/wrong — it must be the **Web application** client ID, not the Android one. |
| Works on the internal `preview` APK but not the Play Store app | The **Play App Signing SHA-1** is missing on the Android OAuth client (the store re-signs the app). Add it from Play Console → App integrity. |
| Works in store, fails on internal APK | Inverse of the above: EAS keystore SHA-1 missing. |
| Supabase error after picking an account | Provider disabled, or the Web client ID isn't in Supabase's Authorized Client IDs (`aud` mismatch). Re-check step 2. |
| `DEVELOPER_ERROR` from Play Services | SHA-1/package mismatch on the Android client — package must be exactly `perceva.app` and the SHA-1 must match the signature of the APK you're running. |
| "Google Play Services indisponível" | Emulator without Google APIs, or outdated Play Services on device. |
| Google user shows email-prefix name / no avatar | Migration `20260725000002` not applied — the old `handle_new_user` only read `display_name`. Only affects accounts created before it's pushed. |

### Notes

- **Nonce**: never pass `nonce` to `signInWithIdToken` on this flow — the RN
  library exposes none and Android tokens carry no nonce claim. (If iOS ever
  ships, enable "Skip nonce checks" on the Supabase Google provider instead.)
- **Account linking**: GoTrue auto-links a Google identity to an existing
  email/password account with the same verified address — including the
  stuck unconfirmed-email accounts, which get a session with no OTP dance.
- **Expo Go** strips native modules — Google Sign-In only works in real
  builds (`development`/`preview`/`production`).

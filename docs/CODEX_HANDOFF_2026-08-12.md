# Codex Handoff: Unicolle iOS / Production State

Generated: 2026-08-20 14:58 JST  
Repository: `/Users/u/new-app`  
Production URL: `https://unicolle.vercel.app`

This memo is intended for resuming work after a Mac restart from a new Codex session. It records what was verified from the local repository and environment, plus user-confirmed App Store / AdMob state where local tooling cannot query Apple or Google directly.

## 1. Current Git Branch

- Branch: `main`

Command used:

```sh
git branch --show-current
```

## 2. Current HEAD Commit

- HEAD: `c30f76d Prepare App Store version 1.0.3 build 20`

Recent history:

```text
c30f76d Prepare App Store version 1.0.3 build 20
4710f5f Fix public food search zoom on iOS
ef874de Fix iOS admin data loading, search zoom, and food detail navigation
4c16c71 Add app-ads.txt for AdMob verification
5766906 audit app privacy and age rating
```

## 3. Uncommitted Changes

There are uncommitted changes and many untracked files.

Current tracked modification:

- `M out/index.html`

Large untracked groups include:

- `.cache/`
- `docs/evidence/`
- many `docs/ios-*` reports
- `ios-native/`
- generated `out/` files
- screenshot directories
- `supabase/.temp/`
- `test-results/`

Important: do not run destructive cleanup. The repo rules and user instructions prohibit:

- `git reset --hard`
- `git clean`
- `git checkout .`
- `git restore .`
- `git stash`
- deleting unrelated files

The new handoff file itself will appear as an untracked or modified file after this memo is created.

## 4. Implemented Fixes So Far

### Public Food Search iOS Zoom Fix

Committed in:

- `4710f5f Fix public food search zoom on iOS`

Changed files in that commit:

- `components/food-grid.tsx`
- `app/globals.css`
- `tests/public-food-search-focus-zoom.spec.ts`
- `package.json`
- `playwright.config.ts`
- `ios/App/App.xcodeproj/project.pbxproj`

What was implemented:

- The general user-facing "フードを探す" input was explicitly identified in `components/food-grid.tsx`.
- Added `data-testid="public-food-search-input"`.
- Added `public-food-search-input` class to the search input.
- Added `public-food-filter-select` class to public food filter selects.
- Added scoped CSS in `app/globals.css`:
  - `.public-food-search-input`
  - `.public-food-filter-select`
  - `font-size: 16px !important`
  - `line-height: 1.35`
  - `max-width: 100%`
  - `transform: none`
  - `-webkit-text-size-adjust: 100%`
- Added Playwright coverage for the public food search input:
  - `npm run test:public-food-search-focus-zoom`
  - Chromium and WebKit projects
  - widths `390x844`, `393x852`, `430x932`
- The test also checks that `user-scalable=no` and `maximum-scale=1` are not present.

### App Store Version Preparation

Committed in:

- `c30f76d Prepare App Store version 1.0.3 build 20`

Changed file:

- `ios/App/App.xcodeproj/project.pbxproj`

State:

- App `MARKETING_VERSION`: `1.0.3`
- App `CURRENT_PROJECT_VERSION`: `20`
- Widget `MARKETING_VERSION`: `1.0.3`
- Widget `CURRENT_PROJECT_VERSION`: `20`
- App Bundle ID: `com.doublecorgi.unicolle`
- Widget Bundle ID: `com.doublecorgi.unicolle.widget`
- Team ID: `2N7QF6C585`

### Previous Admin / Staff Work

Earlier commits and generated reports show:

- Staff API URL absolute resolution was implemented.
- Staff write paths were moved to staff APIs.
- Staff input focus zoom was addressed for admin/staff screens.
- Staff viewport reset tests passed in local Playwright fixtures.
- Product edit work through Build 18 addressed:
  - sale status selection
  - product kind single selection
  - legacy kind normalization
  - image processing/upload path
  - non-sticky edit header

Relevant report files:

- `docs/ios-build15-responsive-staff-report.md`
- `docs/ios-build16-staff-viewport-reset-report.md`
- `docs/ios-build17-input-focus-zoom-report.md`
- `docs/ios-build18-product-kind-audit.md`

## 5. Most Recently Fixed Problem

Most recent code fix:

- General user-facing "フードを探す" search input caused iOS WKWebView auto-zoom when focused.

Root cause recorded from the implementation:

- The public food search input and filter selects could resolve to an iOS-effective text size below the safe 16px threshold or were not explicitly protected like staff inputs.
- Staff input zoom tests existed, but they did not cover the public `FoodGrid` search input.

Fix:

- Targeted the actual public input in `components/food-grid.tsx`.
- Enforced computed `font-size: 16px` for `.public-food-search-input` and `.public-food-filter-select`.
- Added `tests/public-food-search-focus-zoom.spec.ts`.

## 6. Remaining Known Issues

### Public Search Zoom

Code and automated browser tests are complete, but final real-device confirmation is still required.

Current status:

- Fixed in source and Build 20 archive preparation.
- WebKit/Chromium Playwright tests passed.
- iOS real device must still confirm:
  - tap "フードを探す" input
  - type Japanese text
  - close keyboard
  - verify no stuck zoom
  - verify header, JP button, footer, and tab layout do not shift

If the issue persists, inspect these files first:

- `components/food-grid.tsx`
- `app/globals.css`
- `tests/public-food-search-focus-zoom.spec.ts`
- `app/layout.tsx`
- `capacitor.config.ts`
- `ios/App/App/public/_next/static/css/*.css` after `npm run build:capacitor`

Things to check:

- computed `font-size` of `data-testid="public-food-search-input"`
- focus-state CSS
- parent `transform`, `zoom`, `scale`, `100vw`, fixed/sticky layout
- viewport meta remains `width=device-width, initial-scale=1, viewport-fit=cover`
- no `user-scalable=no`
- no `maximum-scale=1`

### App Store Connect / dSYM Warnings

User-confirmed state:

- Build 20 was created for App Store Version 1.0.3.
- Upload from Xcode reached `Upload completed with warnings`.
- Warnings were for missing dSYM files for:
  - `GoogleMobileAds.framework`
  - `UserMessagingPlatform.framework`
- App Review submission was not performed by Codex.

Local note:

- `/private/tmp/unicolle-1.0.3-build20.xcarchive` is not present now.
- `/private/tmp/unicolle-1.0.3-build20-clean` still exists.
- If the Archive is needed again, regenerate from clean HEAD `c30f76d`.

### Admin Data Loading

Recent Build 18/19-era work indicates admin data loading was addressed by aligning app code and Vercel staff API code. If admin loading fails again, verify:

- app calls `https://unicolle.vercel.app/api/staff/...`
- Authorization header exists
- token is current and AAL2
- role is owner/editor and active
- server-side environment variables exist in Production
- no stale Vercel deployment is serving older routes

## 7. Vercel Production URL

- `https://unicolle.vercel.app`

Verified:

```text
curl -I https://unicolle.vercel.app/
HTTP/2 200
```

The response seen during this handoff had `x-vercel-cache: STALE`, but HTTP status was 200.

## 8. Connected Vercel Project

From `.vercel/project.json`:

```json
{
  "projectId": "prj_9zWHiw9H8sd664h8I3scjseyxEjR",
  "orgId": "team_IvkyenG43N3hE2SQuRoE9GQ4",
  "projectName": "unicolle",
  "settings": {
    "framework": "nextjs",
    "devCommand": "npm run dev",
    "installCommand": "npm install",
    "buildCommand": "npm run build",
    "nodeVersion": "24.x"
  }
}
```

Production env file exists:

- `.vercel/.env.production.local`

Only variable names were inspected. Values were not copied into this memo.

Production env variable names include:

- `ADMIN_ACCESS_TOKEN`
- `NEXT_PUBLIC_REQUEST_FORM_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Vercel system variables

Do not print the values.

## 9. Supabase Connection Status

Public iOS config exists at:

- `public/unicolle-ios-public-config.json`
- `out/unicolle-ios-public-config.json`

Current public config values verified:

- `staffEnabled: true`
- `supabaseUrl: https://wzdrvudneotgudelmlxq.supabase.co`
- `apiBaseUrl: https://unicolle.vercel.app`
- publishable Supabase key is present

Server-side service role variable exists in Vercel production env by name only. It must remain server-side only.

Never expose these to browser/iOS/client logs:

- `SUPABASE_SERVICE_ROLE_KEY`
- `service_role`
- `sb_secret`
- passwords
- TOTP secrets
- access tokens
- refresh tokens

## 10. iOS / Capacitor / Xcode State

Capacitor config:

- File: `capacitor.config.ts`
- `appId`: `com.doublecorgi.unicolle`
- `appName`: `ユニコレ`
- `webDir`: `out`
- `server.url` is only added if `CAPACITOR_SERVER_URL` is set.
- Release builds should not set `CAPACITOR_SERVER_URL`.

Plugins in package class list include:

- `AdMobPlugin`
- `AppPlugin`
- `CAPCameraPlugin`
- `FilesystemPlugin`
- `HapticsPlugin`
- `CAPNetworkPlugin`
- `PreferencesPlugin`
- `SharePlugin`
- `WidgetSyncPlugin`
- `StaffSecureSessionPlugin`

Xcode project state:

- Project: `ios/App/App.xcodeproj`
- App target: `1.0.3 (20)`
- Widget target: `1.0.3 (20)`
- Team: `2N7QF6C585`
- Bundle IDs unchanged.

## 11. App Store Connect State

Local tooling cannot directly verify current App Store Connect UI state in this session.

User-confirmed state to carry forward:

- App Store current version before this line of work: `1.0.2`
- Build 19 was uploaded previously.
- Build 20 was prepared for App Store Version `1.0.3`.
- Xcode upload reached `Upload completed with warnings`.
- Warnings were for `GoogleMobileAds.framework` and `UserMessagingPlatform.framework` dSYM.
- App Review has not been submitted by Codex.
- TestFlight addition was not performed as part of the Version 1.0.3 Build 20 preparation goal.

Next session should verify App Store Connect manually before submitting:

- Version `1.0.3`
- Build `20`
- processing complete
- warnings understood
- App Review build selectable

## 12. Current Version / Build

Repository HEAD:

- Version: `1.0.3`
- Build: `20`

From `ios/App/App.xcodeproj/project.pbxproj`:

- App `MARKETING_VERSION = 1.0.3`
- App `CURRENT_PROJECT_VERSION = 20`
- Widget `MARKETING_VERSION = 1.0.3`
- Widget `CURRENT_PROJECT_VERSION = 20`

Bundle IDs:

- App: `com.doublecorgi.unicolle`
- Widget: `com.doublecorgi.unicolle.widget`

## 13. AdMob / app-ads.txt State

User-confirmed AdMob state:

- AdMob account is still under account verification.
- The Unicolle app is also under review.
- Policy Center currently shows no issue.

Verified production `app-ads.txt`:

```text
curl -i https://unicolle.vercel.app/app-ads.txt
HTTP/2 200

google.com, pub-4180695956777361, DIRECT, f08c47fec0942fa0
```

Do not delete or change:

- `public/app-ads.txt`
- generated `out/app-ads.txt`

## 14. Recently Executed Verification Commands and Results

From the latest Build 20 preparation session:

- `npm run lint`: PASS
  - Existing `@next/next/no-img-element` warnings only.
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run build:capacitor`: PASS
  - Native catalog fetched: `foods=194`, `shops=88`, `areas=11`.
- `npx cap sync ios`: PASS
- `npm run test:public-food-search-focus-zoom`: PASS
  - 6 tests passed.
  - Chromium and WebKit.
  - widths `390x844`, `393x852`, `430x932`.
- iPhone Simulator Release build: PASS
- Archive creation for `/private/tmp/unicolle-1.0.3-build20.xcarchive`: previously PASS in the session that created Build 20.
- Final local check in this handoff:
  - `http://localhost:3000/`: HTTP 200
  - `https://unicolle.vercel.app/`: HTTP 200
  - `https://unicolle.vercel.app/app-ads.txt`: HTTP 200

## 15. Next Work for the User

1. Open App Store Connect.
2. Confirm Version `1.0.3` / Build `20` processing state.
3. Review the dSYM warnings:
   - `GoogleMobileAds.framework`
   - `UserMessagingPlatform.framework`
4. Confirm Build 20 is selectable for App Review.
5. On a real iPhone, test the general "フードを探す" search input:
   - tap input
   - enter Japanese text
   - close keyboard
   - confirm no stuck zoom
6. If the real iPhone result is good, prepare final Review Notes and submit manually.

## 16. Next Work to Give Codex

Suggested next prompt:

```text
ユニコレ Version 1.0.3 / Build 20 の App Store Connect 処理状態と実機確認結果を前提に、App Review提出前チェックリストとReview Notesを最終化してください。App Reviewへの自動提出は行わないでください。
```

If the public search zoom still occurs on device:

```text
ユニコレ Version 1.0.3 / Build 20 の実機で、一般画面「フードを探す」検索欄のiOS拡大がまだ残っています。components/food-grid.tsx、app/globals.css、生成済みiOS assetsを基準に、computed font-size、親transform、viewport、WKWebViewキャッシュを再調査してください。Build番号は勝手に上げないでください。
```

## 17. Settings / Files That Must Not Be Changed

Do not change without explicit instruction:

- Bundle ID: `com.doublecorgi.unicolle`
- Widget Bundle ID: `com.doublecorgi.unicolle.widget`
- Team ID: `2N7QF6C585`
- Signing settings
- `app-ads.txt`
- Supabase production data
- Supabase RLS
- service role handling
- `food.id` compatibility
- local eaten records / wishlist / photo records
- App Store screenshots unless explicitly requested
- `ios-native/` must not be used for current App Store app
- `server.url` must not be restored for Release local-assets app
- no `user-scalable=no`
- no `maximum-scale=1`
- no `git add .`

## 18. Causes and Notes Found During This Work

- Staff input zoom and public input zoom are separate problems.
- Staff tests alone do not prove the general "フードを探す" input is safe.
- The public search input lives in `components/food-grid.tsx`, not in `components/staff/staff-console.tsx`.
- iOS WKWebView auto-zoom is normally triggered when a focused text input has an effective font size below 16px.
- The correct fix is to keep text-entry input/select/textarea computed font size at 16px or higher, without blocking user zoom.
- Build 20 version bump is isolated to `ios/App/App.xcodeproj/project.pbxproj`.
- `/private/tmp` archives may disappear after restart or cleanup; regenerate from commit `c30f76d` if needed.
- Production app-ads remains OK.

## 19. Important Unicolle Requirements / Decisions from User

- Use the existing Capacitor app in `ios/`; do not switch to `ios-native/`.
- Keep the approved general UI design:
  - cream/white background
  - navy/blue/gold brand colors
  - current five tabs
  - current product cards/images
  - area/store images
  - "食べた" and "次回食べたい"
- App is local-assets based for iOS Release.
- Do not show Vercel web pages directly in the app via `server.url`.
- Public web should remain an app introduction/support site.
- Personal records are device-local and must not sync with staff login.
- New users start with 0 records.
- Existing user records must be preserved on update.
- Staff/admin:
  - owner and editor only
  - password + TOTP required
  - AAL2 required
  - staff API writes only
  - service role server-side only
- editor must not access owner-only operations.
- App Review submission is always manual unless explicitly requested.

## 20. Resume Steps After Mac Restart

1. Open Terminal.
2. Go to repo:

```sh
cd /Users/u/new-app
```

3. Check state:

```sh
git status --short
git branch --show-current
git log -5 --oneline
```

4. Confirm HEAD is still:

```text
c30f76d Prepare App Store version 1.0.3 build 20
```

5. Do not clean or reset the working tree.

6. Confirm dev server:

```sh
curl -I http://localhost:3000/
```

If not responding, start it and leave it running:

```sh
npm run dev
```

7. If Build 20 Archive is needed again, regenerate from clean HEAD, not from dirty worktree:

```sh
rm -rf /private/tmp/unicolle-1.0.3-build20-clean
mkdir -p /private/tmp/unicolle-1.0.3-build20-clean
# Create a clean export from HEAD, install/symlink dependencies as appropriate,
# run npm run build:capacitor, npx cap sync ios, then xcodebuild archive.
```

8. Re-run minimum verification before any new archive:

```sh
npm run lint
npm run typecheck
npm run build
npm run build:capacitor
npx cap sync ios
npm run test:public-food-search-focus-zoom
```

9. For App Store Connect:

- Check Build `20` under Version `1.0.3`.
- Do not submit App Review until real iPhone public search verification is done.
- dSYM warnings for Google ad frameworks were seen during upload; record them in review notes if relevant, but they are warnings, not necessarily upload failure.

10. If continuing with Codex, paste this file path:

```text
docs/CODEX_HANDOFF_2026-08-12.md
```

and ask Codex to resume from it.


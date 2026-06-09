# iOS / Android Release Preparation

## Current App Shell

- Framework: Next.js web app wrapped with Capacitor
- App ID: `com.usjfoodguide.app`
- App name: `ユニコレ`
- Capacitor web directory: `out`
- iOS project: `ios/App/App.xcodeproj`
- Default iOS scheme: `App`

The normal web development flow remains unchanged:

```bash
npm run dev -- -p 3000
```

Do not stop an existing `localhost:3000` development server during Codex verification.

## Static Export

The Capacitor config points to `out`, which is the Next.js static export directory.

```bash
npm run build:capacitor
npx cap sync ios
```

Current status: `npm run build:capacitor` reaches compile and TypeScript checks, then stops because Next.js static export does not support existing Server Actions used by admin and submission forms.

The current `out/index.html` is only a temporary Capacitor shell so that the iOS project can be generated and synced. It is not yet the full exported production app.

Blocked features for a pure static bundle:

- `/request` Googleフォーム外部リンク
- `/contact` server action
- `/admin/prices` server actions
- `/admin/images` server actions

Safe paths to finish a pure local static app:

1. Move public submission/contact flows to client-side localStorage queues for the native app.
2. Keep admin mutation screens on the hosted web app only.
3. Use `CAPACITOR_SERVER_URL` for a hosted production URL until the static-only mutation flows are separated.

## Hosted WebView Mode

For App Store / Google Play testing with the hosted production app:

```bash
CAPACITOR_SERVER_URL=https://your-production-domain.example npx cap sync ios
```

This keeps all existing Next.js server-side behavior available through the hosted app.

## iOS Build Commands

Requires full Xcode, not only Command Line Tools.

```bash
npx cap add ios
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 14' \
  -derivedDataPath ios/build/DerivedData \
  build
```

Repeat with:

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 14 Pro Max' \
  -derivedDataPath ios/build/DerivedData \
  build
```

## Required Native QA

Verify in the iOS app WebView:

- Home
- Search / `/foods`
- Food detail
- Eaten records
- Areas
- Settings
- Privacy
- Terms
- Contact
- Discovery report

Verify localStorage persistence:

- eaten records
- reviews
- star ratings
- settings
- backup export and restore

## Store Assets

Existing icon assets:

- `public/icons/app-icon-1024.png`
- `public/icons/app-icon-512.png`
- `public/icons/app-icon-192.png`
- `public/icons/apple-touch-icon.png`

Existing screenshots are kept under:

- `screenshots/`
- `public/screenshots/`

## Remaining Human/Xcode Work

- Install/select full Xcode: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- Open `ios/App/App.xcodeproj`
- Configure signing team and bundle capabilities
- Run iPhone 14 and iPhone 14 Pro Max Simulator checks
- Decide whether native release uses hosted WebView mode or a separated static-only native bundle

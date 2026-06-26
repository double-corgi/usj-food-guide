# iOS AdMob Production Config v1

## 1. Scope

This note records how UNICOLE separates iOS AdMob test ads from release ads.

This phase does not add Android ads, AdSense, app store submission, or production ad display during local development.

## 2. Current Rule

- Debug / Simulator / local development uses Google official test ads.
- Release can be built with the production iOS AdMob App ID and banner unit ID.
- Web / PWA does not show the native AdMob banner.
- Admin pages do not show the native AdMob banner.

## 3. iOS App ID

`ios/App/App/Info.plist` reads:

```xml
<key>GADApplicationIdentifier</key>
<string>$(GAD_APPLICATION_IDENTIFIER)</string>
```

The value is supplied by Xcode config:

- Debug: `ios/debug.xcconfig`
  - `GAD_APPLICATION_IDENTIFIER = ca-app-pub-3940256099942544~1458002511`
- Release: `ios/release.xcconfig`
  - `GAD_APPLICATION_IDENTIFIER = ca-app-pub-4180695956777361~2101761177`

## 4. Banner Unit ID

The app uses Google official test banner ads by default:

```text
ca-app-pub-3940256099942544/2934735716
```

Release banner ads are enabled only when the Capacitor web assets are built with both:

```bash
NEXT_PUBLIC_IOS_ADMOB_MODE=production
NEXT_PUBLIC_IOS_ADMOB_BANNER_AD_ID=ca-app-pub-4180695956777361/5657862807
```

If either value is missing, the app keeps using the test banner.

## 5. Debug Build Check

For local development and Simulator checks:

```bash
npm run build
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build/DerivedData CODE_SIGNING_ALLOWED=NO build
```

Expected:

- `GADApplicationIdentifier` resolves to the Google official test App ID.
- The banner is shown in test mode.
- The production banner unit ID is not selected by runtime config.

## 6. Release Build Preparation

Before App Store / TestFlight release builds, build the Capacitor web assets with:

```bash
NEXT_PUBLIC_IOS_ADMOB_MODE=production \
NEXT_PUBLIC_IOS_ADMOB_BANNER_AD_ID=ca-app-pub-4180695956777361/5657862807 \
npm run build:capacitor

npx cap sync ios
```

Then archive using the Xcode Release configuration.

Expected:

- `GADApplicationIdentifier` resolves to the production iOS AdMob App ID.
- The native banner unit ID is the production iOS banner unit ID.
- Do not click production ads during testing.

## 7. Safety Notes

- Never put Supabase service role keys or other secrets in `NEXT_PUBLIC_*`.
- AdMob App IDs and ad unit IDs are not secret, but they must not be confused with backend credentials.
- Keep `npa: true` unless privacy handling changes.
- Keep admin routes excluded from native AdMob display.
- Keep Web / PWA AdSense work separate from native AdMob.
- Avoid layouts that encourage accidental taps.

## 8. App Store Checklist

- Confirm App Privacy / Data Safety answers match AdMob usage.
- Confirm privacy policy mentions advertising SDK use before release.
- Confirm the production build is not using Google official test ad units.
- Confirm test devices are configured in AdMob if production ad units are used during pre-release checks.
- Confirm no one on the team clicks production ads.

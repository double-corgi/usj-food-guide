import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEST_BANNER_ID = "ca-app-pub-3940256099942544/2934735716";
const ADMOB_ATTRIBUTE = "data-mobile-admob-banner";
const REQUIRED_SKADNETWORK_IDS = [
  "cstr6suwn9.skadnetwork",
  "4fzdc2evr5.skadnetwork",
  "2fnua5tdw4.skadnetwork",
  "ydx93a7ass.skadnetwork",
  "p78axxw29g.skadnetwork",
  "v72qych5uu.skadnetwork",
  "ludvb6z3bs.skadnetwork",
  "cp8zw746q7.skadnetwork",
  "3sh42y64q3.skadnetwork",
  "c6k4g5qg8m.skadnetwork",
  "s39g8k73mm.skadnetwork",
  "wg4vff78zm.skadnetwork",
  "3qy4746246.skadnetwork",
  "f38h382jlk.skadnetwork",
  "hs6bdukanm.skadnetwork",
  "mlmmfzh3r3.skadnetwork",
  "v4nxqhlyqp.skadnetwork",
  "wzmmz9fp6w.skadnetwork",
  "su67r6k2v3.skadnetwork",
  "yclnxrl5pm.skadnetwork",
  "t38b2kh725.skadnetwork",
  "7ug5zh24hu.skadnetwork",
  "gta9lk7p23.skadnetwork",
  "vutu7akeur.skadnetwork",
  "y5ghdn5j9k.skadnetwork",
  "v9wttpbfk9.skadnetwork",
  "9t245vhmpl.skadnetwork",
  "n38lu8286q.skadnetwork",
  "47vhws6wlr.skadnetwork",
  "kbd757ywx3.skadnetwork",
  "a2p9lx4jpn.skadnetwork",
  "22mmun2rn5.skadnetwork",
  "44jx6755aq.skadnetwork",
  "k674qkevps.skadnetwork",
  "4468km3ulz.skadnetwork",
  "2u9pt9hc89.skadnetwork",
  "8s468mfl3y.skadnetwork",
  "klf5c3l5u5.skadnetwork",
  "ppxm28t8ap.skadnetwork",
  "kbmxgpxpgc.skadnetwork",
  "uw77j35x4d.skadnetwork",
  "578prtvx9j.skadnetwork",
  "4dzt52r2t5.skadnetwork",
  "tl55sbb4fm.skadnetwork",
  "c3frkrj4fj.skadnetwork",
  "e5fvkxwrpn.skadnetwork",
  "8c4e2ghe7u.skadnetwork",
  "3rd42ekr43.skadnetwork",
  "97r2b46745.skadnetwork",
  "3qcr597p9d.skadnetwork"
];

function read(relativePath: string) {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (/\.(js|html|json|plist|xml)$/i.test(entry)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function fileContains(filePath: string, pattern: RegExp | string) {
  const content = readFileSync(filePath, "utf8");
  return typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
}

function outputContains(directory: string, pattern: RegExp | string) {
  return collectFiles(directory).some((filePath) => fileContains(filePath, pattern));
}

const layout = read("app/layout.tsx");
const banner = read("components/mobile-admob-banner.tsx");
const capacitorConfig = read("ios/App/App/capacitor.config.json");
const infoPlist = read("ios/App/App/Info.plist");

assert(layout.includes('import { MobileAdMobBanner } from "@/components/mobile-admob-banner"'), "app/layout.tsx must import MobileAdMobBanner");
assert(layout.includes("<MobileAdMobBanner />"), "app/layout.tsx must render MobileAdMobBanner");

assert(banner.includes(TEST_BANNER_ID), "Debug/test iOS banner ID must remain the Google official test ID");
assert(banner.includes("NEXT_PUBLIC_IOS_ADMOB_MODE"), "Release mode switch must remain environment-driven");
assert(banner.includes("NEXT_PUBLIC_IOS_ADMOB_BANNER_AD_ID"), "Release banner ID must remain environment-driven");
assert(banner.includes("isNativeCapacitorApp"), "AdMob must be guarded by native Capacitor detection");
assert(banner.includes("isAdminPath"), "AdMob must be disabled on /admin paths");
assert(banner.includes("AdMob.initialize"), "AdMob.initialize must remain wired");
assert(banner.includes("AdMob.requestConsentInfo"), "UMP consent info must be requested before ads");
assert(banner.includes("AdMob.showConsentForm"), "UMP consent form must remain wired");
assert(banner.includes("canRequestAds"), "AdMob banner must wait until ads can be requested");
assert(banner.includes("AdMob.showBanner"), "AdMob.showBanner must remain wired");
assert(banner.includes("AdMob.hideBanner"), "AdMob.hideBanner must remain available for admin paths");
assert(banner.includes("AdMob.removeBanner"), "AdMob.removeBanner must remain available on cleanup");
assert(banner.includes("npa: true"), "AdMob banner requests must keep non-personalized ads enabled");
assert(!banner.includes("requestTrackingAuthorization("), "MobileAdMobBanner must not request ATT automatically");
assert(banner.includes(ADMOB_ATTRIBUTE), "Native AdMob spacing attribute must remain wired");
assert(!banner.includes("SUPABASE_SERVICE_ROLE_KEY"), "service role env name must not appear in the client AdMob component");

assert(infoPlist.includes("<key>GADApplicationIdentifier</key>"), "Info.plist must keep GADApplicationIdentifier");
assert(infoPlist.includes("<key>SKAdNetworkItems</key>"), "Info.plist must include SKAdNetworkItems");
for (const skAdNetworkId of REQUIRED_SKADNETWORK_IDS) {
  assert(infoPlist.includes(`<string>${skAdNetworkId}</string>`), `Info.plist is missing ${skAdNetworkId}`);
}

assert(capacitorConfig.includes('"appId": "com.doublecorgi.unicolle"'), "iOS Capacitor appId must remain com.doublecorgi.unicolle");
assert(capacitorConfig.includes('"AdMobPlugin"'), "iOS Capacitor config must include AdMobPlugin");

const buildOutputDirectories = [".next/static", ".vercel/output/static"]
  .map((directory) => path.join(ROOT, directory))
  .filter((directory) => existsSync(directory));

assert(buildOutputDirectories.length > 0, "No build output found. Run npm run build or npx vercel build --prod before verify:ios-admob-build.");

for (const directory of buildOutputDirectories) {
  assert(outputContains(directory, TEST_BANNER_ID), `${path.relative(ROOT, directory)} must contain the iOS test banner ID`);
  assert(outputContains(directory, ADMOB_ATTRIBUTE), `${path.relative(ROOT, directory)} must contain the native AdMob spacing marker`);
  assert(outputContains(directory, /AdMob|admob/i), `${path.relative(ROOT, directory)} must contain AdMob client code`);
}

const iosBundleFiles = collectFiles(path.join(ROOT, "ios/App/App"));
const leakedSecretFiles = iosBundleFiles.filter((filePath) => fileContains(filePath, /SUPABASE_SERVICE_ROLE_KEY|service_role/i));
assert(leakedSecretFiles.length === 0, `service role references must not be present in iOS app sources: ${leakedSecretFiles.map((filePath) => path.relative(ROOT, filePath)).join(", ")}`);

console.log("iOS AdMob build regression checks passed");

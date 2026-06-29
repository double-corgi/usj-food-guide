import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEST_BANNER_ID = "ca-app-pub-3940256099942544/2934735716";
const ADMOB_ATTRIBUTE = "data-mobile-admob-banner";

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

assert(layout.includes('import { MobileAdMobBanner } from "@/components/mobile-admob-banner"'), "app/layout.tsx must import MobileAdMobBanner");
assert(layout.includes("<MobileAdMobBanner />"), "app/layout.tsx must render MobileAdMobBanner");

assert(banner.includes(TEST_BANNER_ID), "Debug/test iOS banner ID must remain the Google official test ID");
assert(banner.includes("NEXT_PUBLIC_IOS_ADMOB_MODE"), "Release mode switch must remain environment-driven");
assert(banner.includes("NEXT_PUBLIC_IOS_ADMOB_BANNER_AD_ID"), "Release banner ID must remain environment-driven");
assert(banner.includes("isNativeCapacitorApp"), "AdMob must be guarded by native Capacitor detection");
assert(banner.includes("isAdminPath"), "AdMob must be disabled on /admin paths");
assert(banner.includes("AdMob.initialize"), "AdMob.initialize must remain wired");
assert(banner.includes("AdMob.showBanner"), "AdMob.showBanner must remain wired");
assert(banner.includes("AdMob.hideBanner"), "AdMob.hideBanner must remain available for admin paths");
assert(banner.includes("AdMob.removeBanner"), "AdMob.removeBanner must remain available on cleanup");
assert(banner.includes(ADMOB_ATTRIBUTE), "Native AdMob spacing attribute must remain wired");
assert(!banner.includes("SUPABASE_SERVICE_ROLE_KEY"), "service role env name must not appear in the client AdMob component");

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

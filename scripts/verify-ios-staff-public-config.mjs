import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

const expected = {
  supabaseUrl: "https://wzdrvudneotgudelmlxq.supabase.co",
  apiBaseUrl: "https://unicolle.vercel.app"
};

const forbidden = /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|sb_secret|Vercel secret/i;
const secretRolePattern = /(^|[^A-Za-z0-9_])service_role([^A-Za-z0-9_]|$)/i;
const textExts = new Set([".html", ".js", ".json", ".txt", ".xml", ".webmanifest", ".css", ".plist", ".entitlements"]);
const staffRelativeFetchPatterns = [
  /fetch\(\s*[`"\']\/api\/staff\//,
  /fetch\(\s*[`"\']api\/staff\//,
  /capacitor:\/\/localhost\/api\/staff\//i,
  /localhost:\d+\/api\/staff\//i
];

function fail(message) {
  console.error("[verify-ios-staff-public-config] FAIL " + message);
  process.exit(1);
}

function pass(message) {
  console.log("[verify-ios-staff-public-config] PASS " + message);
}

function readConfig(file) {
  if (!existsSync(file)) fail(file + " is missing.");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    fail(file + " is not valid JSON.");
  }
  if (config.staffEnabled !== true) fail(file + " staffEnabled must be true.");
  if (config.supabaseUrl !== expected.supabaseUrl) fail(file + " Supabase URL does not point to production.");
  if (config.apiBaseUrl !== expected.apiBaseUrl) fail(file + " API base URL is not production.");
  if (!config.supabasePublishableKey || typeof config.supabasePublishableKey !== "string") fail(file + " publishable key is missing.");
  if (config.supabasePublishableKey.includes("placeholder") || config.supabasePublishableKey.length < 20) fail(file + " publishable key is invalid.");
  const text = JSON.stringify(config);
  if (forbidden.test(text) || secretRolePattern.test(text)) fail(file + " contains a forbidden secret marker.");
  pass(file + " contains production public staff config.");
}

function extname(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index);
}

function scanTextFiles(root) {
  if (!existsSync(root)) return;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) stack.push(current + "/" + entry);
      continue;
    }
    if (!textExts.has(extname(current))) continue;
    const text = readFileSync(current, "utf8");
    if (forbidden.test(text)) fail(current + " contains a forbidden secret marker.");
    if (secretRolePattern.test(text)) fail(current + " contains service role marker.");
    if (text.includes("/api/staff/")) {
      for (const pattern of staffRelativeFetchPatterns) {
        if (pattern.test(text)) fail(current + " contains a relative or local staff API call.");
      }
    }
  }
  pass(root + " has no forbidden secret markers in text assets.");
}

const archiveArg = process.argv.find((arg) => arg.endsWith(".xcarchive"));
const appPublic = archiveArg ? archiveArg + "/Products/Applications/App.app/public" : null;
const configFiles = [
  "public/unicolle-ios-public-config.json",
  "out/unicolle-ios-public-config.json",
  "ios/App/App/public/unicolle-ios-public-config.json"
];
if (appPublic) configFiles.push(appPublic + "/unicolle-ios-public-config.json");

for (const file of configFiles) readConfig(file);
scanTextFiles("ios/App/App/public");
if (appPublic) scanTextFiles(archiveArg + "/Products/Applications/App.app");

pass("staff public config verification complete.");

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const envFiles = [".env.ios.production.local", ".env.vercel.production.local", ".env.local"];

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] === undefined) process.env[key] = unquote(rawValue);
  }
}

for (const file of envFiles) loadEnvFile(file);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://unicolle.vercel.app";

const config = {
  staffEnabled: true,
  supabaseUrl,
  supabasePublishableKey,
  apiBaseUrl
};

function fail(message) {
  console.error("[ios-staff-public-config] " + message);
  process.exit(1);
}

if (config.supabaseUrl !== "https://wzdrvudneotgudelmlxq.supabase.co") fail("NEXT_PUBLIC_SUPABASE_URL must point to the production Supabase project.");
if (!config.supabasePublishableKey || config.supabasePublishableKey.includes("placeholder")) fail("Supabase publishable/anon key is missing.");
if (config.apiBaseUrl !== "https://unicolle.vercel.app") fail("NEXT_PUBLIC_API_BASE_URL must be https://unicolle.vercel.app.");

const forbidden = /SUPABASE_SERVICE_ROLE_KEY|service_role|sb_secret|SUPABASE_SECRET_KEY|Vercel secret/i;
const serialized = JSON.stringify(config, null, 2) + "\n";
if (forbidden.test(serialized)) fail("Forbidden secret marker detected in generated public config.");

const targets = process.argv.slice(2);
const outputTargets = targets.length ? targets : ["public/unicolle-ios-public-config.json"];
for (const target of outputTargets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, serialized);
}

console.log("[ios-staff-public-config] wrote " + outputTargets.length + " public config file(s).");

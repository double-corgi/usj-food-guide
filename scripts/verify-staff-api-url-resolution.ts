import { resolveStaffApiUrl, type StaffPublicConfig } from "../lib/staff-auth-client";

const config: StaffPublicConfig = {
  staffEnabled: true,
  supabaseUrl: "https://wzdrvudneotgudelmlxq.supabase.co",
  supabasePublishableKey: "test-public-key-for-url-resolution-only",
  apiBaseUrl: "https://unicolle.vercel.app"
};

const expectedCatalog = "https://unicolle.vercel.app/api/staff/catalog";
const expectedRevalidate = "https://unicolle.vercel.app/api/staff/revalidate";

type Case = {
  name: string;
  setup: () => void;
};

function fail(message: string): never {
  console.error("[verify-staff-api-url-resolution] FAIL " + message);
  process.exit(1);
}

function pass(message: string) {
  console.log("[verify-staff-api-url-resolution] PASS " + message);
}

const cases: Case[] = [
  {
    name: "Capacitorなし",
    setup: () => {
      delete (globalThis as any).window;
    }
  },
  {
    name: "Capacitorあり・isNativePlatformなし",
    setup: () => {
      (globalThis as any).window = { Capacitor: {} };
    }
  },
  {
    name: "isNativePlatform=true",
    setup: () => {
      (globalThis as any).window = { Capacitor: { isNativePlatform: () => true } };
    }
  },
  {
    name: "isNativePlatform=false",
    setup: () => {
      (globalThis as any).window = { Capacitor: { isNativePlatform: () => false } };
    }
  }
];

for (const item of cases) {
  item.setup();
  const catalog = resolveStaffApiUrl("/api/staff/catalog", config);
  const revalidate = resolveStaffApiUrl("/api/staff/revalidate", config);
  if (catalog !== expectedCatalog) fail(item.name + " catalog resolved to " + catalog);
  if (revalidate !== expectedRevalidate) fail(item.name + " revalidate resolved to " + revalidate);
  pass(item.name + " resolves staff API to production absolute URLs.");
}

const nested = resolveStaffApiUrl("api/staff/catalog", config);
if (nested !== expectedCatalog) fail("relative path without leading slash resolved to " + nested);
pass("relative paths without a leading slash are normalized.");

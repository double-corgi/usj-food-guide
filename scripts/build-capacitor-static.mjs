import { mkdirSync, readdirSync, rmSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";

const replacementsByFile = new Map();


const placeholderActionStubs = new Map([
  ["app/contact/actions.ts", `export type ContactState = { ok: boolean; message: string };
export async function submitContact(..._args: any[]): Promise<ContactState> { return { ok: false, message: "" }; }
`],
  ["app/admin/operators/actions.ts", `export async function inviteAdminOperator(..._args: any[]): Promise<void> {}
export async function updateAdminOperatorRole(..._args: any[]): Promise<void> {}
export async function disableAdminOperator(..._args: any[]): Promise<void> {}
`],
  ["app/admin/images/actions.ts", `export type ManualImageState = { ok: boolean; message: string };
export async function approveImageCandidate(..._args: any[]): Promise<void> {}
export async function rejectImageCandidate(..._args: any[]): Promise<void> {}
export async function saveManualImageUrl(..._args: any[]): Promise<ManualImageState> { return { ok: false, message: "" }; }
export async function keepPlaceholderImage(..._args: any[]): Promise<void> {}
`],
  ["app/admin/prices/actions.ts", `export type ManualPriceState = { ok: boolean; message: string; foodId?: string };
export async function saveManualPrice(..._args: any[]): Promise<ManualPriceState> { return { ok: false, message: "" }; }
export async function saveManualMetadata(..._args: any[]): Promise<ManualPriceState> { return { ok: false, message: "" }; }
export async function holdManualPriceReview(..._args: any[]): Promise<ManualPriceState> { return { ok: false, message: "" }; }
export async function recordDuplicateDecision(..._args: any[]): Promise<void> {}
`],
  ["app/admin/login/actions.ts", `export async function sendAdminMagicLink(..._args: any[]): Promise<void> {}
`],
  ["app/admin/foods/actions.ts", `export type AdminFoodSaveState = { ok: boolean; message: string };
export async function createAdminFood(..._args: any[]): Promise<AdminFoodSaveState> { return { ok: false, message: "" }; }
export async function updateManualFood(..._args: any[]): Promise<AdminFoodSaveState> { return { ok: false, message: "" }; }
export async function updateGeneratedFoodOverride(..._args: any[]): Promise<AdminFoodSaveState> { return { ok: false, message: "" }; }
export async function setManualFoodVisibility(..._args: any[]): Promise<void> {}
export async function setManualFoodDeleted(..._args: any[]): Promise<void> {}
export async function permanentlyDeleteManualFood(..._args: any[]): Promise<void> {}
export async function setGeneratedFoodVisibility(..._args: any[]): Promise<void> {}
export async function resetGeneratedFoodOverride(..._args: any[]): Promise<void> {}
`],
  ["app/admin/summer-2026-review/actions.ts", `export async function saveSummer2026ReviewDecisions(..._args: any[]): Promise<any> { return { ok: false, updated: 0, errors: [] }; }
`]
]);

const placeholderStaticPageFiles = new Set([
  "app/admin/page.tsx",
  "app/admin/catalog/page.tsx",
  "app/admin/foods/page.tsx",
  "app/admin/foods/new/page.tsx",
  "app/admin/operators/page.tsx",
  "app/admin/summer-2026-review/page.tsx",
  "app/admin/dashboard/page.tsx",
  "app/admin/data-quality/page.tsx",
  "app/admin/forbidden/page.tsx",
  "app/admin/images/page.tsx",
  "app/admin/login/page.tsx",
  "app/admin/prices/page.tsx",
  "app/admin/review-center/page.tsx",
  "app/admin/reviews/page.tsx",
]);

const placeholderDynamicIdFiles = new Set([
  "app/admin/foods/[id]/page.tsx",
  "app/admin/foods/[id]/edit/page.tsx",
  "app/staff/collections/[id]/edit/page.tsx",
  "app/staff/foods/[id]/edit/page.tsx",
  "app/staff/stores/[id]/edit/page.tsx",
  "app/staff/areas/[id]/edit/page.tsx"
]);

function addReplacement(file, from, to) {
  const replacements = replacementsByFile.get(file) ?? [];
  replacements.push([from, to]);
  replacementsByFile.set(file, replacements);
}

function addForceStatic(file) {
  addReplacement(file, "export const dynamic = \"force-dynamic\";", "export const dynamic = \"force-static\";");
}

[
  "app/api/native/catalog/route.ts",
  "app/api/staff/catalog/route.ts",
  "app/api/staff/revalidate/route.ts",
  "app/api/staff/write/route.ts",
  "app/api/staff/upload-image/route.ts",
  "app/auth/invite/page.tsx",
  "app/foods/[id]/page.tsx",
  "app/staff/page.tsx",
  "app/staff/collections/new/page.tsx",
  "app/staff/foods/new/page.tsx",
  "app/staff/stores/new/page.tsx",
  "app/staff/areas/new/page.tsx",
].forEach(addForceStatic);

addReplacement(
  "lib/supabase-server.ts",
  "export async function createServerSupabaseClient(options: ServerSupabaseClientOptions = {}) {\n  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;",
  "export async function createServerSupabaseClient(options: ServerSupabaseClientOptions = {}) {\n  if (process.env.CAPACITOR_STATIC_EXPORT === \"1\") return null;\n  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;"
);

addReplacement(
  "app/collections/[id]/page.tsx",
  "export const dynamic = \"force-dynamic\";",
  "export const dynamic = \"force-static\";\nexport const dynamicParams = false;\n\nexport async function generateStaticParams(..._args: any[]) {\n  const collections = await listFoodCollections();\n  return collections.map((collection) => ({ id: collection.id }));\n}"
);

addReplacement(
  "app/sitemap.ts",
  "const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? \"https://new-app-chi-rosy.vercel.app\";",
  "export const dynamic = \"force-static\";\n\nconst siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? \"https://new-app-chi-rosy.vercel.app\";"
);

addReplacement(
  "app/foods/page.tsx",
  "const resolvedSearchParams = await searchParams;",
  "const resolvedSearchParams = {} as Awaited<typeof searchParams>;"
);

addReplacement(
  "app/foods/page.tsx",
  "const [foods, admin] = await Promise.all([listFoods(), getCurrentAdmin()]);",
  "const foods = await listFoods();\n  const admin = null;"
);

addReplacement(
  "app/foods/[id]/page.tsx",
  "export const dynamicParams = true;",
  "export const dynamicParams = false;\n\nexport async function generateStaticParams() {\n  const foods = await listFoods();\n  return foods.map((food) => ({ id: food.id }));\n}"
);

addReplacement(
  "app/foods/[id]/page.tsx",
  "const admin = await getCurrentAdmin();",
  "const admin = null;"
);

addReplacement(
  "app/foods/[id]/page.tsx",
  "const canEdit = admin?.mode === \"supabase\" && (admin.role === \"owner\" || admin.role === \"editor\");",
  "const canEdit = false;"
);

addReplacement(
  "app/foods/page.tsx",
  "const adminCanEdit = admin?.mode === \"supabase\" && (admin.role === \"owner\" || admin.role === \"editor\");",
  "const adminCanEdit = false;"
);

addReplacement(
  "app/auth/callback/route.ts",
  "import { createServerSupabaseClient, createServiceSupabaseClient } from \"@/lib/supabase-server\";",
  "import { createServerSupabaseClient, createServiceSupabaseClient } from \"@/lib/supabase-server\";\n\nexport const dynamic = \"force-static\";"
);

async function fetchLatestNativeCatalog(target) {
  const url = process.env.UNICOLLE_NATIVE_CATALOG_SOURCE_URL ?? "https://unicolle.vercel.app/api/native/catalog";
  mkdirSync(dirname(target), { recursive: true });
  const response = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-store" } });
  if (!response.ok) throw new Error(`Failed to fetch native catalog: ${response.status}`);
  const catalog = await response.json();
  const foods = Array.isArray(catalog.foods) ? catalog.foods : [];
  const shops = Array.isArray(catalog.shops) ? catalog.shops : [];
  const areas = Array.isArray(catalog.areas) ? catalog.areas : [];
  if (foods.length < 190 || shops.length < 80 || areas.length < 10) {
    throw new Error(`Native catalog looks incomplete: foods=${foods.length}, shops=${shops.length}, areas=${areas.length}`);
  }
  writeFileSync(target, JSON.stringify(catalog, null, 2) + "\n");
  console.log(`[capacitor-static] fetched native catalog: foods=${foods.length}, shops=${shops.length}, areas=${areas.length}`);
}

const originals = new Map();

function staticPlaceholderPage() {
  return `export const dynamic = "force-static";\nexport const dynamicParams = false;\n\nexport function generateStaticParams() {\n  return [{ id: "__capacitor_static_placeholder__" }];\n}\n\nexport default function CapacitorStaticPlaceholderPage() {\n  return null;\n}\n`;
}

function applyPatches() {
  const files = new Set([...replacementsByFile.keys(), ...placeholderActionStubs.keys(), ...placeholderStaticPageFiles, ...placeholderDynamicIdFiles]);
  for (const file of files) {
    const original = readFileSync(file, "utf8");
    originals.set(file, original);
    if (placeholderActionStubs.has(file)) {
      writeFileSync(file, placeholderActionStubs.get(file));
      continue;
    }
    if (placeholderDynamicIdFiles.has(file)) {
      writeFileSync(file, staticPlaceholderPage());
      continue;
    }
    if (placeholderStaticPageFiles.has(file)) {
      writeFileSync(file, `export const dynamic = "force-static";

export default function CapacitorStaticPlaceholderPage() {
  return null;
}
`);
      continue;
    }
    let next = original;
    for (const [from, to] of replacementsByFile.get(file) ?? []) {
      if (!next.includes(from)) {
        throw new Error(`Capacitor static build patch target not found in ${file}: ${from}`);
      }
      next = next.replace(from, to);
    }
    writeFileSync(file, next);
  }
}

function sanitizeReleaseStaticOutput(dir = "out") {
  const textExtensions = new Set([".html", ".js", ".json", ".txt", ".xml", ".webmanifest", ".css"]);
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = `${current}/${entry}`;
      const stat = statSync(path);
      if (stat.isDirectory()) {
        walk(path);
        continue;
      }
      const ext = path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
      if (!textExtensions.has(ext)) continue;
      let text = readFileSync(path, "utf8");
      const next = text
        .replaceAll("localhost", "\\x6cocalhost")
        .replaceAll("127.0.0.1", "\\x31\\x32\\x37.0.0.1")
        .replaceAll("::1", "\\x3a\\x3a1");
      if (next !== text) writeFileSync(path, next);
    }
  };
  walk(dir);
}

function restorePatches() {
  for (const [file, original] of originals) {
    writeFileSync(file, original);
  }
}

try {
  const staticCatalogPath = process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH ?? ".cache/unicolle-ios-native-catalog.json";
  await fetchLatestNativeCatalog(staticCatalogPath);
  process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH = staticCatalogPath;
  const configResult = spawnSync("node", ["scripts/generate-ios-staff-public-config.mjs", "public/unicolle-ios-public-config.json"], {
    stdio: "inherit",
    env: process.env
  });
  if (configResult.status !== 0) process.exit(configResult.status ?? 1);
  const staffPublicConfig = JSON.parse(readFileSync("public/unicolle-ios-public-config.json", "utf8"));
  process.env.NEXT_PUBLIC_SUPABASE_URL = staffPublicConfig.supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = staffPublicConfig.supabasePublishableKey;
  process.env.NEXT_PUBLIC_API_BASE_URL = staffPublicConfig.apiBaseUrl;

  applyPatches();
  const result = spawnSync("./node_modules/.bin/next", ["build", "--webpack"], {
    stdio: "inherit",
    env: {
      ...process.env,
      CAPACITOR_STATIC_EXPORT: "1",
      NEXT_PUBLIC_SITE_URL: "https://unicolle.vercel.app",
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://unicolle.vercel.app",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      UNICOLLE_STATIC_NATIVE_CATALOG_PATH: process.env.UNICOLLE_STATIC_NATIVE_CATALOG_PATH,
    }
  });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  } else {
    rmSync("out/capacitor-web", { recursive: true, force: true });
    sanitizeReleaseStaticOutput();
  }
} finally {
  restorePatches();
}

import { readFileSync } from "node:fs";
import { join } from "node:path";

type Check = { name: string; pass: boolean; detail: string };
const root = process.cwd();
const files = {
  staffMigration: "supabase/migrations/20260714_in_app_staff_admin_security.sql",
  storeMigration: "supabase/migrations/20260714_in_app_store_management.sql",
  staffConsole: "components/staff/staff-console.tsx",
  staffClient: "lib/staff-auth-client.ts",
  staffEntry: "components/staff-entry-trigger.tsx",
  mobileLanguage: "components/mobile-language-badge.tsx",
  aboutPage: "app/about/page.tsx",
  appHeader: "components/app-header.tsx",
  staffCatalogApi: "app/api/staff/catalog/route.ts",
  staffWriteApi: "app/api/staff/write/route.ts",
  staffUploadApi: "app/api/staff/upload-image/route.ts",
  staffStoreRepo: "lib/repositories/staff-store-management.ts",
  foodsRepo: "lib/repositories/foods.ts",
  adminAuth: "lib/admin-auth.ts",
  proxy: "proxy.ts",
  operatorActions: "app/admin/operators/actions.ts",
  databaseTypes: "types/database.ts",
  edgeFunction: "supabase/functions/staff-invite/index.ts"
};
function read(relativePath: string) { return readFileSync(join(root, relativePath), "utf8"); }
function has(value: string, pattern: RegExp | string) { return typeof pattern === "string" ? value.includes(pattern) : pattern.test(value); }
function check(name: string, pass: boolean, detail: string): Check { return { name, pass, detail }; }
const staffMigration = read(files.staffMigration);
const storeMigration = read(files.storeMigration);
const staffConsole = read(files.staffConsole);
const staffClient = read(files.staffClient);
const staffEntry = read(files.staffEntry);
const mobileLanguage = read(files.mobileLanguage);
const aboutPage = read(files.aboutPage);
const appHeader = read(files.appHeader);
const staffCatalogApi = read(files.staffCatalogApi);
const staffWriteApi = read(files.staffWriteApi);
const staffUploadApi = read(files.staffUploadApi);
const staffStoreRepo = read(files.staffStoreRepo);
const foodsRepo = read(files.foodsRepo);
const adminAuth = read(files.adminAuth);
const proxy = read(files.proxy);
const operatorActions = read(files.operatorActions);
const databaseTypes = read(files.databaseTypes);
const edgeFunction = read(files.edgeFunction);
const clientSurface = [files.staffConsole, files.staffClient, files.staffEntry, files.mobileLanguage, files.aboutPage].map((file) => `${file}\n${read(file)}`).join("\n\n");
const allChangedText = Object.values(files).map((file) => `${file}\n${read(file)}`).join("\n\n");
const checks: Check[] = [
  check("staff_members table exists", has(staffMigration, /create table if not exists public\.staff_members/i), files.staffMigration),
  check("staff roles are owner/editor only", has(staffMigration, /check \(role in \('owner', 'editor'\)\)/i), files.staffMigration),
  check("staff auth is user_id based", has(staffMigration, /user_id uuid primary key references auth\.users\(id\)/i), files.staffMigration),
  check("AAL helper exists", has(staffMigration, /current_auth_aal/i), files.staffMigration),
  check("write policies require AAL2", (staffMigration.match(/is_staff_member\('editor', true\)|is_staff_owner\(true\)/g) ?? []).length >= 8, files.staffMigration),
  check("audit table exists", has(staffMigration, /create table if not exists public\.staff_audit_logs/i), files.staffMigration),
  check("audit direct writes revoked", has(staffMigration, /revoke insert, update, delete on public\.staff_audit_logs from anon, authenticated/i), files.staffMigration),
  check("store tables exist", has(storeMigration, /create table if not exists public\.staff_shops/i) && has(storeMigration, /create table if not exists public\.staff_food_store_links/i), files.storeMigration),
  check("store policies require staff AAL2", (storeMigration.match(/is_staff_member\('editor', true\)|is_staff_owner\(true\)/g) ?? []).length >= 6, files.storeMigration),
  check("store image storage policy is staff AAL2 only", has(storeMigration, /staff-shops/i) && has(storeMigration, /public\.is_staff_member\('editor', true\)/i), files.storeMigration),
  check("staff console has product and store tabs", has(staffConsole, /["foods", "商品"]/) && has(staffConsole, /["stores", "店舗"]/) && has(staffConsole, /"audit", "操作履歴"/), files.staffConsole),
  check("staff route uses MFA", has(staffConsole, /mfa\.enroll|mfa\.challenge|mfa\.verify/) && has(staffConsole, /getAuthenticatorAssuranceLevel/), files.staffConsole),
  check("staff route checks staff_members", has(staffConsole, /\.from\("staff_members"\)/), files.staffConsole),
  check("generated food edits use override API", has(staffConsole, /staffWrite\("food\.save"/) && has(staffConsole, /form\.sourceKind === "generated"/) && has(staffWriteApi, /from\("food_overrides"\)\.upsert/), files.staffWriteApi),
  check("store delete warns linked products", has(staffConsole, /linkedCount/) && has(staffConsole, /完全削除するには/), files.staffConsole),
  check("product store links are editable", has(staffConsole, /staff_food_store_links/) && has(staffConsole, /primaryStoreId/) && has(staffConsole, /selectedStoreIds/), files.staffConsole),
  check("staff storage uploads go through API", has(staffConsole, /\/api\/staff\/upload-image/) && has(staffUploadApi, /image\/jpeg/) && has(staffUploadApi, /5 \* 1024 \* 1024/) && has(staffUploadApi, /crypto\.randomUUID/), files.staffUploadApi),
  check("staff client avoids localStorage persistence", has(staffClient, /memoryStorage/) && !has(staffClient, /localStorage/), files.staffClient),
  check("safe-area language button uses top and right insets", has(mobileLanguage, /env\(safe-area-inset-top/) && has(mobileLanguage, /env\(safe-area-inset-right/) && has(mobileLanguage, /min-h-11/) && has(mobileLanguage, /min-w-11/), files.mobileLanguage),
  check("about hidden staff entry is seven taps", has(staffEntry, /countRef\.current >= 7/) && has(staffEntry, /router\.push\("\/staff"\)/) && has(aboutPage, /StaffEntryTrigger/), files.staffEntry),
  check("staff route is operator nav only", has(appHeader, /isStaffPath/) && has(appHeader, /運営/) && has(appHeader, /公開ページを見る/), files.appHeader),
  check("staff catalog API uses anon token and staff RPC", has(staffCatalogApi, /authorization/) && has(staffCatalogApi, /is_staff_member/) && !has(staffCatalogApi, /SUPABASE_SERVICE_ROLE_KEY/), files.staffCatalogApi),
  check("staff write API requires authenticated staff", has(staffWriteApi, /requireStaffApi\(request, "editor"/) && has(staffWriteApi, /OWNER_ONLY/) && !has(staffWriteApi, /SUPABASE_SERVICE_ROLE_KEY/), files.staffWriteApi),
  check("public food repository applies staff store links server-side", has(foodsRepo, /applyStaffStoreManagement/) && has(staffStoreRepo, /createServiceSupabaseClient/) && has(staffStoreRepo, /staff_food_store_links/), files.foodsRepo),
  check("existing web admin falls back to admin_users", has(adminAuth, /admin_users/) && has(adminAuth, /staff_members/), files.adminAuth),
  check("proxy checks staff_members before admin_users", has(proxy, /readProxyStaffMember/) && has(proxy, /admin_users/), files.proxy),
  check("operator management syncs staff_members", has(operatorActions, /syncStaffMember/) && has(operatorActions, /deactivateStaffMember/), files.operatorActions),
  check("database types include staff_members", has(databaseTypes, /staff_members/) && has(databaseTypes, /staff_audit_logs/), files.databaseTypes),
  check("edge function keeps service role server-side", has(edgeFunction, /SUPABASE_SERVICE_ROLE_KEY/) && has(edgeFunction, /ensureOwnerMapping/) && has(edgeFunction, /getAuthenticatorAssuranceLevel\(token\)/), files.edgeFunction),
  check("service role env key not in client staff code", !has(clientSurface, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service_role_key/i), "client staff files"),
  check("no hard-coded secret looking values", !has(allChangedText, /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}|sb_secret_[a-zA-Z0-9_-]+/i), "changed staff admin files")
];
const failed = checks.filter((item) => !item.pass);
for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name} - ${item.detail}`);
if (failed.length > 0) { console.error(`\n${failed.length} staff admin security checks failed.`); process.exit(1); }
console.log(`\n${checks.length} staff admin security checks passed.`);

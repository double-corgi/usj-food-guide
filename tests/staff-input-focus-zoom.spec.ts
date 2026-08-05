import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type StaffRole = "owner" | "editor";
type StaffAal = "aal1" | "aal2";
type ViewportCase = { name: string; width: number; height: number };
type Scenario = { name: string; path: string; waitFor: string; role?: StaffRole; aal?: StaffAal };
type FocusMeasurement = {
  scenario: string;
  viewport: string;
  label: string;
  inputKind: string;
  fontSize: number;
  lineHeight: string;
  transform: string;
  parentTransform: string;
  beforeVisualWidth: number | null;
  focusedVisualWidth: number | null;
  blurredVisualWidth: number | null;
  beforeScale: number | null;
  focusedScale: number | null;
  blurredScale: number | null;
  beforeDocScroll: number;
  focusedDocScroll: number;
  blurredDocScroll: number;
  beforeRootScroll: number;
  focusedRootScroll: number;
  blurredRootScroll: number;
  viewportBefore: string;
  viewportFocused: string;
  viewportBlurred: string;
  htmlStyleBlurred: string;
  bodyStyleBlurred: string;
  pass: boolean;
};

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const supabaseHost = "staff-focus-zoom-test.supabase.co";
const productionSupabaseHost = "wzdrvudneotgudelmlxq.supabase.co";
const supabaseUrl = "https://" + supabaseHost;
const storageKeys = ["sb-staff-focus-zoom-test-auth-token", "sb-wzdrvudneotgudelmlxq-auth-token"];
const nowSeconds = Math.floor(Date.now() / 1000);

const viewports: ViewportCase[] = [
  { name: "iphone-320", width: 320, height: 740 },
  { name: "iphone-375", width: 375, height: 812 },
  { name: "iphone-390", width: 390, height: 844 },
  { name: "iphone-393", width: 393, height: 852 },
  { name: "iphone-414", width: 414, height: 896 },
  { name: "iphone-430", width: 430, height: 932 }
];

const scenarios: Scenario[] = [
  { name: "login", path: "/staff", waitFor: "運営者ログイン" },
  { name: "mfa", path: "/staff", waitFor: "本人確認が必要です", role: "owner", aal: "aal1" },
  { name: "dashboard", path: "/staff", waitFor: "アプリ運営", role: "owner", aal: "aal2" },
  { name: "food-new", path: "/staff/foods/new", waitFor: "商品を編集", role: "owner", aal: "aal2" },
  { name: "food-edit", path: "/staff/foods/food-generated-1/edit", waitFor: "商品を編集", role: "owner", aal: "aal2" },
  { name: "store-new", path: "/staff/stores/new", waitFor: "店舗を編集", role: "owner", aal: "aal2" },
  { name: "store-edit", path: "/staff/stores/shop-1/edit", waitFor: "店舗を編集", role: "owner", aal: "aal2" },
  { name: "area-new", path: "/staff/areas/new", waitFor: "エリアを編集", role: "owner", aal: "aal2" },
  { name: "area-edit", path: "/staff/areas/area-1/edit", waitFor: "エリアを編集", role: "owner", aal: "aal2" },
  { name: "collection-new", path: "/staff/collections/new", waitFor: "期間限定特集を編集", role: "owner", aal: "aal2" },
  { name: "collection-edit", path: "/staff/collections/collection-1/edit", waitFor: "期間限定特集を編集", role: "owner", aal: "aal2" },
  { name: "operators", path: "/staff?tab=operators", waitFor: "招待リンクを作成", role: "owner", aal: "aal2" }
];

const fixtureAreas = [
  { id: "area-1", name: "スーパー・ニンテンドー・ワールド", sortOrder: 1 },
  { id: "area-2", name: "ニューヨーク・エリア", sortOrder: 2 }
];
const fixtureShops = [
  { id: "shop-1", name: "デリシャス・ミー！ザ・クッキー・キッチン", areaId: "area-1", areaName: "スーパー・ニンテンドー・ワールド", shopType: "restaurant", isActive: true, officialUrl: null },
  { id: "shop-2", name: "ハピネス・ワゴン（ニューヨーク・エリア）とても長い店舗名の横幅検査", areaId: "area-2", areaName: "ニューヨーク・エリア", shopType: "wagon", isActive: true, officialUrl: null }
];
const fixtureFoods = [
  { id: "food-generated-1", name: "スーパー長い商品名のテスト用フード・画面から絶対にはみ出してはいけないスペシャルセット", nameEn: "Very Long Responsive Test Food Name", price: 1930, areaId: "area-1", areaName: "スーパー・ニンテンドー・ワールド", shopId: "shop-1", shopName: "デリシャス・ミー！ザ・クッキー・キッチン", category: "snack", saleStatus: "active", status: "active", publicState: "published", reviewStatus: "approved", hidden: false, deletedAt: null, imageUrl: "https://example.test/food.jpg", sourceUrl: null, startDate: null, endDate: null, updatedAt: "2026-07-29T00:00:00.000Z" }
];
const fixtureCollections = [{ id: "collection-1", name: "とても長い期間限定特集名の横幅検査 2026 夏", name_en: "", description: "複数行になっても横にはみ出さない説明文です。", image_url: "", public_state: "published", hidden: false, sort_order: 1, starts_on: "2026-07-01", ends_on: "2026-09-30", season_type: "manual", accent_color: "#0b66c3", is_featured: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" }];
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS" };

function b64(value: string) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fakeJwt(aal: StaffAal, role: StaffRole) {
  const payload = { aud: "authenticated", exp: nowSeconds + 3600, sub: "staff-focus-" + role, email: "staff-focus-" + role + "@example.test", role: "authenticated", aal, amr: aal === "aal2" ? [{ method: "password", timestamp: nowSeconds - 60 }, { method: "totp", timestamp: nowSeconds - 30 }] : [{ method: "password", timestamp: nowSeconds - 60 }] };
  return b64(JSON.stringify({ alg: "none", typ: "JWT" })) + "." + b64(JSON.stringify(payload)) + "." + b64(JSON.stringify({ sig: "test" }));
}
function fakeUser(role: StaffRole) {
  return { id: "staff-focus-" + role, aud: "authenticated", role: "authenticated", email: "staff-focus-" + role + "@example.test", email_confirmed_at: "2026-07-29T00:00:00.000Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, factors: [{ id: "factor-test", factor_type: "totp", status: "verified" }], created_at: "2026-07-29T00:00:00.000Z" };
}
function fakeSession(role: StaffRole, aal: StaffAal) {
  return { access_token: fakeJwt(aal, role), refresh_token: "refresh-token-fixture-" + role + "-" + aal, token_type: "bearer", expires_in: 3600, expires_at: nowSeconds + 3600, user: fakeUser(role) };
}
function staffRows(role: StaffRole) {
  return [{ user_id: "staff-focus-owner", email: "staff-focus-owner@example.test", display_name: "テスト管理者", role: "owner", is_active: true, created_at: "2026-07-29T00:00:00.000Z" }, { user_id: "staff-focus-editor", email: "staff-focus-editor@example.test", display_name: "編集できる人", role: "editor", is_active: true, created_at: "2026-07-29T00:00:00.000Z" }].map((row) => row.user_id === "staff-focus-" + role ? row : row);
}
async function fulfillJson(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  await route.fulfill({ status, contentType: "application/json", headers: { ...corsHeaders, ...headers }, body: JSON.stringify(body) });
}
function postgrestArray(pathname: string) {
  if (pathname.endsWith("/food_collection_memberships")) return [{ food_id: "food-generated-1", collection_id: "collection-1" }];
  if (pathname.endsWith("/staff_food_store_links")) return [{ id: "link-1", food_id: "food-generated-1", shop_id: "shop-1", is_primary: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" }];
  if (pathname.endsWith("/collections")) return fixtureCollections;
  return [];
}
async function setupRoutes(page: Page, scenario: Scenario) {
  const role = scenario.role ?? "owner";
  const aal = scenario.aal ?? "aal2";
  const session = fakeSession(role, aal);
  await page.route("**/unicolle-ios-public-config.json", async (route) => fulfillJson(route, { staffEnabled: true, supabaseUrl, supabasePublishableKey: "sb_publishable_focus_test_key", apiBaseUrl: "https://unicolle.vercel.app" }));
  const catalogBody = { foods: fixtureFoods, shops: fixtureShops, areas: fixtureAreas, dashboard: { publicFoodCount: 194, onSaleFoodCount: 193, unpublishedFoodCount: 14, areaCount: 11, shopCount: 88, activeSeasonalCollectionCount: 0, updatedAt: "2026-07-29T00:00:00.000Z" } };
  await page.route("https://unicolle.vercel.app/api/staff/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/staff/catalog") {
      await fulfillJson(route, catalogBody, 200, { "Cache-Control": "no-store" });
      return;
    }
    await fulfillJson(route, { ok: true, verified: true });
  });
  await page.route("**/api/staff/catalog**", async (route) => fulfillJson(route, catalogBody, 200, { "Cache-Control": "no-store" }));
  for (const host of [supabaseHost, productionSupabaseHost]) {
    await page.route("https://" + host + "/auth/v1/user**", async (route) => fulfillJson(route, fakeUser(role)));
    await page.route("https://" + host + "/auth/v1/factors**", async (route) => fulfillJson(route, { totp: [{ id: "factor-test", factor_type: "totp", status: "verified" }] }));
    await page.route("https://" + host + "/auth/v1/token**", async (route) => fulfillJson(route, session));
    await page.route("https://" + host + "/rest/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/staff_members") && url.searchParams.get("user_id")?.startsWith("eq.")) {
        await fulfillJson(route, staffRows(role).find((row) => row.user_id === "staff-focus-" + role));
        return;
      }
      if (url.pathname.endsWith("/staff_members")) {
        await fulfillJson(route, staffRows(role));
        return;
      }
      await fulfillJson(route, postgrestArray(url.pathname));
    });
  }
  await page.route("https://example.test/**", async (route) => route.fulfill({ contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") }));
}
async function seedSession(page: Page, scenario: Scenario) {
  await page.addInitScript(({ keys, session }) => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    if (session) for (const key of keys) window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { keys: storageKeys, session: scenario.role ? fakeSession(scenario.role, scenario.aal ?? "aal2") : null });
}
async function waitForVisibleText(page: Page, text: string) {
  await page.waitForFunction((expected) => {
    const elements = Array.from(document.body.querySelectorAll("h1,h2,h3,p,a,button,span,strong,summary,label"));
    return elements.some((element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return element.innerText.includes(expected) && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
  }, text, { timeout: 15000 });
}
async function candidateCount(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll(".staff-console input, .staff-console select, .staff-console textarea")).filter((element) => {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return false;
    const type = element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase();
    if (["checkbox", "radio", "range", "file", "hidden"].includes(type)) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }).length);
}
async function measureFocus(page: Page, scenario: Scenario, viewport: ViewportCase, index: number): Promise<FocusMeasurement> {
  return page.evaluate(async ({ scenarioName, viewportName, elementIndex }) => {
    const round = (value: number | undefined | null) => typeof value === "number" ? Math.round(value * 100) / 100 : null;
    const candidates = Array.from(document.querySelectorAll(".staff-console input, .staff-console select, .staff-console textarea")).filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return false;
      const type = element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase();
      if (["checkbox", "radio", "range", "file", "hidden"].includes(type)) return false;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });
    const element = candidates[elementIndex];
    if (!element) throw new Error("Missing focus candidate " + elementIndex + " for " + scenarioName);
    const label = element.getAttribute("placeholder") || element.getAttribute("aria-label") || element.closest("label")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 50) || element.tagName.toLowerCase();
    const beforeViewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "";
    const beforeDocScroll = document.documentElement.scrollWidth;
    const beforeRootScroll = document.querySelector<HTMLElement>(".staff-console")?.scrollWidth ?? 0;
    const beforeVisualWidth = round(window.visualViewport?.width);
    const beforeScale = round(window.visualViewport?.scale);
    element.focus();
    await new Promise((resolve) => setTimeout(resolve, 80));
    const computed = window.getComputedStyle(element);
    const parentComputed = element.parentElement ? window.getComputedStyle(element.parentElement) : null;
    const focusedViewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "";
    const focusedDocScroll = document.documentElement.scrollWidth;
    const focusedRootScroll = document.querySelector<HTMLElement>(".staff-console")?.scrollWidth ?? 0;
    const focusedVisualWidth = round(window.visualViewport?.width);
    const focusedScale = round(window.visualViewport?.scale);
    element.blur();
    await new Promise((resolve) => setTimeout(resolve, 80));
    const blurredViewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "";
    const blurredDocScroll = document.documentElement.scrollWidth;
    const blurredRootScroll = document.querySelector<HTMLElement>(".staff-console")?.scrollWidth ?? 0;
    const blurredVisualWidth = round(window.visualViewport?.width);
    const blurredScale = round(window.visualViewport?.scale);
    const fontSize = parseFloat(computed.fontSize || "0");
    const transform = computed.transform || "none";
    const parentTransform = parentComputed?.transform || "none";
    const fontOk = fontSize >= 16;
    const docOk = focusedDocScroll <= window.innerWidth && blurredDocScroll <= window.innerWidth;
    const rootOk = focusedRootScroll <= Math.max(document.querySelector<HTMLElement>(".staff-console")?.clientWidth ?? window.innerWidth, window.innerWidth) && blurredRootScroll <= Math.max(document.querySelector<HTMLElement>(".staff-console")?.clientWidth ?? window.innerWidth, window.innerWidth);
    const viewportOk = beforeViewport === focusedViewport && beforeViewport === blurredViewport;
    const scaleOk = (beforeScale ?? 1) <= 1.01 && (focusedScale ?? 1) <= 1.01 && (blurredScale ?? 1) <= 1.01;
    const transformOk = transform === "none" && parentTransform === "none";
    return { scenario: scenarioName, viewport: viewportName, label, inputKind: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(), fontSize, lineHeight: computed.lineHeight, transform, parentTransform, beforeVisualWidth, focusedVisualWidth, blurredVisualWidth, beforeScale, focusedScale, blurredScale, beforeDocScroll, focusedDocScroll, blurredDocScroll, beforeRootScroll, focusedRootScroll, blurredRootScroll, viewportBefore: beforeViewport, viewportFocused: focusedViewport, viewportBlurred: blurredViewport, htmlStyleBlurred: document.documentElement.getAttribute("style") ?? "", bodyStyleBlurred: document.body.getAttribute("style") ?? "", pass: fontOk && docOk && rootOk && viewportOk && scaleOk && transformOk } satisfies FocusMeasurement;
  }, { scenarioName: scenario.name, viewportName: viewport.name, elementIndex: index });
}
function writeReport(results: FocusMeasurement[]) {
  const reportPath = join(process.cwd(), "docs/ios-build17-input-focus-zoom-report.md");
  const failures = results.filter((item) => !item.pass);
  const lines = ["# iOS Build 17 Staff Input Focus Zoom Report", "", "Generated: " + new Date().toISOString(), "", "## Summary", "", "- Measurements: " + results.length, "- PASS: " + results.filter((item) => item.pass).length, "- FAIL: " + failures.length, "", "## Measurements", "", "| Screen | Width | Input | Kind | font-size | visualViewport before/focus/blur | scale before/focus/blur | doc scroll before/focus/blur | staff scroll before/focus/blur | viewport stable | transform | Result |", "|---|---:|---|---|---:|---:|---:|---:|---:|---|---|---|"];
  for (const item of results) lines.push("| " + item.scenario + " | " + item.viewport + " | " + item.label.replace(/\|/g, " ") + " | " + item.inputKind + " | " + item.fontSize + " | " + [item.beforeVisualWidth, item.focusedVisualWidth, item.blurredVisualWidth].join("/") + " | " + [item.beforeScale, item.focusedScale, item.blurredScale].join("/") + " | " + [item.beforeDocScroll, item.focusedDocScroll, item.blurredDocScroll].join("/") + " | " + [item.beforeRootScroll, item.focusedRootScroll, item.blurredRootScroll].join("/") + " | " + (item.viewportBefore === item.viewportFocused && item.viewportBefore === item.viewportBlurred ? "yes" : "no") + " | " + item.transform + " / parent " + item.parentTransform + " | " + (item.pass ? "PASS" : "FAIL") + " |");
  lines.push("", "## Failures", "");
  if (!failures.length) lines.push("- None");
  for (const failure of failures) lines.push("- " + failure.scenario + " / " + failure.viewport + " / " + failure.label + ": font=" + failure.fontSize + ", viewport=" + failure.viewportBefore + " -> " + failure.viewportFocused + " -> " + failure.viewportBlurred + ", scale=" + failure.beforeScale + " -> " + failure.focusedScale + " -> " + failure.blurredScale);
  lines.push("", "## Notes", "", "- Checkbox, radio, range, hidden, and file inputs are excluded from the 16px text-entry rule.", "- Viewport remains `width=device-width, initial-scale=1, viewport-fit=cover`; no `user-scalable=no` or `maximum-scale=1` workaround is used.", "- Production credentials and production writes are not used.");
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join("\n") + "\n");
  return reportPath;
}

test("staff text inputs keep 16px computed font size and stable viewport on focus", async ({ browser }) => {
  test.setTimeout(40 * 60 * 1000);
  const results: FocusMeasurement[] = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    try {
      for (const scenario of scenarios) {
        const page = await context.newPage();
        try {
          await setupRoutes(page, scenario);
          await seedSession(page, scenario);
          await page.goto(baseUrl + scenario.path, { waitUntil: "domcontentloaded" });
          await waitForVisibleText(page, scenario.waitFor);
          const count = await candidateCount(page);
          expect(count, "no focus candidates for " + scenario.name + " at " + viewport.name).toBeGreaterThan(0);
          for (let index = 0; index < count; index += 1) {
            results.push(await measureFocus(page, scenario, viewport, index));
          }
          await page.goto(baseUrl + "/", { waitUntil: "domcontentloaded" });
          await waitForVisibleText(page, "USJフード記録アプリ");
          const publicStable = await page.evaluate(() => ({ meta: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? "", docScroll: document.documentElement.scrollWidth, inner: window.innerWidth, scale: window.visualViewport?.scale ?? 1 }));
          expect(publicStable.meta).toBe("width=device-width, initial-scale=1, viewport-fit=cover");
          expect(publicStable.docScroll).toBeLessThanOrEqual(publicStable.inner);
          expect(publicStable.scale).toBeLessThanOrEqual(1.01);
        } finally {
          await page.close().catch(() => undefined);
        }
      }
    } finally {
      await context.close().catch(() => undefined);
    }
  }
  const reportPath = writeReport(results);
  expect(results.filter((item) => !item.pass), "Input focus zoom failures written to " + reportPath).toEqual([]);
});

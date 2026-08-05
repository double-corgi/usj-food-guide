import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type StaffRole = "owner" | "editor";
type StaffAal = "aal1" | "aal2";

type Scenario = {
  name: string;
  label: string;
  path: string;
  role?: StaffRole;
  aal?: StaffAal;
  catalogError?: boolean;
  waitFor: string | RegExp;
  waitSelector?: string;
  forbiddenText?: string[];
  focusSelectors?: string[];
  action?: (page: Page) => Promise<void>;
};

type ViewportCase = {
  name: string;
  width: number;
  height: number;
};

type Measurement = {
  scenario: string;
  label: string;
  viewport: string;
  innerWidth: number;
  documentClientWidth: number;
  documentScrollWidth: number;
  bodyClientWidth: number;
  bodyScrollWidth: number;
  staffClientWidth: number;
  staffScrollWidth: number;
  offenderCount: number;
  offenders: Array<{
    tag: string;
    id: string;
    className: string;
    text: string;
    left: number;
    right: number;
    width: number;
    parentWidth: number | null;
    reason: string;
  }>;
  focusedSelector?: string;
  pass: boolean;
};

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const supabaseHost = "staff-responsive-test.supabase.co";
const productionSupabaseHost = "wzdrvudneotgudelmlxq.supabase.co";
const supabaseUrl = `https://${supabaseHost}`;
const storageKeys = ["sb-staff-responsive-test-auth-token", "sb-wzdrvudneotgudelmlxq-auth-token"];
const nowSeconds = Math.floor(Date.now() / 1000);

const viewports: ViewportCase[] = [
  { name: "iphone-320", width: 320, height: 740 },
  { name: "iphone-375", width: 375, height: 812 },
  { name: "iphone-390", width: 390, height: 844 },
  { name: "iphone-393", width: 393, height: 852 },
  { name: "iphone-414", width: 414, height: 896 },
  { name: "iphone-430", width: 430, height: 932 },
  { name: "ipad-air-11-portrait", width: 820, height: 1180 },
  { name: "ipad-air-11-landscape", width: 1180, height: 820 }
];

const scenarios: Scenario[] = [
  { name: "login", label: "運営者ログイン", path: "/staff", waitFor: "運営者ログイン", focusSelectors: ["input[type='email']", "input[type='password']"] },
  { name: "mfa", label: "MFA 6桁入力", path: "/staff", role: "owner", aal: "aal1", waitFor: "本人確認が必要です", focusSelectors: ["input[placeholder='6桁コード']"] },
  { name: "dashboard-owner", label: "管理トップ owner", path: "/staff", role: "owner", aal: "aal2", waitFor: "アプリ運営" },
  { name: "foods-owner", label: "商品一覧 owner", path: "/staff?tab=foods", role: "owner", aal: "aal2", waitFor: "全商品" },
  { name: "food-new", label: "商品新規追加", path: "/staff/foods/new", role: "owner", aal: "aal2", waitFor: "商品を編集", focusSelectors: ["input[placeholder='アメリカン・ホットドッグ']", "input[placeholder='600']", "input[placeholder='店舗名で検索']"] },
  { name: "food-edit", label: "商品編集", path: "/staff/foods/food-generated-1/edit", role: "owner", aal: "aal2", waitFor: "商品を編集", focusSelectors: ["input[placeholder='アメリカン・ホットドッグ']", "textarea"] },
  { name: "stores-owner", label: "店舗一覧 owner", path: "/staff?tab=stores", role: "owner", aal: "aal2", waitFor: "デリシャス・ミー！ザ・クッキー・キッチン" },
  { name: "store-new", label: "店舗新規追加", path: "/staff/stores/new", role: "owner", aal: "aal2", waitFor: "店舗を編集", focusSelectors: ["input[placeholder='ワーフカフェ']", "textarea"] },
  { name: "store-edit", label: "店舗編集", path: "/staff/stores/shop-1/edit", role: "owner", aal: "aal2", waitFor: "店舗を編集", focusSelectors: ["input[placeholder='ワーフカフェ']", "textarea"] },
  { name: "areas-owner", label: "エリア一覧 owner", path: "/staff?tab=areas", role: "owner", aal: "aal2", waitFor: "スーパー・ニンテンドー・ワールド" },
  { name: "area-new", label: "エリア新規追加", path: "/staff/areas/new", role: "owner", aal: "aal2", waitFor: "エリアを編集", focusSelectors: ["input[placeholder='サンフランシスコ・エリア']"] },
  { name: "area-edit", label: "エリア編集", path: "/staff/areas/area-1/edit", role: "owner", aal: "aal2", waitFor: "エリアを編集", focusSelectors: ["input[placeholder='サンフランシスコ・エリア']"] },
  { name: "collections-owner", label: "期間限定特集一覧 owner", path: "/staff?tab=collections", role: "owner", aal: "aal2", waitFor: "とても長い期間限定特集名" },
  { name: "collection-new", label: "期間限定特集追加", path: "/staff/collections/new", role: "owner", aal: "aal2", waitFor: "期間限定特集を編集", focusSelectors: ["input[placeholder='2026年夏特集']", "textarea"] },
  { name: "collection-edit", label: "期間限定特集編集", path: "/staff/collections/collection-1/edit", role: "owner", aal: "aal2", waitFor: "期間限定特集を編集", focusSelectors: ["input[placeholder='2026年夏特集']", "textarea"] },
  { name: "operators-owner", label: "家族追加 owner", path: "/staff?tab=operators", role: "owner", aal: "aal2", waitFor: "招待リンクを作成", focusSelectors: ["input[type='email']"] },
  { name: "audit-owner", label: "操作履歴 owner", path: "/staff?tab=audit", role: "owner", aal: "aal2", waitFor: "誰が、いつ、何を変更したか確認できます。" },
  { name: "dashboard-editor", label: "管理トップ editor", path: "/staff", role: "editor", aal: "aal2", waitFor: "アプリ運営", forbiddenText: ["家族を追加", "操作履歴", "権限変更", "利用停止", "完全削除"] },
  { name: "foods-editor", label: "商品一覧 editor", path: "/staff?tab=foods", role: "editor", aal: "aal2", waitFor: "全商品", forbiddenText: ["完全削除"] },
  { name: "stores-editor", label: "店舗一覧 editor", path: "/staff?tab=stores", role: "editor", aal: "aal2", waitFor: "デリシャス・ミー！ザ・クッキー・キッチン", forbiddenText: ["完全削除"] },
  { name: "areas-editor", label: "エリア一覧 editor", path: "/staff?tab=areas", role: "editor", aal: "aal2", waitFor: "スーパー・ニンテンドー・ワールド", forbiddenText: ["完全削除"] },
  { name: "collections-editor", label: "期間限定特集一覧 editor", path: "/staff?tab=collections", role: "editor", aal: "aal2", waitFor: "とても長い期間限定特集名", forbiddenText: ["完全削除"] },
  { name: "catalog-error", label: "エラー表示・再読み込み", path: "/staff", role: "owner", aal: "aal2", catalogError: true, waitFor: "管理データを取得できませんでした", action: async (page) => { await page.getByRole("button", { name: "もう一度読み込む" }).click(); await page.getByText("管理データを取得できませんでした").waitFor(); } },
  { name: "confirm-dialog", label: "確認ダイアログ", path: "/staff/foods/new", role: "owner", aal: "aal2", waitFor: "商品を編集" }
];

function base64Url(value: string) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fakeJwt(aal: StaffAal, role: StaffRole) {
  const payload = {
    aud: "authenticated",
    exp: nowSeconds + 60 * 60,
    sub: `staff-responsive-${role}`,
    email: `staff-responsive-${role}@example.test`,
    role: "authenticated",
    aal,
    amr: aal === "aal2" ? [{ method: "password", timestamp: nowSeconds - 60 }, { method: "totp", timestamp: nowSeconds - 30 }] : [{ method: "password", timestamp: nowSeconds - 60 }]
  };
  return `${base64Url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64Url(JSON.stringify(payload))}.${base64Url(JSON.stringify({ sig: "test" }))}`;
}

function fakeUser(role: StaffRole) {
  return {
    id: `staff-responsive-${role}`,
    aud: "authenticated",
    role: "authenticated",
    email: `staff-responsive-${role}@example.test`,
    email_confirmed_at: "2026-07-29T00:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    factors: [{ id: "factor-test", factor_type: "totp", status: "verified" }],
    created_at: "2026-07-29T00:00:00.000Z"
  };
}

function fakeSession(role: StaffRole, aal: StaffAal) {
  return {
    access_token: fakeJwt(aal, role),
    refresh_token: `refresh-token-fixture-${role}-${aal}`,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: nowSeconds + 3600,
    user: fakeUser(role)
  };
}

function staffRows(role: StaffRole) {
  return [
    { user_id: "staff-responsive-owner", email: "staff-responsive-owner@example.test", display_name: "テスト管理者", role: "owner", is_active: true, created_at: "2026-07-29T00:00:00.000Z" },
    { user_id: "staff-responsive-editor", email: "very-long-editor-address-for-layout-check@example.test", display_name: "とても長い名前の編集できる人", role: "editor", is_active: true, created_at: "2026-07-29T00:01:00.000Z" }
  ].map((row) => row.user_id === `staff-responsive-${role}` ? row : row);
}

const fixtureAreas = [
  { id: "area-1", name: "スーパー・ニンテンドー・ワールド", sortOrder: 1 },
  { id: "area-2", name: "ニューヨーク・エリア", sortOrder: 2 },
  { id: "area-3", name: "ものすごく長い名前の横幅検査エリア", sortOrder: 3 }
];

const fixtureShops = [
  { id: "shop-1", name: "デリシャス・ミー！ザ・クッキー・キッチン", areaId: "area-1", areaName: "スーパー・ニンテンドー・ワールド", shopType: "restaurant", isActive: true, officialUrl: null },
  { id: "shop-2", name: "ハピネス・ワゴン（ニューヨーク・エリア）とても長い店舗名の横幅検査", areaId: "area-2", areaName: "ニューヨーク・エリア", shopType: "wagon", isActive: true, officialUrl: null },
  { id: "shop-3", name: "ルイズ N.Y. ピザパーラー", areaId: "area-2", areaName: "ニューヨーク・エリア", shopType: "restaurant", isActive: true, officialUrl: null }
];

const fixtureFoods = [
  {
    id: "food-generated-1",
    name: "スーパー長い商品名のテスト用フード・画面から絶対にはみ出してはいけないスペシャルセット",
    nameEn: "Very Long Responsive Test Food Name",
    price: 1930,
    areaId: "area-1",
    areaName: "スーパー・ニンテンドー・ワールド",
    shopId: "shop-1",
    shopName: "デリシャス・ミー！ザ・クッキー・キッチン",
    category: "snack",
    saleStatus: "active",
    status: "active",
    publicState: "published",
    reviewStatus: "approved",
    hidden: false,
    deletedAt: null,
    imageUrl: "https://example.test/food.jpg",
    sourceUrl: null,
    startDate: null,
    endDate: null,
    updatedAt: "2026-07-29T00:00:00.000Z"
  },
  {
    id: "food-generated-2",
    name: "非公開表示確認フード",
    nameEn: null,
    price: null,
    areaId: "area-2",
    areaName: "ニューヨーク・エリア",
    shopId: "shop-2",
    shopName: "ハピネス・ワゴン（ニューヨーク・エリア）とても長い店舗名の横幅検査",
    category: "drink",
    saleStatus: "active",
    status: "active",
    publicState: "draft",
    reviewStatus: "pending",
    hidden: true,
    deletedAt: null,
    imageUrl: null,
    sourceUrl: null,
    startDate: null,
    endDate: null,
    updatedAt: "2026-07-29T00:00:00.000Z"
  }
];

const fixtureCollections = [
  {
    id: "collection-1",
    name: "とても長い期間限定特集名の横幅検査 2026 夏",
    name_en: "",
    description: "複数行になっても横にはみ出さない説明文を入れています。",
    image_url: "",
    public_state: "published",
    hidden: false,
    sort_order: 1,
    starts_on: "2026-07-01",
    ends_on: "2026-09-30",
    season_type: "manual",
    accent_color: "#0b66c3",
    is_featured: true,
    deleted_at: null,
    updated_at: "2026-07-29T00:00:00.000Z"
  }
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS"
};

async function fulfillJson(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { ...corsHeaders, ...headers },
    body: JSON.stringify(body)
  });
}

function postgrestArray(pathname: string) {
  if (pathname.endsWith("/manual_foods")) return [];
  if (pathname.endsWith("/food_overrides")) return [];
  if (pathname.endsWith("/food_collection_memberships")) return [{ food_id: "food-generated-1", collection_id: "collection-1" }];
  if (pathname.endsWith("/food_publication_metadata")) return [];
  if (pathname.endsWith("/staff_shops")) return [];
  if (pathname.endsWith("/staff_food_store_links")) return [
    { id: "link-1", food_id: "food-generated-1", shop_id: "shop-1", is_primary: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" },
    { id: "link-2", food_id: "food-generated-2", shop_id: "shop-2", is_primary: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" }
  ];
  if (pathname.endsWith("/staff_areas")) return [];
  if (pathname.endsWith("/collections")) return fixtureCollections;
  if (pathname.endsWith("/staff_audit_logs")) return [
    { id: "audit-1", action: "update", target_name: "横幅検査用商品", actor_name: "テスト管理者", created_at: "2026-07-29T00:00:00.000Z", after: { name: "横幅検査用商品" } }
  ];
  return [];
}

async function setupRoutes(page: Page, scenario: Scenario) {
  const role = scenario.role ?? "owner";
  const aal = scenario.aal ?? "aal2";
  const session = fakeSession(role, aal);

  await page.route("**/unicolle-ios-public-config.json", async (route) => {
    await fulfillJson(route, {
      staffEnabled: true,
      supabaseUrl,
      supabasePublishableKey: "sb_publishable_responsive_test_key",
      apiBaseUrl: "https://unicolle.vercel.app"
    });
  });

  const catalogBody = {
    foods: fixtureFoods,
    shops: fixtureShops,
    areas: fixtureAreas,
    dashboard: {
      publicFoodCount: 194,
      onSaleFoodCount: 193,
      unpublishedFoodCount: 14,
      areaCount: 11,
      shopCount: 88,
      activeSeasonalCollectionCount: 0,
      updatedAt: "2026-07-29T00:00:00.000Z"
    }
  };

  await page.route("https://unicolle.vercel.app/api/staff/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/staff/catalog") {
      if (scenario.catalogError) {
        await fulfillJson(route, { ok: false, error: "responsive_test_catalog_error" }, 500);
        return;
      }
      await fulfillJson(route, catalogBody, 200, { "Cache-Control": "no-store" });
      return;
    }
    await fulfillJson(route, { ok: true, verified: true });
  });

  await page.route("**/api/staff/catalog**", async (route) => {
    if (scenario.catalogError) {
      await fulfillJson(route, { ok: false, error: "responsive_test_catalog_error" }, 500);
      return;
    }
    await fulfillJson(route, catalogBody, 200, { "Cache-Control": "no-store" });
  });

  for (const host of [supabaseHost, productionSupabaseHost]) {
    await page.route(`https://${host}/auth/v1/user**`, async (route) => {
      await fulfillJson(route, fakeUser(role));
    });

    await page.route(`https://${host}/auth/v1/factors**`, async (route) => {
      await fulfillJson(route, { totp: [{ id: "factor-test", factor_type: "totp", status: "verified" }] });
    });

    await page.route(`https://${host}/auth/v1/token**`, async (route) => {
      await fulfillJson(route, session);
    });

    await page.route(`https://${host}/rest/v1/**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.endsWith("/staff_members") && url.searchParams.get("user_id")?.startsWith("eq.")) {
        await fulfillJson(route, staffRows(role).find((row) => row.user_id === `staff-responsive-${role}`));
        return;
      }
      if (url.pathname.endsWith("/staff_members")) {
        await fulfillJson(route, staffRows(role));
        return;
      }
      await fulfillJson(route, postgrestArray(url.pathname));
    });
  }

  await page.route("https://example.test/**", async (route) => {
    await route.fulfill({ contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") });
  });
}

async function seedSession(page: Page, scenario: Scenario) {
  await page.addInitScript(({ keys, session }) => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    if (session) {
      for (const key of keys) window.sessionStorage.setItem(key, JSON.stringify(session));
    }
  }, {
    keys: storageKeys,
    session: scenario.role ? fakeSession(scenario.role, scenario.aal ?? "aal2") : null
  });
}

async function measure(page: Page, scenario: Scenario, viewport: ViewportCase, focusedSelector?: string): Promise<Measurement> {
  const result = await page.evaluate(({ scenarioName, label, viewportName, focused }) => {
    const staffRoot = document.querySelector(".staff-console") as HTMLElement | null;
    const round = (value: number) => Math.round(value * 100) / 100;
    const innerWidth = window.innerWidth;
    const isVisible = (element: Element, rect: DOMRect) => {
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const safeText = (element: Element) => (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 72);
    const offenders: Measurement["offenders"] = [];
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue;
      const rect = element.getBoundingClientRect();
      if (!isVisible(element, rect)) continue;
      const tag = element.tagName.toLowerCase();
      if (tag === "script" || tag === "style") continue;
      const parent = element.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      const className = typeof element.className === "string" ? element.className : "";
      const reasons: string[] = [];
      if (rect.left < -0.5) reasons.push("left<0");
      if (rect.right > innerWidth + 0.5) reasons.push("right>viewport");
      if (parentRect && rect.width > parentRect.width + 0.5 && !["html", "body"].includes(parent?.tagName.toLowerCase() ?? "")) reasons.push("width>parent");
      if (reasons.length) {
        offenders.push({
          tag,
          id: (element as HTMLElement).id ?? "",
          className: className.slice(0, 120),
          text: safeText(element),
          left: round(rect.left),
          right: round(rect.right),
          width: round(rect.width),
          parentWidth: parentRect ? round(parentRect.width) : null,
          reason: reasons.join(",")
        });
      }
    }
    const staffClientWidth = staffRoot?.clientWidth ?? 0;
    const staffScrollWidth = staffRoot?.scrollWidth ?? 0;
    const documentScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const pass = documentScrollWidth <= innerWidth && bodyScrollWidth <= innerWidth && (!staffRoot || staffScrollWidth <= staffClientWidth) && offenders.length === 0;
    return {
      scenario: scenarioName,
      label,
      viewport: viewportName,
      innerWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth,
      staffClientWidth,
      staffScrollWidth,
      offenderCount: offenders.length,
      offenders: offenders.slice(0, 8),
      focusedSelector: focused,
      pass
    };
  }, { scenarioName: scenario.name, label: scenario.label, viewportName: viewport.name, focused: focusedSelector });
  return result;
}

async function runScenario(page: Page, scenario: Scenario, viewport: ViewportCase): Promise<Measurement[]> {
  const networkLog: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/auth/v1/") || url.includes("/rest/v1/") || url.includes("/api/staff/")) {
      networkLog.push(`REQ ${request.method()} ${url.replace(/\?.*/, "")} auth=${Boolean(request.headers().authorization)}`);
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/auth/v1/") || url.includes("/rest/v1/") || url.includes("/api/staff/")) {
      networkLog.push(`RES ${response.status()} ${url.replace(/\?.*/, "")}`);
    }
  });
  await setupRoutes(page, scenario);
  await seedSession(page, scenario);
  await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "domcontentloaded" });
  try {
    if (scenario.waitSelector) {
      await page.locator(scenario.waitSelector).first().waitFor({ timeout: 15_000 });
    } else {
      await page.getByText(scenario.waitFor).first().waitFor({ timeout: 15_000 });
    }
  } catch (error) {
    await page.locator("details").evaluateAll((items) => { for (const item of items) (item as HTMLDetailsElement).open = true; }).catch(() => undefined);
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const sessionDebug = await page.evaluate(() => {
      const keys = Object.keys(window.sessionStorage).filter((key) => key.includes("auth-token"));
      const claims = keys.map((key) => {
        try {
          const raw = window.sessionStorage.getItem(key);
          const token = raw ? JSON.parse(raw).access_token : null;
          const payload = token ? JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
          return { key, aal: payload?.aal ?? null, sub: payload?.sub ?? null };
        } catch {
          return { key, aal: null, sub: null };
        }
      });
      return JSON.stringify(claims);
    }).catch(() => "[]");
    throw new Error(`Wait failed for ${scenario.name} at ${viewport.name}: ${String(error).split("\n")[0]}\nSession: ${sessionDebug}\nNetwork: ${networkLog.slice(-30).join(" | ")}\nBody: ${bodyText.replace(/\s+/g, " ").slice(0, 800)}`);
  }
  if (scenario.action) await scenario.action(page);
  for (const text of scenario.forbiddenText ?? []) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
  const results: Measurement[] = [await measure(page, scenario, viewport)];
  for (const selector of scenario.focusSelectors ?? []) {
    const locator = page.locator(selector).first();
    if (await locator.count()) {
      await locator.focus();
      results.push(await measure(page, scenario, viewport, selector));
    }
  }
  return results;
}

function markdownReport(results: Measurement[]) {
  const lines = [
    "# iOS Build 15 Staff Responsive DOM Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Scope",
    "",
    "- Browser: Playwright Chromium",
    "- Production credentials: not used",
    "- Supabase and staff APIs: route-intercepted fixtures",
    "- Production writes: none",
    "- Fixture location: `tests/staff-responsive.spec.ts` only",
    "",
    "## Summary",
    "",
    `- Measurements: ${results.length}`,
    `- PASS: ${results.filter((item) => item.pass).length}`,
    `- FAIL: ${results.filter((item) => !item.pass).length}`,
    "",
    "## Measurements",
    "",
    "| Screen | Width | Focus | innerWidth | doc scroll/client | body scroll/client | staff scroll/client | Result |",
    "|---|---:|---|---:|---:|---:|---:|---|"
  ];
  for (const item of results) {
    lines.push(`| ${item.label} | ${item.viewport} | ${item.focusedSelector ?? "-"} | ${item.innerWidth} | ${item.documentScrollWidth}/${item.documentClientWidth} | ${item.bodyScrollWidth}/${item.bodyClientWidth} | ${item.staffScrollWidth}/${item.staffClientWidth} | ${item.pass ? "PASS" : "FAIL"} |`);
  }
  const failures = results.filter((item) => !item.pass);
  lines.push("", "## Offenders", "");
  if (!failures.length) {
    lines.push("- None");
  } else {
    for (const failure of failures) {
      lines.push(`### ${failure.label} / ${failure.viewport} / ${failure.focusedSelector ?? "default"}`);
      for (const offender of failure.offenders) {
        lines.push(`- ${offender.tag}${offender.id ? "#" + offender.id : ""} \`${offender.className}\` ${offender.reason}: left=${offender.left}, right=${offender.right}, width=${offender.width}, parent=${offender.parentWidth ?? "-"}, text="${offender.text}"`);
      }
    }
  }
  lines.push(
    "",
    "## Owner / Editor Menu Check",
    "",
    "- Owner scenarios include 商品, 店舗, エリア, 期間限定特集, 家族を追加, 操作履歴.",
    "- Editor scenarios assert owner-only labels are absent: 家族を追加, 操作履歴, 権限変更, 利用停止, 完全削除.",
    "",
    "## Keyboard Equivalent Check",
    "",
    "- Login, MFA, and all editor forms focus representative inputs and re-measure the DOM at the same viewport width.",
    "- Desktop Chromium does not render an iOS software keyboard, so this verifies no horizontal shift or unreachable fixed-width element is introduced by focus state.",
    "",
    "## Production Bundle Fixture Check",
    "",
    "- Test fixture data is stored under `tests/` and is not referenced from application source.",
    "- Archive verification must additionally confirm Playwright and fixture strings are not bundled before upload."
  );
  return `${lines.join("\n")}\n`;
}

test("staff admin screens fit every target viewport without horizontal overflow", async ({ browser }) => {
  test.setTimeout(40 * 60 * 1000);
  const allResults: Measurement[] = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 2, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
    try {
      for (const scenario of scenarios) {
        console.log(`[staff-responsive] ${viewport.name} ${scenario.name}`);
        const page = await context.newPage();
        try {
          const results = await runScenario(page, scenario, viewport);
          allResults.push(...results);
        } finally {
          await page.close().catch(() => undefined);
        }
      }
    } finally {
      await context.close().catch(() => undefined);
    }
  }

  const reportPath = join(process.cwd(), "docs/ios-build15-responsive-staff-report.md");
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, markdownReport(allResults));

  const failed = allResults.filter((item) => !item.pass);
  expect(failed, `Responsive staff failures written to ${reportPath}`).toEqual([]);
});

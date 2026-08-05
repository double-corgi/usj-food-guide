import { expect, test, type Page, type Route } from "@playwright/test";

type StaffRole = "owner" | "editor";
type StaffAal = "aal1" | "aal2";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const supabaseHost = "staff-product-editor-test.supabase.co";
const productionSupabaseHost = "wzdrvudneotgudelmlxq.supabase.co";
const supabaseUrl = "https://" + supabaseHost;
const storageKeys = ["sb-staff-product-editor-test-auth-token", "sb-wzdrvudneotgudelmlxq-auth-token"];
const nowSeconds = Math.floor(Date.now() / 1000);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS"
};

function b64(value: string) {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fakeJwt(aal: StaffAal, role: StaffRole) {
  const payload = {
    aud: "authenticated",
    exp: nowSeconds + 3600,
    sub: "staff-product-editor-" + role,
    email: "staff-product-editor-" + role + "@example.test",
    role: "authenticated",
    aal,
    amr: aal === "aal2" ? [{ method: "password", timestamp: nowSeconds - 60 }, { method: "totp", timestamp: nowSeconds - 30 }] : [{ method: "password", timestamp: nowSeconds - 60 }]
  };
  return b64(JSON.stringify({ alg: "none", typ: "JWT" })) + "." + b64(JSON.stringify(payload)) + "." + b64(JSON.stringify({ sig: "test" }));
}

function fakeUser(role: StaffRole) {
  return { id: "staff-product-editor-" + role, aud: "authenticated", role: "authenticated", email: "staff-product-editor-" + role + "@example.test", email_confirmed_at: "2026-07-29T00:00:00.000Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, factors: [{ id: "factor-test", factor_type: "totp", status: "verified" }], created_at: "2026-07-29T00:00:00.000Z" };
}

function fakeSession(role: StaffRole, aal: StaffAal) {
  return { access_token: fakeJwt(aal, role), refresh_token: "refresh-token-fixture-" + role + "-" + aal, token_type: "bearer", expires_in: 3600, expires_at: nowSeconds + 3600, user: fakeUser(role) };
}

const fixtureAreas = [
  { id: "area-1", name: "スーパー・ニンテンドー・ワールド", sortOrder: 1 },
  { id: "area-2", name: "ニューヨーク・エリア", sortOrder: 2 }
];

const fixtureShops = [
  { id: "shop-1", name: "デリシャス・ミー！ザ・クッキー・キッチン", areaId: "area-1", areaName: "スーパー・ニンテンドー・ワールド", shopType: "restaurant", isActive: true, officialUrl: null },
  { id: "shop-2", name: "ハピネス・ワゴン（ニューヨーク・エリア）", areaId: "area-2", areaName: "ニューヨーク・エリア", shopType: "wagon", isActive: true, officialUrl: null }
];

const fixtureFoods = [
  { id: "food-generated-1", name: "チュリトスとその他が残る旧データ確認フード", nameEn: "Legacy Kind Food", price: 1930, areaId: "area-1", areaName: "スーパー・ニンテンドー・ワールド", shopId: "shop-1", shopName: "デリシャス・ミー！ザ・クッキー・キッチン", category: "unknown", categoryTags: ["churro", "unknown"], saleStatus: "active", status: "active", publicState: "published", reviewStatus: "approved", hidden: false, deletedAt: null, imageUrl: "https://example.test/food.jpg", sourceUrl: null, startDate: "2026-07-01", endDate: "2026-09-30", updatedAt: "2026-07-29T00:00:00.000Z" }
];

const fixtureCollections = [{ id: "collection-1", name: "2026 夏の期間限定特集", name_en: "", description: "", image_url: "", public_state: "published", hidden: false, sort_order: 1, starts_on: "2026-07-01", ends_on: "2026-09-30", season_type: "manual", accent_color: "#0b66c3", is_featured: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" }];

async function fulfillJson(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) {
  await route.fulfill({ status, contentType: "application/json", headers: { ...corsHeaders, ...headers }, body: JSON.stringify(body) });
}

function staffRows(role: StaffRole) {
  return [{ user_id: "staff-product-editor-owner", email: "staff-product-editor-owner@example.test", display_name: "テスト管理者", role: "owner", is_active: true, created_at: "2026-07-29T00:00:00.000Z" }, { user_id: "staff-product-editor-editor", email: "staff-product-editor-editor@example.test", display_name: "編集できる人", role: "editor", is_active: true, created_at: "2026-07-29T00:00:00.000Z" }].map((row) => row.user_id === "staff-product-editor-" + role ? row : row);
}

function postgrestArray(pathname: string) {
  if (pathname.endsWith("/manual_foods")) return [];
  if (pathname.endsWith("/food_overrides")) return [];
  if (pathname.endsWith("/food_collection_memberships")) return [{ food_id: "food-generated-1", collection_id: "collection-1" }];
  if (pathname.endsWith("/food_publication_metadata")) return [];
  if (pathname.endsWith("/staff_shops")) return [];
  if (pathname.endsWith("/staff_food_store_links")) return [{ id: "link-1", food_id: "food-generated-1", shop_id: "shop-1", is_primary: true, deleted_at: null, updated_at: "2026-07-29T00:00:00.000Z" }];
  if (pathname.endsWith("/staff_areas")) return [];
  if (pathname.endsWith("/collections")) return fixtureCollections;
  if (pathname.endsWith("/staff_audit_logs")) return [];
  return [];
}

async function setupRoutes(page: Page, role: StaffRole = "owner", aal: StaffAal = "aal2") {
  const session = fakeSession(role, aal);
  const catalogBody = { foods: fixtureFoods, shops: fixtureShops, areas: fixtureAreas, dashboard: { publicFoodCount: 194, onSaleFoodCount: 193, unpublishedFoodCount: 14, areaCount: 11, shopCount: 88, activeSeasonalCollectionCount: 0, updatedAt: "2026-07-29T00:00:00.000Z" } };
  await page.route("**/unicolle-ios-public-config.json", async (route) => fulfillJson(route, { staffEnabled: true, supabaseUrl, supabasePublishableKey: "sb_publishable_product_editor_test_key", apiBaseUrl: "https://unicolle.vercel.app" }));
  await page.route("https://unicolle.vercel.app/api/staff/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/staff/catalog") {
      await fulfillJson(route, catalogBody, 200, { "Cache-Control": "no-store" });
      return;
    }
    if (pathname === "/api/staff/write") {
      const body = route.request().postDataJSON() as { operation?: string; payload?: { values?: Record<string, unknown> } };
      if (body.operation === "food.save") {
        const values = body.payload?.values ?? {};
        const tags = Array.isArray(values.category_tags) ? values.category_tags : [];
        if (tags.length !== 1) {
          await fulfillJson(route, { ok: false, error: "invalid_product_kind" }, 400);
          return;
        }
        if (values.start_date && values.end_date && String(values.start_date) > String(values.end_date)) {
          await fulfillJson(route, { ok: false, error: "invalid_sale_period" }, 400);
          return;
        }
      }
      await fulfillJson(route, { ok: true, verified: true, kind: "food", id: "food-generated-1", data: { id: "food-generated-1" } });
      return;
    }
    await fulfillJson(route, { ok: true, verified: true });
  });
  for (const host of [supabaseHost, productionSupabaseHost]) {
    await page.route("https://" + host + "/auth/v1/user**", async (route) => fulfillJson(route, fakeUser(role)));
    await page.route("https://" + host + "/auth/v1/factors**", async (route) => fulfillJson(route, { totp: [{ id: "factor-test", factor_type: "totp", status: "verified" }] }));
    await page.route("https://" + host + "/auth/v1/token**", async (route) => fulfillJson(route, session));
    await page.route("https://" + host + "/rest/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/staff_members") && url.searchParams.get("user_id")?.startsWith("eq.")) {
        await fulfillJson(route, staffRows(role).find((row) => row.user_id === "staff-product-editor-" + role));
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
  await page.addInitScript(({ keys, session }) => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    for (const key of keys) window.sessionStorage.setItem(key, JSON.stringify(session));
  }, { keys: storageKeys, session });
}

async function productKindChecked(page: Page, label: string) {
  return page.evaluate((target) => {
    const buttons = Array.from(document.querySelectorAll('button[role="radio"]'));
    const button = buttons.find((item) => (item.textContent ?? '').replace(/\s+/g, '').includes(target));
    return button?.getAttribute('aria-checked') ?? null;
  }, label);
}

async function clickProductKind(page: Page, label: string) {
  const handle = await page.evaluateHandle((target) => {
    const buttons = Array.from(document.querySelectorAll('button[role="radio"]'));
    return buttons.find((item) => (item.textContent ?? '').replace(/\s+/g, '').includes(target)) ?? null;
  }, label);
  const element = handle.asElement();
  if (!element) throw new Error('Missing product kind button: ' + label);
  await element.click();
}

async function openFoodEditor(page: Page, path = "/staff/foods/food-generated-1/edit") {
  await page.goto(baseUrl + path, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /商品を編集/ }).first().waitFor({ timeout: 7000 });
}

test("sale period controls are exclusive and reveal date fields", async ({ page }) => {
  await setupRoutes(page);
  await openFoodEditor(page);
  await expect(page.getByRole("radio", { name: "期間限定" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("販売開始日")).toHaveValue("2026-07-01");
  await expect(page.getByLabel("販売終了日")).toHaveValue("2026-09-30");
  await page.getByRole("radio", { name: "いつでも販売" }).click();
  await expect(page.getByRole("radio", { name: "いつでも販売" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("販売開始日")).toHaveCount(0);
  await page.getByRole("radio", { name: "期間限定" }).click();
  await expect(page.getByRole("radio", { name: "期間限定" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByLabel("販売開始日")).toBeVisible();
  await page.getByLabel("販売開始日").fill("2026-09-30");
  await page.getByLabel("販売終了日").fill("2026-07-01");
  await page.getByRole("button", { name: "保存する" }).first().click();
  await expect(page.getByText("販売開始日は販売終了日より前の日付にしてください。")).toBeVisible();
});

test("product kind is one required radio-like choice and legacy unknown is ignored", async ({ page }) => {
  await setupRoutes(page);
  await openFoodEditor(page);
  expect(await productKindChecked(page, "チュリトス")).toBe("true");
  expect(await productKindChecked(page, "その他")).toBe("false");
  await clickProductKind(page, "ポップコーン");
  expect(await productKindChecked(page, "ポップコーン")).toBe("true");
  expect(await productKindChecked(page, "チュリトス")).toBe("false");
  expect(await productKindChecked(page, "その他")).toBe("false");
  await clickProductKind(page, "その他");
  expect(await productKindChecked(page, "その他")).toBe("true");
  expect(await productKindChecked(page, "ポップコーン")).toBe("false");
});

test("new products do not auto-select other and all staff inputs remain at least 16px", async ({ page }) => {
  await setupRoutes(page);
  await openFoodEditor(page, "/staff/foods/new");
  const productKindStates = await page.getByRole("radio").evaluateAll((buttons) => buttons.filter((button) => ["チュリトス", "ポップコーン", "ドリンク", "食べ歩き", "カート", "季節限定", "ニンテンドー", "ミニオン", "ハリーポッター", "その他"].includes(button.textContent?.trim() ?? "")).map((button) => button.getAttribute("aria-checked")));
  expect(productKindStates.every((value) => value === "false")).toBe(true);
  await page.getByRole("radio", { name: "期間限定" }).click();
  const fontSizes = await page.locator(".staff-console input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']), .staff-console select, .staff-console textarea").evaluateAll((elements) => elements.map((element) => parseFloat(window.getComputedStyle(element).fontSize || "0")));
  expect(fontSizes.length).toBeGreaterThan(0);
  expect(fontSizes.filter((size) => size < 16)).toEqual([]);
});

test("edit header is normal flow and scrolls away", async ({ page }) => {
  await setupRoutes(page);
  await openFoodEditor(page);
  const headerPosition = await page.getByRole("heading", { name: /商品を編集/ }).first().evaluate((heading) => {
    const card = heading.closest(".rounded-2xl, .rounded-3xl") as HTMLElement | null;
    return card ? window.getComputedStyle(card).position : "missing";
  });
  expect(headerPosition).not.toBe("sticky");
  expect(headerPosition).not.toBe("fixed");
  const before = await page.getByRole("heading", { name: /商品を編集/ }).first().boundingBox();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(100);
  const after = await page.getByRole("heading", { name: /商品を編集/ }).first().boundingBox();
  expect(before?.y ?? 0).toBeGreaterThanOrEqual(0);
  expect(after?.y ?? 0).toBeLessThan(0);
});

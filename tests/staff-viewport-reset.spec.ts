import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

type StaffRole = 'owner' | 'editor';
type StaffAal = 'aal1' | 'aal2';
type ViewportCase = { name: string; width: number; height: number };
type Snapshot = {
  label: string;
  viewport: string;
  innerWidth: number;
  devicePixelRatio: number;
  visualViewportWidth: number | null;
  docClient: number;
  docScroll: number;
  bodyClient: number;
  bodyScroll: number;
  appClient: number;
  appScroll: number;
  staffClient: number;
  staffScroll: number;
  viewportMeta: string;
  htmlClass: string;
  bodyClass: string;
  htmlStyle: string;
  bodyStyle: string;
  staffPresent: boolean;
  footerPresent: boolean;
  mobileNavPresent: boolean;
  h1Font: string;
  cardWidth: number | null;
  scrollLeft: number;
  offenders: Array<{ tag: string; id: string; className: string; text: string; left: number; right: number; width: number; parentWidth: number | null; reason: string }>;
  pass: boolean;
};

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const supabaseHost = 'staff-viewport-test.supabase.co';
const productionSupabaseHost = 'wzdrvudneotgudelmlxq.supabase.co';
const supabaseUrl = 'https://' + supabaseHost;
const storageKeys = ['sb-staff-viewport-test-auth-token', 'sb-wzdrvudneotgudelmlxq-auth-token'];
const nowSeconds = Math.floor(Date.now() / 1000);
const viewports: ViewportCase[] = [
  { name: 'iphone-320', width: 320, height: 740 },
  { name: 'iphone-375', width: 375, height: 812 },
  { name: 'iphone-390', width: 390, height: 844 },
  { name: 'iphone-393', width: 393, height: 852 },
  { name: 'iphone-414', width: 414, height: 896 },
  { name: 'iphone-430', width: 430, height: 932 },
  { name: 'ipad-air-11-portrait', width: 820, height: 1180 },
  { name: 'ipad-air-11-landscape', width: 1180, height: 820 }
];
const publicPaths = [
  { path: '/', label: 'home', waitFor: 'ユニコレ' },
  { path: '/foods', label: 'foods', waitFor: 'ユニコレ' },
  { path: '/eaten', label: 'eaten', waitFor: 'ユニコレ' },
  { path: '/areas', label: 'areas', waitFor: 'ユニコレ' },
  { path: '/stores', label: 'stores', waitFor: 'ユニコレ' }
];
const staffPaths = [
  { path: '/staff', label: 'dashboard', waitFor: 'アプリ運営' },
  { path: '/staff?tab=foods', label: 'foods', waitFor: '全商品' },
  { path: '/staff?tab=stores', label: 'stores', waitFor: 'デリシャス・ミー！ザ・クッキー・キッチン' },
  { path: '/staff?tab=areas', label: 'areas', waitFor: 'スーパー・ニンテンドー・ワールド' },
  { path: '/staff?tab=collections', label: 'collections', waitFor: 'とても長い期間限定特集名' }
];
const fixtureAreas = [
  { id: 'area-1', name: 'スーパー・ニンテンドー・ワールド', sortOrder: 1 },
  { id: 'area-2', name: 'ニューヨーク・エリア', sortOrder: 2 },
  { id: 'area-3', name: 'とても長い名前の横幅検査エリア', sortOrder: 3 }
];
const fixtureShops = [
  { id: 'shop-1', name: 'デリシャス・ミー！ザ・クッキー・キッチン', areaId: 'area-1', areaName: 'スーパー・ニンテンドー・ワールド', shopType: 'restaurant', isActive: true, officialUrl: null },
  { id: 'shop-2', name: 'ハピネス・ワゴン（ニューヨーク・エリア）とても長い店舗名の横幅検査', areaId: 'area-2', areaName: 'ニューヨーク・エリア', shopType: 'wagon', isActive: true, officialUrl: null },
  { id: 'shop-3', name: 'ルイズ N.Y. ピザパーラー', areaId: 'area-2', areaName: 'ニューヨーク・エリア', shopType: 'restaurant', isActive: true, officialUrl: null }
];
const fixtureFoods = [{ id: 'food-generated-1', name: 'スーパー長い商品名のテスト用フード・画面から絶対にはみ出してはいけないスペシャルセット', nameEn: 'Very Long Responsive Test Food Name', price: 1930, areaId: 'area-1', areaName: 'スーパー・ニンテンドー・ワールド', shopId: 'shop-1', shopName: 'デリシャス・ミー！ザ・クッキー・キッチン', category: 'snack', saleStatus: 'active', status: 'active', publicState: 'published', reviewStatus: 'approved', hidden: false, deletedAt: null, imageUrl: 'https://example.test/food.jpg', sourceUrl: null, startDate: null, endDate: null, updatedAt: '2026-07-29T00:00:00.000Z' }];
const fixtureCollections = [{ id: 'collection-1', name: 'とても長い期間限定特集名の横幅検査 2026 夏', description: '長い説明です。', image_url: '', public_state: 'published', hidden: false, sort_order: 1, starts_on: '2026-07-01', ends_on: '2026-09-30', season_type: 'manual', accent_color: '#0b66c3', is_featured: true, deleted_at: null, updated_at: '2026-07-29T00:00:00.000Z' }];
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS' };
function b64(value: string) { return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function fakeJwt(aal: StaffAal, role: StaffRole) {
  const payload = { aud: 'authenticated', exp: nowSeconds + 3600, sub: 'staff-viewport-' + role, email: 'staff-viewport-' + role + '@example.test', role: 'authenticated', aal, amr: aal === 'aal2' ? [{ method: 'password', timestamp: nowSeconds - 60 }, { method: 'totp', timestamp: nowSeconds - 30 }] : [{ method: 'password', timestamp: nowSeconds - 60 }] };
  return b64(JSON.stringify({ alg: 'none', typ: 'JWT' })) + '.' + b64(JSON.stringify(payload)) + '.' + b64(JSON.stringify({ sig: 'test' }));
}
function fakeUser(role: StaffRole) { return { id: 'staff-viewport-' + role, aud: 'authenticated', role: 'authenticated', email: 'staff-viewport-' + role + '@example.test', email_confirmed_at: '2026-07-29T00:00:00.000Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, factors: [{ id: 'factor-test', factor_type: 'totp', status: 'verified' }], created_at: '2026-07-29T00:00:00.000Z' }; }
function fakeSession(role: StaffRole, aal: StaffAal) { return { access_token: fakeJwt(aal, role), refresh_token: 'refresh-token-fixture-' + role + '-' + aal, token_type: 'bearer', expires_in: 3600, expires_at: nowSeconds + 3600, user: fakeUser(role) }; }
function staffRows(role: StaffRole) { return [{ user_id: 'staff-viewport-owner', email: 'staff-viewport-owner@example.test', display_name: 'テスト管理者', role: 'owner', is_active: true, created_at: '2026-07-29T00:00:00.000Z' }, { user_id: 'staff-viewport-editor', email: 'very-long-editor-address-for-layout-check@example.test', display_name: 'とても長い名前の編集できる人', role: 'editor', is_active: true, created_at: '2026-07-29T00:01:00.000Z' }].map((row) => row.user_id === 'staff-viewport-' + role ? row : row); }
async function fulfillJson(route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) { await route.fulfill({ status, contentType: 'application/json', headers: { ...corsHeaders, ...headers }, body: JSON.stringify(body) }); }
function postgrestArray(pathname: string) {
  if (pathname.endsWith('/food_collection_memberships')) return [{ food_id: 'food-generated-1', collection_id: 'collection-1' }];
  if (pathname.endsWith('/staff_food_store_links')) return [{ id: 'link-1', food_id: 'food-generated-1', shop_id: 'shop-1', is_primary: true, deleted_at: null, updated_at: '2026-07-29T00:00:00.000Z' }];
  if (pathname.endsWith('/collections')) return fixtureCollections;
  if (pathname.endsWith('/staff_audit_logs')) return [{ id: 'audit-1', action: 'update', target_name: '横幅検査用商品', actor_name: 'テスト管理者', created_at: '2026-07-29T00:00:00.000Z', after: { name: '横幅検査用商品' } }];
  return [];
}
async function setupRoutes(page: Page, role: StaffRole) {
  const session = fakeSession(role, 'aal2');
  await page.route('**/unicolle-ios-public-config.json', async (route) => fulfillJson(route, { staffEnabled: true, supabaseUrl, supabasePublishableKey: 'sb_publishable_viewport_test_key', apiBaseUrl: 'https://unicolle.vercel.app' }));
  const catalogBody = { foods: fixtureFoods, shops: fixtureShops, areas: fixtureAreas, dashboard: { publicFoodCount: 194, onSaleFoodCount: 193, unpublishedFoodCount: 14, areaCount: 11, shopCount: 88, activeSeasonalCollectionCount: 0, updatedAt: '2026-07-29T00:00:00.000Z' } };
  await page.route('https://unicolle.vercel.app/api/staff/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/staff/catalog') {
      await fulfillJson(route, catalogBody, 200, { 'Cache-Control': 'no-store' });
      return;
    }
    await fulfillJson(route, { ok: true, verified: true });
  });
  await page.route('**/api/staff/catalog**', async (route) => fulfillJson(route, catalogBody, 200, { 'Cache-Control': 'no-store' }));
  for (const host of [supabaseHost, productionSupabaseHost]) {
    await page.route('https://' + host + '/auth/v1/user**', async (route) => fulfillJson(route, fakeUser(role)));
    await page.route('https://' + host + '/auth/v1/factors**', async (route) => fulfillJson(route, { totp: [{ id: 'factor-test', factor_type: 'totp', status: 'verified' }] }));
    await page.route('https://' + host + '/auth/v1/token**', async (route) => fulfillJson(route, session));
    await page.route('https://' + host + '/rest/v1/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/staff_members') && url.searchParams.get('user_id')?.startsWith('eq.')) { await fulfillJson(route, staffRows(role).find((row) => row.user_id === 'staff-viewport-' + role)); return; }
      if (url.pathname.endsWith('/staff_members')) { await fulfillJson(route, staffRows(role)); return; }
      await fulfillJson(route, postgrestArray(url.pathname));
    });
  }
  await page.route('https://example.test/**', async (route) => route.fulfill({ contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }));
}
async function seedSession(page: Page, role: StaffRole) { await page.addInitScript(({ keys, session }) => { window.sessionStorage.clear(); window.localStorage.clear(); for (const key of keys) window.sessionStorage.setItem(key, JSON.stringify(session)); }, { keys: storageKeys, session: fakeSession(role, 'aal2') }); }
async function waitForVisibleText(page: Page, text: string, selector = 'h1,h2,h3,p,a,button,span,strong,summary,label') {
  await page.waitForFunction(({ expected, query }) => {
    const elements = Array.from(document.body.querySelectorAll(query));
    return elements.some((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return element instanceof HTMLElement && element.innerText.includes(expected) && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
  }, { expected: text, query: selector }, { timeout: 15000 });
}
async function gotoAndWait(page: Page, path: string, waitFor: string) {
  await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded' });
  try {
    await waitForVisibleText(page, waitFor, path === '/' && waitFor === 'ユニコレ' ? 'h1' : undefined);
  } catch (error) {
    const body = await page.locator('body').innerText().catch(() => '');
    throw new Error('Visible text wait failed for ' + path + ' expecting "' + waitFor + '" at ' + page.url() + ': ' + String(error).split('\n')[0] + '\nBody: ' + body.replace(/\s+/g, ' ').slice(0, 800));
  }
}
async function snapshot(page: Page, label: string, viewport: string): Promise<Snapshot> {
  return page.evaluate(({ label: currentLabel, viewport: currentViewport }) => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const innerWidth = window.innerWidth;
    const appRoot = document.querySelector('.app-shell-main') as HTMLElement | null;
    const staffRoot = document.querySelector('.staff-console') as HTMLElement | null;
    const offenders: Snapshot['offenders'] = [];
    const visible = (element: Element, rect: DOMRect) => { const style = window.getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'; };
    const firstVisible = (selector: string) => Array.from(document.querySelectorAll(selector)).find((element) => {
      if (!(element instanceof HTMLElement)) return false;
      return visible(element, element.getBoundingClientRect());
    }) as HTMLElement | null;
    const firstCard = firstVisible('.mobile-card-surface, .staff-card, article, section');
    const homeHeading = Array.from(document.querySelectorAll('h1')).find((element) => element instanceof HTMLElement && element.innerText.includes('ユニコレ') && visible(element, element.getBoundingClientRect())) as HTMLElement | undefined;
    const heading = homeHeading ?? firstVisible('h1');
    const safeText = (element: Element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 72);
    for (const element of Array.from(document.querySelectorAll('body *'))) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) continue;
      const tag = element.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') continue;
      const rect = element.getBoundingClientRect();
      if (!visible(element, rect)) continue;
      const parent = element.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      const reasons: string[] = [];
      if (rect.left < -0.5) reasons.push('left<0');
      if (rect.right > innerWidth + 0.5) reasons.push('right>viewport');
      if (parentRect && rect.width > parentRect.width + 0.5 && !['html', 'body'].includes(parent?.tagName.toLowerCase() ?? '')) reasons.push('width>parent');
      if (reasons.length) offenders.push({ tag, id: (element as HTMLElement).id ?? '', className: typeof element.className === 'string' ? element.className.slice(0, 120) : '', text: safeText(element), left: round(rect.left), right: round(rect.right), width: round(rect.width), parentWidth: parentRect ? round(parentRect.width) : null, reason: reasons.join(',') });
    }
    const staffClient = staffRoot?.clientWidth ?? 0;
    const staffScroll = staffRoot?.scrollWidth ?? 0;
    const appClient = appRoot?.clientWidth ?? 0;
    const appScroll = appRoot?.scrollWidth ?? 0;
    const docScroll = document.documentElement.scrollWidth;
    const bodyScroll = document.body.scrollWidth;
    const pass = docScroll <= innerWidth && bodyScroll <= innerWidth && (!staffRoot || staffScroll <= staffClient) && appScroll <= Math.max(appClient, innerWidth) && offenders.length === 0;
    return { label: currentLabel, viewport: currentViewport, innerWidth, devicePixelRatio: window.devicePixelRatio, visualViewportWidth: window.visualViewport ? round(window.visualViewport.width) : null, docClient: document.documentElement.clientWidth, docScroll, bodyClient: document.body.clientWidth, bodyScroll, appClient, appScroll, staffClient, staffScroll, viewportMeta: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? '', htmlClass: document.documentElement.className, bodyClass: document.body.className, htmlStyle: document.documentElement.getAttribute('style') ?? '', bodyStyle: document.body.getAttribute('style') ?? '', staffPresent: Boolean(staffRoot), footerPresent: Boolean(document.querySelector('.app-shell-footer footer')), mobileNavPresent: Boolean(document.querySelector('.app-mobile-bottom-nav')), h1Font: heading ? window.getComputedStyle(heading).fontSize : '', cardWidth: firstCard ? round(firstCard.getBoundingClientRect().width) : null, scrollLeft: Math.max(document.documentElement.scrollLeft, document.body.scrollLeft, document.scrollingElement instanceof HTMLElement ? document.scrollingElement.scrollLeft : 0), offenders: offenders.slice(0, 10), pass } satisfies Snapshot;
  }, { label, viewport });
}
async function forceHorizontalPan(page: Page) { await page.evaluate(() => { document.documentElement.scrollLeft = 160; document.body.scrollLeft = 160; if (document.scrollingElement instanceof HTMLElement) document.scrollingElement.scrollLeft = 160; window.scrollBy(160, 0); }); }
function writeReport(results: Snapshot[], comparisons: string[]) {
  const reportPath = join(process.cwd(), 'docs/ios-build16-staff-viewport-reset-report.md');
  const failures = results.filter((item) => !item.pass);
  const lines = ['# iOS Build 16 Staff Viewport Reset Report', '', 'Generated: ' + new Date().toISOString(), '', '## Scope', '', '- Browser: Playwright Chromium', '- Production credentials: not used', '- Supabase and staff APIs: route-intercepted fixtures', '- Production writes: none', '- Validates staff route sizing and staff-to-public route cleanup in the same browser context.', '', '## Summary', '', '- Measurements: ' + results.length, '- PASS: ' + results.filter((item) => item.pass).length, '- FAIL: ' + failures.length, '', '## Measurements', '', '| Flow | Width | inner | visualViewport | doc scroll/client | body scroll/client | app scroll/client | staff scroll/client | staff? | footer? | nav? | viewport meta | html/body style | Result |', '|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|---|---|---|'];
  for (const item of results) lines.push('| ' + item.label + ' | ' + item.viewport + ' | ' + item.innerWidth + ' | ' + (item.visualViewportWidth ?? '-') + ' | ' + item.docScroll + '/' + item.docClient + ' | ' + item.bodyScroll + '/' + item.bodyClient + ' | ' + item.appScroll + '/' + item.appClient + ' | ' + item.staffScroll + '/' + item.staffClient + ' | ' + (item.staffPresent ? 'yes' : 'no') + ' | ' + (item.footerPresent ? 'yes' : 'no') + ' | ' + (item.mobileNavPresent ? 'yes' : 'no') + ' | ' + item.viewportMeta + ' | html=' + (item.htmlStyle || '-') + ' body=' + (item.bodyStyle || '-') + ' | ' + (item.pass ? 'PASS' : 'FAIL') + ' |');
  lines.push('', '## Before / After Public Layout Comparisons', '', ...comparisons.map((line) => '- ' + line), '', '## Offenders', '');
  if (!failures.length) lines.push('- None');
  for (const failure of failures) { lines.push('### ' + failure.label + ' / ' + failure.viewport); for (const offender of failure.offenders) lines.push('- ' + offender.tag + (offender.id ? '#' + offender.id : '') + ' [' + offender.className + '] ' + offender.reason + ': left=' + offender.left + ', right=' + offender.right + ', width=' + offender.width + ', parent=' + (offender.parentWidth ?? '-') + ', text="' + offender.text + '"'); }
  lines.push('', '## Fixture / Production Isolation', '', '- Test data and route interception live under tests/ only.', '- The app source does not require a responsive-test global flag to bypass MFA.', '- Archive verification must confirm Playwright and fixture strings are not bundled before upload.');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join('\n') + '\n');
  return reportPath;
}

test('staff route leaves no viewport or width state after returning to public pages', async ({ browser }) => {
  test.setTimeout(40 * 60 * 1000);
  const all: Snapshot[] = [];
  const comparisons: string[] = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 2, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
    const page = await context.newPage();
    try {
      await setupRoutes(page, 'owner');
      await seedSession(page, 'owner');
      await gotoAndWait(page, '/', 'ユニコレ');
      const before = await snapshot(page, 'public-before-home', viewport.name);
      all.push(before);
      await gotoAndWait(page, '/staff', 'アプリ運営');
      await expect(page.locator('.app-shell-footer footer')).toHaveCount(0);
      await expect(page.locator('.app-mobile-bottom-nav')).toHaveCount(0);
      await forceHorizontalPan(page);
      all.push(await snapshot(page, 'staff-dashboard-after-pan', viewport.name));
      await page.getByRole('button', { name: '一般画面へ戻る' }).click();
      await page.waitForURL(baseUrl + '/', { timeout: 15000 });
      await waitForVisibleText(page, 'ユニコレ', 'h1');
      const after = await snapshot(page, 'public-after-return-home', viewport.name);
      all.push(after);
      expect(after.staffPresent, 'staff root remains after public return at ' + viewport.name).toBe(false);
      expect(after.viewportMeta, 'viewport meta changed at ' + viewport.name).toBe(before.viewportMeta);
      expect(after.htmlClass, 'html class changed at ' + viewport.name).toBe(before.htmlClass);
      expect(after.bodyClass, 'body class changed at ' + viewport.name).toBe(before.bodyClass);
      expect(after.htmlStyle, 'html style changed at ' + viewport.name).toBe(before.htmlStyle);
      expect(after.bodyStyle, 'body style changed at ' + viewport.name).toBe(before.bodyStyle);
      expect(Math.abs(after.appClient - before.appClient), 'app width changed at ' + viewport.name).toBeLessThanOrEqual(1);
      expect(Math.abs(parseFloat(after.h1Font || '0') - parseFloat(before.h1Font || '0')), 'heading font changed at ' + viewport.name).toBeLessThanOrEqual(1);
      if (after.cardWidth !== null && before.cardWidth !== null) expect(Math.abs(after.cardWidth - before.cardWidth), 'card width changed at ' + viewport.name).toBeLessThanOrEqual(1);
      comparisons.push(viewport.name + ': viewport meta stable (' + after.viewportMeta + '); app width ' + before.appClient + '->' + after.appClient + '; h1 ' + before.h1Font + '->' + after.h1Font + '; card ' + (before.cardWidth ?? '-') + '->' + (after.cardWidth ?? '-'));
      await gotoAndWait(page, '/staff?tab=foods', '全商品');
      await forceHorizontalPan(page);
      all.push(await snapshot(page, 'staff-foods-after-pan', viewport.name));
      await page.getByRole('button', { name: '一般画面へ戻る' }).click();
      await page.waitForURL(baseUrl + '/', { timeout: 15000 });
      for (const publicPath of publicPaths) { await gotoAndWait(page, publicPath.path, publicPath.waitFor); all.push(await snapshot(page, 'public-after-staff-' + publicPath.label, viewport.name)); }
      await gotoAndWait(page, '/staff', 'アプリ運営');
      await forceHorizontalPan(page);
      await page.getByRole('button', { name: 'ログアウト' }).click();
      await page.getByText('運営者ログイン', { exact: false }).first().waitFor({ timeout: 15000 });
      all.push(await snapshot(page, 'staff-login-after-logout', viewport.name));
      await gotoAndWait(page, '/', 'ユニコレ');
      all.push(await snapshot(page, 'public-after-logout-home', viewport.name));
    } finally { await context.close().catch(() => undefined); }
  }
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 2, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
    try {
      for (const staffPath of staffPaths) {
        const page = await context.newPage();
        try {
          await setupRoutes(page, 'editor');
          await seedSession(page, 'editor');
          await gotoAndWait(page, staffPath.path, staffPath.waitFor);
          all.push(await snapshot(page, 'editor-' + staffPath.label, viewport.name));
          await expect(page.getByText('家族を追加', { exact: false })).toHaveCount(0);
          await expect(page.getByText('操作履歴', { exact: false })).toHaveCount(0);
          await forceHorizontalPan(page);
          all.push(await snapshot(page, 'editor-' + staffPath.label + '-after-pan', viewport.name));
        } finally { await page.close().catch(() => undefined); }
      }
    } finally { await context.close().catch(() => undefined); }
  }
  const reportPath = writeReport(all, comparisons);
  const failures = all.filter((item) => !item.pass);
  expect(failures, 'Viewport reset failures written to ' + reportPath).toEqual([]);
});

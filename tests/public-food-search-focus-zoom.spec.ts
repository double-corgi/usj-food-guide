import { createServer, type Server } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { test, expect, type Locator, type Page } from "@playwright/test";

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "393x852", width: 393, height: 852 },
  { name: "430x932", width: 430, height: 932 }
];

let server: Server;
let baseUrl = "";

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const rawPath = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const safePath = normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const candidates = [
      join(process.cwd(), "out", safePath),
      join(process.cwd(), "out", safePath, "index.html"),
      join(process.cwd(), "out", safePath + ".html")
    ];
    const filePath = candidates.find((candidate) => {
      try {
        return statSync(candidate).isFile();
      } catch {
        return false;
      }
    });

    if (!filePath) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(readFileSync(filePath));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start static test server");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

for (const viewport of viewports) {
  test(`public food search keeps 16px input and no horizontal overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${baseUrl}/foods/`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "フードを探す" })).toBeVisible();

    const input = page.getByTestId("public-food-search-input");
    await expect(input).toBeVisible();

    await assertViewportPolicy(page);
    await assertInputMetrics(input, "before focus");
    await assertNoHorizontalOverflow(page, "before focus");

    await input.focus();
    await assertInputMetrics(input, "focus");
    await assertNoHorizontalOverflow(page, "focus");

    await input.fill("スヌーピー");
    await assertInputMetrics(input, "typing Japanese text");
    await assertNoHorizontalOverflow(page, "typing Japanese text");
    await expect(input).toHaveValue("スヌーピー");

    await page.keyboard.press("Enter");
    await input.blur();
    await assertInputMetrics(input, "blur");
    await assertNoHorizontalOverflow(page, "blur");

    await page.getByRole("button", { name: /表示条件|Filters|Filter/ }).click();
    const selects = page.locator("select.public-food-filter-select");
    await expect(selects.first()).toBeVisible();
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThan(0);
    for (let index = 0; index < selectCount; index += 1) {
      await assertInputMetrics(selects.nth(index), `filter select ${index + 1}`);
    }
    await assertNoHorizontalOverflow(page, "filters open");

    const firstFoodLink = page.getByTestId("public-food-search-result-link").first();
    await expect(firstFoodLink).toBeVisible();
    await firstFoodLink.click();
    await expect(page).toHaveURL(/\/foods\//);
    await expect(page.getByText("前へ")).toHaveCount(0);
    await page.getByRole("link", { name: "一覧へ戻る" }).first().click();
    await expect(page.getByRole("heading", { name: "フードを探す" })).toBeVisible();
    await assertNoHorizontalOverflow(page, "after returning to list");
  });
}

async function assertInputMetrics(locator: Locator, label: string) {
  const metrics = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      fontSize: parseFloat(style.fontSize),
      rawFontSize: style.fontSize,
      lineHeight: style.lineHeight,
      transform: style.transform,
      zoom: style.zoom,
      width: style.width,
      maxWidth: style.maxWidth,
      minWidth: style.minWidth,
      position: style.position,
      overflow: style.overflow,
      appearance: style.appearance,
      webkitTextSizeAdjust: style.webkitTextSizeAdjust
    };
  });

  expect(metrics.fontSize, `${label} font-size ${metrics.rawFontSize}`).toBeGreaterThanOrEqual(16);
  expect(metrics.transform, `${label} transform`).toBe("none");
  expect(metrics.zoom, `${label} zoom`).toBe("1");
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docClientWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    viewport: document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
    overflowing: Array.from(document.body.querySelectorAll("*")).filter((element) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (style.overflowX === "auto" || style.overflowX === "scroll") return false;
      }
      return true;
    }).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
        left: rect.left,
        right: rect.right,
        width: rect.width
      };
    }).filter((item) => item.width > 1 && (item.left < -1 || item.right > window.innerWidth + 1)).slice(0, 5)
  }));

  expect(metrics.docScrollWidth, `${label} document width ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.docClientWidth + 1);
  expect(metrics.bodyScrollWidth, `${label} body width ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
  expect(metrics.overflowing, `${label} overflowing elements`).toHaveLength(0);
}

async function assertViewportPolicy(page: Page) {
  const viewport = await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "");
  expect(viewport).toContain("width=device-width");
  expect(viewport).toContain("initial-scale=1");
  expect(viewport).toContain("viewport-fit=cover");
  expect(viewport).not.toMatch(/maximum-scale\s*=\s*1(?:\.0)?/i);
  expect(viewport).not.toMatch(/user-scalable\s*=\s*no/i);
}

function contentType(filePath: string) {
  switch (extname(filePath)) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "application/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".ico": return "image/x-icon";
    default: return "application/octet-stream";
  }
}

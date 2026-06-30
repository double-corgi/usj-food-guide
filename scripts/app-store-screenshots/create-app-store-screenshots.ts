import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import net from "node:net";
import sharp from "sharp";

type CdpMessage = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

type CapturedScreen = {
  key: string;
  path: string;
  scrollText?: string;
  scrollY?: number;
  afterScrollScript?: string;
};

type Slide = {
  filename: string;
  title: string;
  subtitle: string;
  screenKeys: string[];
  accent: string;
  secondary: string;
  motif: "cover" | "spark" | "search" | "detail" | "check" | "album" | "map" | "shop" | "season" | "summary";
  footnote?: string;
  icon?: boolean;
  layout?: "single" | "triple";
};

const baseUrl = process.env.APP_STORE_SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const outputDir = resolve("output/app-store-screenshots/ja");
const previewDir = resolve("output/app-store-screenshots/preview");
const appIconPath = resolve("assets/branding/unicolle-app-icon-1024.png");
const chromePath = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const phoneViewport = { width: 430, height: 932, deviceScaleFactor: 3 };
const slideViewport = { width: 1290, height: 2796, deviceScaleFactor: 1 };

const eatenFoodIds = [
  "food-62sv4l",
  "food-u0o9uo",
  "food-cygfys",
  "food-15srg5l",
  "food-up3lba",
  "food-1reufss",
  "food-2qri4c",
  "food-1dm0ouy",
  "food-1m8i41b",
  "food-1k9ohlg",
  "food-c4k9tn",
  "food-17k66nk",
  "food-16q65hw",
  "food-1efoz95",
  "food-1hhn874",
  "food-ehewed",
  "food-1f1v45i",
  "food-ajq9zg",
  "food-dn0p3s",
  "food-rvos7a",
  "food-hyfchi",
  "food-1ulknep",
  "food-1qzo3v2",
  "food-7yyri",
  "food-14hntqo",
  "food-19tglum",
  "food-1x0ir52",
  "food-yhtmyt",
  "food-alnomv",
  "food-9s2577"
];

const eatenLogs = eatenFoodIds.map((foodId, index) => ({
  foodId,
  status: "eaten",
  eatenAt: new Date(Date.UTC(2026, 5, 28 - Math.floor(index / 3), 10 + (index % 7), (index * 7) % 60)).toISOString(),
  eatenCount: 1,
  spentAmount: [2600, 3500, 900, 600, 2500, 1800][index % 6],
  rating: 3 + (index % 3),
  ...(index === 1 ? { memo: "家族で食べたお気に入り" } : {})
}));

const localStorageSeed: Record<string, unknown> = {
  "uniba-food-logs-v1": eatenLogs,
  "uniba-recent-searches-v1": ["チュリトス", "バーガー", "ポップコーン"],
  "uniba-recent-foods-v1": [
    { foodId: "food-u0o9uo", viewedAt: "2026-06-28T10:30:00.000Z" },
    { foodId: "food-62sv4l", viewedAt: "2026-06-28T10:20:00.000Z" },
    { foodId: "food-rvos7a", viewedAt: "2026-06-27T09:00:00.000Z" }
  ],
  "uniba-next-want-foods-v1": ["food-rvos7a", "food-cygfys"]
};

const screens: CapturedScreen[] = [
  { key: "home", path: "/" },
  {
    key: "recent",
    path: "/",
    scrollText: "最近追加・更新したフード",
    afterScrollScript: `
      (() => {
        const heading = Array.from(document.querySelectorAll("h1,h2,h3"))
          .find((el) => (el.textContent || "").includes("最近追加・更新したフード"));
        const section = heading?.closest("section");
        const rail = section?.querySelector("[class*='overflow-x-auto']");
        if (rail) rail.scrollLeft = 245;
      })();
    `
  },
  { key: "search", path: "/foods?category=burger&sale=active" },
  { key: "detail", path: "/foods/food-u0o9uo" },
  { key: "eatenAction", path: "/foods/food-u0o9uo", scrollY: 370 },
  { key: "eaten", path: "/eaten" },
  { key: "areas", path: "/areas" },
  { key: "shops", path: "/stores" },
  { key: "limited", path: "/foods?sale=limited&sort=new" }
];

const slides: Slide[] = [
  {
    filename: "01_home.png",
    title: "パークフードを、\nひとつの図鑑に。",
    subtitle: "気になるメニュー探しから、\n食べた記録までまとめて楽しめます。",
    screenKeys: ["home"],
    accent: "#00856f",
    secondary: "#f6b73c",
    motif: "cover",
    icon: true
  },
  {
    filename: "02_recent_foods.png",
    title: "新しいフードを\nすぐにチェック",
    subtitle: "最近追加・更新されたメニューを\n新しい順で確認できます。",
    screenKeys: ["recent"],
    accent: "#0f766e",
    secondary: "#f7b267",
    motif: "spark"
  },
  {
    filename: "03_search.png",
    title: "食べたい一品を\nかんたん検索",
    subtitle: "名前・カテゴリ・エリアから、\n気になるフードを絞り込めます。",
    screenKeys: ["search"],
    accent: "#2563eb",
    secondary: "#00a676",
    motif: "search"
  },
  {
    filename: "04_food_detail.png",
    title: "知りたい情報を\nひと目で確認",
    subtitle: "写真・価格・販売場所などを\n見やすくまとめています。",
    screenKeys: ["detail"],
    accent: "#10233f",
    secondary: "#f6b73c",
    motif: "detail"
  },
  {
    filename: "05_eaten_action.png",
    title: "食べたら、\nワンタップで記録",
    subtitle: "その場ですぐに記録して、\n自分だけのフード履歴を作れます。",
    screenKeys: ["eatenAction"],
    accent: "#00856f",
    secondary: "#38bdf8",
    motif: "check"
  },
  {
    filename: "06_eaten_collection.png",
    title: "食べたフードが\nコレクションに",
    subtitle: "記録したメニューを一覧で見返し、\nフードめぐりの思い出を残せます。",
    screenKeys: ["eaten"],
    accent: "#7c3aed",
    secondary: "#f6b73c",
    motif: "album"
  },
  {
    filename: "07_areas.png",
    title: "エリアから\nまとめて探せる",
    subtitle: "今いる場所や行きたいエリアから、\n販売中のフードを確認できます。",
    screenKeys: ["areas"],
    accent: "#0284c7",
    secondary: "#00a676",
    motif: "map"
  },
  {
    filename: "08_shops.png",
    title: "販売店舗から\nフードをチェック",
    subtitle: "お店ごとのメニューを確認して、\n現地で迷いにくくなります。",
    screenKeys: ["shops"],
    accent: "#b45309",
    secondary: "#00856f",
    motif: "shop"
  },
  {
    filename: "09_limited_foods.png",
    title: "期間限定フードも\n見逃さない",
    subtitle: "季節のメニューや限定フードも、\nひとつの場所で確認できます。",
    screenKeys: ["limited"],
    accent: "#be123c",
    secondary: "#f6b73c",
    motif: "season"
  },
  {
    filename: "10_summary.png",
    title: "フードめぐりを、\nもっと楽しく。",
    subtitle: "UNICOLLEは、パークフードを探して\n記録できる非公式アプリです。",
    footnote: "このアプリはユニバーサル・スタジオ・ジャパンの\n公式アプリではありません。",
    screenKeys: ["home", "search", "eaten"],
    accent: "#10233f",
    secondary: "#f6b73c",
    motif: "summary",
    icon: true,
    layout: "triple"
  }
];

async function findFreePort() {
  return await new Promise<number>((resolvePort, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) resolvePort(address.port);
        else reject(new Error("Could not allocate a local port"));
      });
    });
  });
}

async function waitForJson<T>(url: string, attempts = 90): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return (await response.json()) as T;
    } catch {
      // Chrome may still be starting.
    }
    await delay(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(url: string) {
  const socket = new WebSocket(url);
  let nextId = 1;
  const pending = new Map<number, { resolve: (value: CdpMessage) => void; reject: (error: Error) => void }>();
  const listeners = new Map<string, Array<(params: unknown) => void>>();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as CdpMessage;
    if (message.id && pending.has(message.id)) {
      const deferred = pending.get(message.id)!;
      pending.delete(message.id);
      if (message.error) deferred.reject(new Error(JSON.stringify(message.error)));
      else deferred.resolve(message);
      return;
    }
    if (message.method) {
      for (const listener of listeners.get(message.method) ?? []) listener(message.params);
    }
  });

  const ready = new Promise<void>((resolveReady, reject) => {
    socket.addEventListener("open", () => resolveReady(), { once: true });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
  });

  return {
    ready,
    send(method: string, params?: object) {
      const id = nextId++;
      const payload = JSON.stringify({ id, method, params });
      return new Promise<CdpMessage>((resolveMessage, reject) => {
        pending.set(id, { resolve: resolveMessage, reject });
        socket.send(payload);
      });
    },
    once(method: string) {
      return new Promise<unknown>((resolveOnce) => {
        const current = listeners.get(method) ?? [];
        const listener = (params: unknown) => {
          listeners.set(method, current.filter((item) => item !== listener));
          resolveOnce(params);
        };
        listeners.set(method, [...current, listener]);
      });
    },
    close() {
      socket.close();
    }
  };
}

function delay(ms: number) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function startChrome() {
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome was not found at ${chromePath}. Set CHROME_PATH to override.`);
  }
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "unicole-appstore-chrome-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--font-render-hinting=none",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });
  await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
  return { chrome, port };
}

async function withPage<T>(
  port: number,
  url: string,
  viewport: { width: number; height: number; deviceScaleFactor: number },
  run: (cdp: ReturnType<typeof connect>) => Promise<T>
): Promise<T> {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  const targetInfo = (await target.json()) as { id: string; webSocketDebuggerUrl: string };
  const cdp = connect(targetInfo.webSocketDebuggerUrl);
  await cdp.ready;
  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: viewport.width <= 430
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: viewport.width <= 430 });
    return await run(cdp);
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${targetInfo.id}`).catch(() => undefined);
  }
}

function dataUrl(filePath: string, mime = "image/png") {
  const data = readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
}

function appStorageScript() {
  const entries = Object.entries(localStorageSeed).map(([key, value]) => [key, JSON.stringify(value)]);
  return `
    (() => {
      const entries = ${JSON.stringify(entries)};
      for (const [key, value] of entries) {
        try { localStorage.setItem(key, value); } catch {}
      }
      try { localStorage.setItem("unicole-locale", "ja"); } catch {}
      const style = document.createElement("style");
      style.textContent = [
        "[data-nextjs-toast], nextjs-portal { display: none !important; }",
        "[data-ad-placement] { display: none !important; }",
        "body { -webkit-font-smoothing: antialiased; }"
      ].join("\\n");
      document.documentElement.appendChild(style);
    })();
  `;
}

async function captureAppScreen(port: number, screen: CapturedScreen, tempDir: string) {
  const output = join(tempDir, `${screen.key}.png`);
  await withPage(port, `${baseUrl}${screen.path}`, phoneViewport, async (cdp) => {
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: appStorageScript() });
    const load = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: `${baseUrl}${screen.path}` });
    await load;
    await delay(2600);
    if (screen.scrollText) {
      await cdp.send("Runtime.evaluate", {
        expression: `
          (() => {
            const text = ${JSON.stringify(screen.scrollText)};
            const candidates = Array.from(document.querySelectorAll("h1,h2,h3,p,span,section"));
            const target = candidates.find((el) => (el.textContent || "").includes(text));
            if (target) {
              target.scrollIntoView({ block: "start", inline: "nearest" });
              window.scrollBy(0, -16);
            }
          })();
        `
      });
      await delay(900);
    }
    if (screen.scrollY) {
      await cdp.send("Runtime.evaluate", {
        expression: `window.scrollTo({ top: ${screen.scrollY}, behavior: "instant" });`
      });
      await delay(700);
    }
    if (screen.afterScrollScript) {
      await cdp.send("Runtime.evaluate", { expression: screen.afterScrollScript });
      await delay(700);
    }
    await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          document.querySelectorAll("[data-nextjs-toast], nextjs-portal, [data-ad-placement]").forEach((el) => el.remove());
        })();
      `
    });
    const image = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    const data = (image.result as { data: string }).data;
    writeFileSync(output, Buffer.from(data, "base64"));
  });
  return output;
}

function ornamentalCss(slide: Slide) {
  const color = slide.accent;
  const secondary = slide.secondary;
  const base = `
    .orb-a { position:absolute; width:560px; height:560px; border-radius:50%; right:-170px; top:260px; background:${secondary}; opacity:.12; }
    .orb-b { position:absolute; width:420px; height:420px; border-radius:50%; left:-140px; bottom:360px; background:${color}; opacity:.10; }
    .line-a { position:absolute; width:650px; height:2px; right:80px; top:690px; background:linear-gradient(90deg, transparent, ${secondary}, transparent); opacity:.55; transform:rotate(-8deg); }
  `;
  if (slide.motif === "map") {
    return `${base}.motif:before{content:"";position:absolute;inset:720px 90px auto auto;width:280px;height:160px;border:3px solid ${color};border-radius:44px;opacity:.12;transform:rotate(-9deg)}.pin{position:absolute;border-radius:999px;background:${secondary};opacity:.45}`;
  }
  if (slide.motif === "search") {
    return `${base}.motif:before{content:"";position:absolute;right:120px;top:650px;width:150px;height:150px;border:16px solid ${color};border-radius:50%;opacity:.14}.motif:after{content:"";position:absolute;right:82px;top:790px;width:110px;height:17px;background:${color};border-radius:99px;opacity:.14;transform:rotate(43deg)}`;
  }
  if (slide.motif === "check") {
    return `${base}.motif:before{content:"";position:absolute;right:110px;top:680px;width:220px;height:120px;border-left:20px solid ${color};border-bottom:20px solid ${color};opacity:.13;transform:rotate(-45deg);border-radius:12px}`;
  }
  if (slide.motif === "shop") {
    return `${base}.motif:before{content:"";position:absolute;right:90px;top:660px;width:300px;height:170px;border-radius:32px;background:${secondary};opacity:.12}.motif:after{content:"";position:absolute;right:132px;top:620px;width:220px;height:90px;border-radius:90px 90px 0 0;background:${color};opacity:.12}`;
  }
  if (slide.motif === "season") {
    return `${base}.motif:before{content:"";position:absolute;right:90px;top:650px;width:280px;height:280px;border-radius:90px 130px 80px 140px;background:${secondary};opacity:.16;transform:rotate(16deg)}.motif:after{content:"";position:absolute;left:100px;bottom:280px;width:180px;height:180px;border-radius:70px 90px 60px 100px;background:${color};opacity:.12;transform:rotate(-18deg)}`;
  }
  return base;
}

function phoneFrame(imageUrl: string, className = "") {
  return `
    <div class="phone ${className}">
      <div class="speaker"></div>
      <img class="screen" src="${imageUrl}" alt="">
    </div>
  `;
}

function slideHtml(slide: Slide, screenImages: Record<string, string>) {
  const iconMarkup = slide.icon
    ? `<img class="brand-icon" src="${dataUrl(appIconPath)}" alt="">`
    : "";
  const screensMarkup = slide.layout === "triple"
    ? `<div class="triple">
        ${slide.screenKeys.map((key, index) => phoneFrame(screenImages[key], `mini mini-${index}`)).join("")}
      </div>`
    : phoneFrame(screenImages[slide.screenKeys[0]], "main-phone");
  const footnote = slide.footnote ? `<p class="footnote">${escapeHtml(slide.footnote).replace(/\n/g, "<br>")}</p>` : "";
  return `<!doctype html>
    <html lang="ja">
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; width: 1290px; height: 2796px; overflow: hidden; }
        body {
          font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic", "YuGothic", "Meiryo", system-ui, sans-serif;
          color: #10233f;
          background:
            radial-gradient(circle at 88% 12%, rgba(246, 183, 60, .23), transparent 26%),
            radial-gradient(circle at 8% 78%, rgba(0, 133, 111, .16), transparent 24%),
            linear-gradient(180deg, #fffaf5 0%, #f6f8fa 64%, #ffffff 100%);
        }
        .slide { position: relative; width: 1290px; height: 2796px; overflow: hidden; }
        ${ornamentalCss(slide)}
        .grain {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(16,35,63,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,35,63,.03) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: linear-gradient(180deg, transparent, black 12%, black 88%, transparent);
          opacity: .34;
        }
        .header {
          position: absolute;
          left: 88px;
          right: 88px;
          top: 132px;
          z-index: 2;
        }
        .kicker {
          display: inline-flex;
          align-items: center;
          min-height: 46px;
          border-radius: 999px;
          padding: 0 22px;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(16,35,63,.08);
          color: ${slide.accent};
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          box-shadow: 0 10px 30px rgba(16,35,63,.07);
        }
        .title {
          margin: 32px 0 0;
          max-width: 980px;
          font-size: 86px;
          line-height: 1.15;
          font-weight: 900;
          letter-spacing: 0;
          white-space: pre-line;
        }
        .subtitle {
          margin: 30px 0 0;
          max-width: 980px;
          color: #475569;
          font-size: 36px;
          line-height: 1.52;
          font-weight: 700;
          letter-spacing: 0;
          white-space: pre-line;
        }
        .brand-icon {
          position: absolute;
          right: 18px;
          top: 4px;
          width: 128px;
          height: 128px;
          border-radius: 30px;
          box-shadow: 0 18px 42px rgba(16,35,63,.18);
        }
        .phone {
          position: absolute;
          overflow: hidden;
          background: #101827;
          border: 13px solid #111827;
          box-shadow: 0 42px 100px rgba(16,35,63,.28), 0 0 0 2px rgba(255,255,255,.84) inset;
        }
        .main-phone {
          left: 215px;
          bottom: 144px;
          width: 860px;
          height: 1864px;
          border-radius: 88px;
        }
        .screen {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 70px;
          background: #fffaf5;
        }
        .speaker {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          width: 116px;
          height: 22px;
          border-radius: 999px;
          background: rgba(17,24,39,.78);
          box-shadow: 0 0 0 5px rgba(255,255,255,.08);
        }
        .triple {
          position: absolute;
          left: 76px;
          right: 76px;
          bottom: 250px;
          height: 1600px;
          z-index: 3;
        }
        .mini {
          width: 520px;
          height: 1127px;
          border-width: 9px;
          border-radius: 64px;
        }
        .mini .screen { border-radius: 50px; }
        .mini .speaker { width: 80px; height: 15px; top: 14px; }
        .mini-0 { left: 0; bottom: 130px; transform: rotate(-6deg); }
        .mini-1 { left: 340px; bottom: 260px; z-index: 5; transform: rotate(2deg); }
        .mini-2 { right: 0; bottom: 80px; transform: rotate(6deg); }
        .footnote {
          position: absolute;
          left: 100px;
          right: 100px;
          bottom: 98px;
          margin: 0;
          color: #475569;
          font-size: 28px;
          line-height: 1.55;
          font-weight: 800;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <main class="slide">
        <div class="grain"></div>
        <div class="orb-a"></div>
        <div class="orb-b"></div>
        <div class="line-a"></div>
        <div class="motif"></div>
        ${pinMarkup(slide.motif)}
        <header class="header">
          <div class="kicker">UNICOLLE / 非公式フード図鑑</div>
          ${iconMarkup}
          <h1 class="title">${escapeHtml(slide.title)}</h1>
          <p class="subtitle">${escapeHtml(slide.subtitle)}</p>
        </header>
        ${screensMarkup}
        ${footnote}
      </main>
    </body>
    </html>`;
}

function pinMarkup(motif: Slide["motif"]) {
  if (motif !== "map") return "";
  return `
    <span class="pin" style="right:225px;top:710px;width:32px;height:32px"></span>
    <span class="pin" style="right:330px;top:795px;width:20px;height:20px"></span>
    <span class="pin" style="right:160px;top:835px;width:24px;height:24px"></span>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function renderSlide(port: number, slide: Slide, screenImages: Record<string, string>, tempDir: string) {
  const htmlPath = join(tempDir, `${basename(slide.filename, ".png")}.html`);
  const outputPath = join(outputDir, slide.filename);
  writeFileSync(htmlPath, slideHtml(slide, screenImages));
  await withPage(port, `file://${htmlPath}`, slideViewport, async (cdp) => {
    const load = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: `file://${htmlPath}` });
    await load;
    await delay(600);
    const image = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    const data = (image.result as { data: string }).data;
    const raw = Buffer.from(data, "base64");
    await sharp(raw)
      .flatten({ background: "#fffaf5" })
      .removeAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
  });
  return outputPath;
}

async function createContactSheet(paths: string[]) {
  const thumbWidth = 258;
  const thumbHeight = 559;
  const columns = 5;
  const rows = 2;
  const gap = 24;
  const labelHeight = 38;
  const width = columns * thumbWidth + (columns + 1) * gap;
  const height = rows * (thumbHeight + labelHeight) + (rows + 1) * gap;
  const composites: sharp.OverlayOptions[] = [];
  for (let index = 0; index < paths.length; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = gap + column * (thumbWidth + gap);
    const top = gap + row * (thumbHeight + labelHeight + gap);
    const thumb = await sharp(paths[index]).resize(thumbWidth, thumbHeight).png().toBuffer();
    const labelSvg = Buffer.from(`
      <svg width="${thumbWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="50%" y="25" text-anchor="middle" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="18" font-weight="700" fill="#10233f">${basename(paths[index])}</text>
      </svg>
    `);
    composites.push({ input: thumb, left, top });
    composites.push({ input: labelSvg, left, top: top + thumbHeight });
  }
  const contactPath = join(previewDir, "contact-sheet.png");
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#f6f8fa"
    }
  }).composite(composites).png({ compressionLevel: 9 }).toFile(contactPath);
  return contactPath;
}

async function verifyOutputs(paths: string[]) {
  for (const path of paths) {
    const meta = await sharp(path).metadata();
    if (meta.width !== 1290 || meta.height !== 2796) {
      throw new Error(`${path} has invalid dimensions ${meta.width}x${meta.height}`);
    }
    if (meta.format !== "png") throw new Error(`${path} is not a PNG`);
    if (meta.hasAlpha) throw new Error(`${path} has an alpha channel`);
    if (meta.space && meta.space !== "srgb") throw new Error(`${path} is not RGB/sRGB: ${meta.space}`);
  }
}

async function main() {
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(previewDir, { recursive: true });
  if (!existsSync(appIconPath)) throw new Error(`Missing app icon: ${appIconPath}`);

  const tempDir = mkdtempSync(join(tmpdir(), "unicole-appstore-screenshots-"));
  const { chrome, port } = await startChrome();
  const outputPaths: string[] = [];
  try {
    const screenImages: Record<string, string> = {};
    for (const screen of screens) {
      const path = await captureAppScreen(port, screen, tempDir);
      screenImages[screen.key] = dataUrl(path);
      console.log(`captured ${screen.key}: ${screen.path}`);
    }
    for (const slide of slides) {
      const path = await renderSlide(port, slide, screenImages, tempDir);
      outputPaths.push(path);
      console.log(`rendered ${path}`);
    }
  } finally {
    stopChrome(chrome);
  }
  await verifyOutputs(outputPaths);
  const contactPath = await createContactSheet(outputPaths);
  console.log(`contact sheet: ${contactPath}`);
  console.log("verified 10 App Store screenshots: 1290x2796 PNG sRGB without alpha");
}

function stopChrome(chrome: ChildProcess) {
  if (!chrome.killed) chrome.kill();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

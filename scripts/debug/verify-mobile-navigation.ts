import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";

type CdpMessage = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

type RuntimeResult<T> = {
  result: {
    result: {
      type: string;
      value?: T;
      description?: string;
    };
    exceptionDetails?: unknown;
  };
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const viewport = { width: 390, height: 1200, deviceScaleFactor: 3 };

async function findFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) resolve(address.port);
        else reject(new Error("Could not allocate a local port"));
      });
    });
  });
}

async function waitForJson<T>(url: string, attempts = 80): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return (await response.json()) as T;
    } catch {
      // Chrome may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
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

  const ready = new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
  });

  return {
    ready,
    send(method: string, params?: object) {
      const id = nextId++;
      const payload = JSON.stringify({ id, method, params });
      return new Promise<CdpMessage>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(payload);
      });
    },
    once(method: string) {
      return new Promise<unknown>((resolve) => {
        const current = listeners.get(method) ?? [];
        const listener = (params: unknown) => {
          listeners.set(method, current.filter((item) => item !== listener));
          resolve(params);
        };
        listeners.set(method, [...current, listener]);
      });
    },
    close() {
      socket.close();
    }
  };
}

async function evaluate<T>(cdp: ReturnType<typeof connect>, expression: string) {
  const message = (await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  })) as RuntimeResult<T>;
  if (message.result.exceptionDetails) {
    throw new Error(`Runtime exception: ${JSON.stringify(message.result.exceptionDetails)}`);
  }
  return message.result.result.value as T;
}

async function navigate(cdp: ReturnType<typeof connect>, path: string) {
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
  await load;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function assertPageHealthy(cdp: ReturnType<typeof connect>, label: string, minCards = 0) {
  let state = { url: "", textLength: 0, cardCount: 0, blank: true };
  for (let attempt = 0; attempt < 20; attempt += 1) {
    state = await evaluate<{ url: string; textLength: number; cardCount: number; blank: boolean }>(
      cdp,
      `(() => {
        const text = document.body?.innerText?.trim() ?? "";
        return {
          url: location.href,
          textLength: text.length,
          cardCount: document.querySelectorAll('article').length,
          blank: text.length < 80
        };
      })()`
    );
    if (!state.blank && state.cardCount >= minCards) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (state.blank) throw new Error(`${label}: page looked blank at ${state.url}`);
  if (state.cardCount < minCards) throw new Error(`${label}: expected at least ${minCards} cards at ${state.url}, got ${state.cardCount}`);
  return state;
}

async function clickText(cdp: ReturnType<typeof connect>, text: string) {
  const clicked = await evaluate<boolean>(
    cdp,
    `(() => {
      const items = [...document.querySelectorAll('button, a')];
      const target = items.find((item) => item.textContent && item.textContent.trim() === ${JSON.stringify(text)})
        ?? items.find((item) => item.textContent && item.textContent.trim().includes(${JSON.stringify(text)}));
      if (!target) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`Could not click text: ${text}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function clickHref(cdp: ReturnType<typeof connect>, href: string) {
  const clicked = await evaluate<boolean>(
    cdp,
    `(() => {
      const targets = [...document.querySelectorAll('a')].filter((item) => item.getAttribute('href') === ${JSON.stringify(href)});
      const target = targets[targets.length - 1];
      if (!target) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`Could not click href: ${href}`);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const currentUrl = await evaluate<string>(cdp, "location.href");
    if (currentUrl.includes(href)) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function clickHomeArea(cdp: ReturnType<typeof connect>, label: string) {
  const clicked = await evaluate<boolean>(
    cdp,
    `(() => {
      const items = [...document.querySelectorAll('[data-home-area-card]')];
      const target = items.find((item) => item.textContent && item.textContent.trim().includes(${JSON.stringify(label)}));
      if (!target) return false;
      target.scrollIntoView({ block: 'center', inline: 'center' });
      target.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`Could not click home area: ${label}`);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const currentUrl = await evaluate<string>(cdp, "location.href");
    if (currentUrl.includes("/areas")) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function verify() {
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-nav-chrome-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  const results: Array<{ step: string; ok: boolean; detail: string }> = [];

  try {
    await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/`)}`, { method: "PUT" });
    const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
    const cdp = connect(targetInfo.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: true
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });

    await navigate(cdp, "/");
    let state = await assertPageHealthy(cdp, "home", 1);
    results.push({ step: "home", ok: true, detail: `${state.cardCount} cards / ${state.url}` });

    await clickText(cdp, "すべて");
    state = await assertPageHealthy(cdp, "home category all", 1);
    results.push({
      step: "home category all",
      ok: state.url.includes("/foods") && state.cardCount > 0,
      detail: `${state.cardCount} cards / ${state.url}`,
    });

    for (const category of [
      ["チュリトス", "churro"],
      ["ポップコーン", "popcorn"],
      ["ドリンク", "drink"],
      ["ピザ", "pizza"],
      ["バーガー", "burger"],
      ["スイーツ", "sweets"],
      ["キッズ", "kids"],
    ] as const) {
      await navigate(cdp, "/");
      await clickHref(cdp, `/foods?category=${category[1]}`);
      state = await assertPageHealthy(cdp, `home category ${category[1]}`, 1);
      results.push({
        step: `home category ${category[1]}`,
        ok: state.url.includes(`/foods?category=${category[1]}`) && state.cardCount > 0,
        detail: `${state.cardCount} cards / ${state.url}`,
      });
    }

    await navigate(cdp, "/");
    await clickHomeArea(cdp, "ニンテンドー");
    state = await assertPageHealthy(cdp, "home area Nintendo");
    results.push({ step: "home area Nintendo", ok: state.url.includes("/areas/") || state.url.includes("/areas"), detail: state.url });

    await clickHref(cdp, "/foods");
    state = await assertPageHealthy(cdp, "bottom nav search", 1);
    results.push({ step: "bottom nav search", ok: state.url.includes("/foods"), detail: state.url });

    await clickHref(cdp, "/eaten");
    state = await assertPageHealthy(cdp, "bottom nav eaten");
    results.push({ step: "bottom nav eaten", ok: state.url.includes("/eaten"), detail: state.url });

    await clickHref(cdp, "/areas");
    state = await assertPageHealthy(cdp, "bottom nav areas");
    const areaCheck = await evaluate<{ hasOther: boolean; uniqueAreaHeadings: number }>(
      cdp,
      `(() => {
        const text = document.body.innerText;
        const allowed = [
          'スーパー・ニンテンドー・ワールド',
          'ウィザーディング・ワールド・オブ・ハリー・ポッター',
          'ミニオン・パーク',
          'ユニバーサル・ワンダーランド',
          'ハリウッド・エリア',
          'ニューヨーク・エリア',
          'サンフランシスコ・エリア',
          'ジュラシック・パーク',
          'アミティ・ビレッジ',
          'ウォーターワールド'
        ];
        return {
          hasOther: text.includes('その他'),
          uniqueAreaHeadings: allowed.filter((name) => text.includes(name)).length
        };
      })()`
    );
    if (areaCheck.hasOther) throw new Error("areas page still shows その他");
    results.push({ step: "bottom nav areas", ok: state.url.includes("/areas"), detail: `${areaCheck.uniqueAreaHeadings} allowed areas visible` });

    await clickHref(cdp, "/complete");
    state = await assertPageHealthy(cdp, "bottom nav complete");
    results.push({ step: "bottom nav complete", ok: state.url.includes("/complete"), detail: state.url });

    cdp.close();
  } finally {
    chrome.kill();
  }

  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({ baseUrl, results, failed }, null, 2));
  if (failed.length > 0) process.exit(1);
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});

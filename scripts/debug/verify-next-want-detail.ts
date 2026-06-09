import { spawn } from "node:child_process";
import net from "node:net";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CdpMessage = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const detailPath = process.env.VERIFY_FOOD_PATH ?? "/foods/food-62sv4l";
const wantedStorageKey = "uniba-next-want-foods-v1";
const wantedFoodId = process.env.VERIFY_WANTED_FOOD_ID ?? "food-62sv4l";

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

async function navigate(cdp: ReturnType<typeof connect>, path: string) {
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
  await load;
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

async function evaluate<T>(cdp: ReturnType<typeof connect>, expression: string) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  const result = response.result as { result?: { value?: T } };
  return result.result?.value as T;
}

async function run() {
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-chrome-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}${detailPath}`)}`, { method: "PUT" });
    const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
    const cdp = connect(targetInfo.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 1200,
      deviceScaleFactor: 3,
      mobile: true
    });

    await navigate(cdp, detailPath);
    await evaluate(cdp, `localStorage.setItem(${JSON.stringify(wantedStorageKey)}, "[]")`);
    await navigate(cdp, detailPath);
    const emptyDetail = await evaluate<Record<string, unknown>>(cdp, `(() => {
      const text = document.body.innerText;
      const emptyAdLabel = ["広告", "枠"].join("");
      return {
        hasEmptyAdPlaceholder: text.includes(emptyAdLabel),
        hasEmptyWantMessage: text.includes("次回食べたい商品はまだありません"),
        hasWantButton: text.includes("次回食べたい"),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        clippedImportantText: Array.from(document.querySelectorAll("a,button,h1,h2,h3,p,span"))
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const className = typeof el.className === "string" ? el.className : "";
            if (style.webkitLineClamp && style.webkitLineClamp !== "none") return false;
            if (/line-clamp-|truncate/.test(className)) return false;
            if (el.closest(".overflow-x-auto")) return false;
            return el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 0;
          })
          .map((el) => (el.textContent || "").trim().slice(0, 80))
      };
    })()`);

    await evaluate(cdp, `localStorage.setItem(${JSON.stringify(wantedStorageKey)}, JSON.stringify([${JSON.stringify(wantedFoodId)}]))`);
    await navigate(cdp, detailPath);
    const filledDetail = await evaluate<Record<string, unknown>>(cdp, `(() => {
      const text = document.body.innerText;
      const emptyAdLabel = ["広告", "枠"].join("");
      return {
        hasWantedState: text.includes("次回候補"),
        hasEmptyAdPlaceholder: text.includes(emptyAdLabel),
        hasEmptyWantMessage: text.includes("次回食べたい商品はまだありません"),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        clippedImportantText: Array.from(document.querySelectorAll("a,button,h1,h2,h3,p,span"))
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const className = typeof el.className === "string" ? el.className : "";
            if (style.webkitLineClamp && style.webkitLineClamp !== "none") return false;
            if (/line-clamp-|truncate/.test(className)) return false;
            if (el.closest(".overflow-x-auto")) return false;
            return el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 0;
          })
          .map((el) => (el.textContent || "").trim().slice(0, 80))
      };
    })()`);

    await navigate(cdp, "/eaten");
    const filledEaten = await evaluate<Record<string, unknown>>(cdp, `(() => {
      const text = document.body.innerText;
      return {
        hasWantTab: text.includes("次回食べたい"),
        hasWantedFood: text.includes("ターキーレッグ") || text.includes("フード"),
        hasEmptyWantMessage: text.includes("次回食べたい商品はまだありません"),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    })()`);

    await evaluate(cdp, `localStorage.setItem(${JSON.stringify(wantedStorageKey)}, "[]")`);
    await navigate(cdp, "/eaten");
    const emptyEaten = await evaluate<Record<string, unknown>>(cdp, `(() => {
      const text = document.body.innerText;
      return {
        hasWantTab: text.includes("次回食べたい"),
        hasEmptyWantMessage: text.includes("次回食べたい商品はまだありません"),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    })()`);

    console.log(JSON.stringify({ emptyDetail, filledDetail, filledEaten, emptyEaten }, null, 2));

    const failures = [
      emptyDetail.hasEmptyAd,
      emptyDetail.hasEmptyWantMessage,
      emptyDetail.overflow,
      Array.isArray(emptyDetail.clippedImportantText) && emptyDetail.clippedImportantText.length > 0,
      filledDetail.hasEmptyAd,
      filledDetail.hasEmptyWantMessage,
      filledDetail.overflow,
      Array.isArray(filledDetail.clippedImportantText) && filledDetail.clippedImportantText.length > 0,
      !filledDetail.hasWantedState,
      !filledEaten.hasWantTab,
      filledEaten.hasEmptyWantMessage,
      filledEaten.overflow,
      emptyEaten.hasWantTab,
      emptyEaten.hasEmptyWantMessage,
      emptyEaten.overflow
    ];
    if (failures.some(Boolean)) process.exitCode = 1;
    cdp.close();
  } finally {
    chrome.kill();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

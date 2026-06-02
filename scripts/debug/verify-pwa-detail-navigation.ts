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
      value?: T;
    };
    exceptionDetails?: unknown;
  };
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

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

async function waitForJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
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

  return {
    ready: new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
    }),
    send(method: string, params?: object) {
      const id = nextId++;
      return new Promise<CdpMessage>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
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
  if (message.result.exceptionDetails) throw new Error(`Runtime exception: ${JSON.stringify(message.result.exceptionDetails)}`);
  return message.result.result.value as T;
}

async function navigate(cdp: ReturnType<typeof connect>, url: string) {
  const load = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await load;
  await new Promise((resolve) => setTimeout(resolve, 1800));
}

async function main() {
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-pwa-chrome-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/`)}`, { method: "PUT" });
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
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });

    await navigate(cdp, `${baseUrl}/`);
    const swState = await evaluate<{ registrations: number; caches: number; controller: boolean }>(
      cdp,
      `new Promise((resolve) => setTimeout(async () => {
        const registrations = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
        const cacheKeys = window.caches ? await caches.keys() : [];
        resolve({ registrations: registrations.length, caches: cacheKeys.length, controller: Boolean(navigator.serviceWorker?.controller) });
      }, 1200))`
    );

    const detailHref = await evaluate<string>(
      cdp,
      `(() => {
        const link = [...document.querySelectorAll('a[href^="/foods/"]')].find((item) => item.getAttribute('href') !== '/foods');
        return link ? link.getAttribute('href') : '';
      })()`
    );
    if (!detailHref) throw new Error("Could not find a food detail link on home");

    await navigate(cdp, `${baseUrl}${detailHref}`);
    const detailState = await evaluate<{ url: string; text: string; imageCount: number; offline: boolean; blank: boolean }>(
      cdp,
      `(() => {
        const text = document.body.innerText;
        return {
          url: location.href,
          text,
          imageCount: document.querySelectorAll('img').length,
          offline: text.includes('オフラインです') || text.includes('offline'),
          blank: text.trim().length < 80
        };
      })()`
    );

    const ok = swState.registrations === 0 && !swState.controller && detailState.url.includes("/foods/") && !detailState.offline && !detailState.blank && detailState.imageCount > 0;
    console.log(JSON.stringify({ baseUrl, serviceWorker: swState, detail: { href: detailHref, url: detailState.url, imageCount: detailState.imageCount, offline: detailState.offline, blank: detailState.blank }, ok }, null, 2));
    cdp.close();
    if (!ok) process.exitCode = 1;
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

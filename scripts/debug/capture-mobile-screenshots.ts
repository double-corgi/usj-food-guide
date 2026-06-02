import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
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

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const viewportWidth = Number(process.env.SCREENSHOT_VIEWPORT_WIDTH ?? 390);
const viewportSuffix = process.env.SCREENSHOT_SUFFIX ?? `iphone-${viewportWidth}`;
const viewport = { width: viewportWidth, height: 1200, deviceScaleFactor: 3 };
const shots = [
  { path: "/", output: `screenshots/home-${viewportSuffix}.png` },
  { path: "/foods", output: `screenshots/foods-${viewportSuffix}.png` },
  { path: "/eaten", output: `screenshots/eaten-${viewportSuffix}.png` },
  { path: "/areas", output: `screenshots/areas-${viewportSuffix}.png` },
  { path: "/complete", output: `screenshots/complete-${viewportSuffix}.png` },
  { path: "/foods/food-62sv4l", output: `screenshots/food-detail-${viewportSuffix}.png` },
  { path: "/request", output: `screenshots/request-${viewportSuffix}.png` },
  { path: "/admin/prices", output: `screenshots/admin-prices-${viewportSuffix}.png` }
];

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

async function capture() {
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
    for (const shot of shots) {
      const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}${shot.path}`)}`, { method: "PUT" });
      const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
      const cdp = connect(targetInfo.webSocketDebuggerUrl);
      await cdp.ready;
      await cdp.send("Page.enable");
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
        mobile: true
      });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      const load = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${baseUrl}${shot.path}` });
      await load;
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const image = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false
      });
      const data = (image.result as { data: string }).data;
      writeFileSync(shot.output, Buffer.from(data, "base64"));
      cdp.close();
      console.log(`${shot.output} written`);
    }
  } finally {
    chrome.kill();
  }
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import net from "node:net";

type CdpMessage = {
  id?: number;
  method?: string;
  result?: unknown;
  error?: unknown;
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const iconDir = resolve(process.cwd(), "public", "icons");
const concepts = [
  { source: "app-icon-concept-a-usj-food-guide.svg", output: "app-icon-concept-a-usj-food-guide.png", size: 1024 },
  { source: "app-icon-concept-b-churro-crown.svg", output: "app-icon-concept-b-churro-crown.png", size: 1024 },
  { source: "app-icon-concept-c-conquest-medal.svg", output: "app-icon-concept-c-conquest-medal.png", size: 1024 },
  { source: "app-icon-concept-c-conquest-medal.svg", output: "app-icon-1024.png", size: 1024 },
  { source: "app-icon-concept-c-conquest-medal.svg", output: "app-icon-512.png", size: 512 },
  { source: "app-icon-concept-c-conquest-medal.svg", output: "app-icon-192.png", size: 192 },
  { source: "app-icon-concept-c-conquest-medal.svg", output: "apple-touch-icon.png", size: 180 }
];

async function findFreePort() {
  return await new Promise<number>((resolvePromise, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) resolvePromise(address.port);
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
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connect(url: string) {
  const socket = new WebSocket(url);
  let nextId = 1;
  const pending = new Map<number, { resolve: (value: CdpMessage) => void; reject: (error: Error) => void }>();
  const listeners = new Map<string, Array<() => void>>();

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
      for (const listener of listeners.get(message.method) ?? []) listener();
    }
  });

  const ready = new Promise<void>((resolvePromise, reject) => {
    socket.addEventListener("open", () => resolvePromise(), { once: true });
    socket.addEventListener("error", () => reject(new Error("WebSocket connection failed")), { once: true });
  });

  return {
    ready,
    send(method: string, params?: object) {
      const id = nextId++;
      return new Promise<CdpMessage>((resolvePromise, reject) => {
        pending.set(id, { resolve: resolvePromise, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    once(method: string) {
      return new Promise<void>((resolvePromise) => {
        const current = listeners.get(method) ?? [];
        const listener = () => {
          listeners.set(method, current.filter((item) => item !== listener));
          resolvePromise();
        };
        listeners.set(method, [...current, listener]);
      });
    },
    close() {
      socket.close();
    }
  };
}

function iconHtml(sourcePath: string, size: number) {
  const sourceUrl = pathToFileURL(sourcePath).toString();
  return `<!doctype html><html><head><meta name="viewport" content="width=${size},initial-scale=1"></head><body style="margin:0;background:transparent;overflow:hidden"><img src="${sourceUrl}" style="display:block;width:${size}px;height:${size}px" /></body></html>`;
}

async function renderIcons() {
  if (!existsSync(iconDir)) mkdirSync(iconDir, { recursive: true });
  const port = await findFreePort();
  const profile = join(tmpdir(), `usj-food-icons-${Date.now()}`);
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
    for (const icon of concepts) {
      const sourcePath = join(iconDir, icon.source);
      if (!existsSync(sourcePath)) throw new Error(`Missing SVG source: ${sourcePath}`);
      const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
      const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
      const cdp = connect(targetInfo.webSocketDebuggerUrl);
      await cdp.ready;
      await cdp.send("Page.enable");
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: icon.size,
        height: icon.size,
        deviceScaleFactor: 1,
        mobile: false
      });
      const load = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", {
        url: `data:text/html;charset=utf-8,${encodeURIComponent(iconHtml(sourcePath, icon.size))}`
      });
      await load;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: icon.size, height: icon.size, scale: 1 }
      });
      const data = (screenshot.result as { data: string }).data;
      const outputPath = join(iconDir, icon.output);
      writeFileSync(outputPath, Buffer.from(data, "base64"));
      cdp.close();
      console.log(`${outputPath} written`);
    }
  } finally {
    chrome.kill();
  }
}

renderIcons().catch((error) => {
  console.error(error);
  process.exit(1);
});

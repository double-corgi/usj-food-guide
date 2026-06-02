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

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? "http://localhost:3000";
const widths = (process.env.VERIFY_WIDTHS ?? "390,430").split(",").map((width) => Number(width.trim())).filter(Boolean);
const paths = ["/", "/foods", "/foods/food-62sv4l", "/eaten", "/areas"];

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

async function verify() {
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-layout-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForJson<{ webSocketDebuggerUrl: string }>(`http://127.0.0.1:${port}/json/version`);
    const failures: string[] = [];
    for (const width of widths) {
      for (const path of paths) {
        const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}${path}`)}`, { method: "PUT" });
        const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
        const cdp = connect(targetInfo.webSocketDebuggerUrl);
        await cdp.ready;
        await cdp.send("Page.enable");
        await cdp.send("Runtime.enable");
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width,
          height: 1200,
          deviceScaleFactor: 3,
          mobile: true
        });
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
        const load = cdp.once("Page.loadEventFired");
        await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
        await load;
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const evaluation = await cdp.send("Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => {
            const doc = document.documentElement;
            const body = document.body;
            const horizontalOverflow = Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth;
            const clippedImportantText = Array.from(document.querySelectorAll('a,button,h1,h2,h3,p,span'))
              .filter((el) => {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                const className = typeof el.className === 'string' ? el.className : '';
                if (style.webkitLineClamp && style.webkitLineClamp !== 'none') return false;
                if (/line-clamp-|truncate/.test(className)) return false;
                if (el.closest('.overflow-x-auto')) return false;
                return el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 0;
              })
              .slice(0, 8)
              .map((el) => (el.textContent || '').trim().slice(0, 80));
            return { horizontalOverflow, clippedImportantText };
          })()`
        });
        const result = (evaluation.result as { result: { value: { horizontalOverflow: number; clippedImportantText: string[] } } }).result.value;
        console.log(`${width}px ${path}: overflow=${result.horizontalOverflow}, clipped=${result.clippedImportantText.length}`);
        if (result.horizontalOverflow > 1 || result.clippedImportantText.length > 0) {
          failures.push(`${width}px ${path}: ${JSON.stringify(result)}`);
        }
        cdp.close();
      }
    }
    if (failures.length > 0) {
      console.error(failures.join("\n"));
      process.exit(1);
    }
  } finally {
    chrome.kill();
  }
}

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});

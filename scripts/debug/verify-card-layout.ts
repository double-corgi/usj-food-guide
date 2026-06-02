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

type LayoutReport = {
  viewport: string;
  cardCount: number;
  uniqueCardHeights: number[];
  badRows: Array<{ top: number; cardHeights: number[]; actionTops: number[]; priceTops: number[] }>;
  titleAreaMinHeight: number;
  longNameCards: Array<{ name: string; titleHeight: number; titleScrollHeight: number; priceTop: number; actionTop: number; cardHeight: number }>;
  failures: string[];
};

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.argv[2] ?? process.env.VERIFY_BASE_URL ?? "http://localhost:3000";
const viewports = [
  { label: "iPhone14", width: 390, height: 1200, deviceScaleFactor: 3 },
  { label: "iPhone14ProMax", width: 430, height: 1200, deviceScaleFactor: 3 }
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
  await new Promise((resolve) => setTimeout(resolve, 1800));
}

async function run() {
  const port = await findFreePort();
  const profile = mkdtempSync(join(tmpdir(), "usj-food-layout-chrome-"));
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
    const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/foods`)}`, { method: "PUT" });
    const targetInfo = (await target.json()) as { webSocketDebuggerUrl: string };
    const cdp = connect(targetInfo.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const reports: LayoutReport[] = [];
    for (const viewport of viewports) {
      await cdp.send("Emulation.setDeviceMetricsOverride", { ...viewport, mobile: true });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await navigate(cdp, "/foods?status=all");
      const report = await evaluate<LayoutReport>(
        cdp,
        `(async () => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          for (let i = 0; i < 4; i += 1) {
            const buttons = [...document.querySelectorAll('button')];
            const more = buttons.find((button) => button.textContent?.includes('さらに60件表示'));
            if (!more) break;
            more.scrollIntoView({ block: 'center' });
            more.click();
            await sleep(450);
          }
          window.scrollTo(0, 0);
          await sleep(250);
          const cards = [...document.querySelectorAll('[data-food-card]')].map((card) => {
            const rect = card.getBoundingClientRect();
            const title = card.querySelector('[data-food-card-title]');
            const price = card.querySelector('[data-food-card-price]');
            const actions = card.querySelector('[data-food-card-actions]');
            const titleRect = title?.getBoundingClientRect();
            const priceRect = price?.getBoundingClientRect();
            const actionRect = actions?.getBoundingClientRect();
            return {
              name: card.getAttribute('data-food-name') || '',
              top: Math.round(rect.top + window.scrollY),
              height: Math.round(rect.height),
              titleHeight: Math.round(titleRect?.height || 0),
              titleScrollHeight: Math.round(title?.scrollHeight || 0),
              priceTop: Math.round((priceRect?.top || 0) - rect.top),
              actionTop: Math.round((actionRect?.top || 0) - rect.top)
            };
          });
          const rows = new Map();
          for (const card of cards) {
            const key = String(card.top);
            rows.set(key, [...(rows.get(key) || []), card]);
          }
          const badRows = [...rows.entries()]
            .map(([top, row]) => ({
              top: Number(top),
              cardHeights: [...new Set(row.map((card) => card.height))],
              actionTops: [...new Set(row.map((card) => card.actionTop))],
              priceTops: [...new Set(row.map((card) => card.priceTop))]
            }))
            .filter((row) => row.cardHeights.length > 1 || row.actionTops.length > 1 || row.priceTops.length > 1);
          const longNameCards = [...cards]
            .sort((a, b) => b.name.length - a.name.length)
            .slice(0, 10)
            .map(({ name, titleHeight, titleScrollHeight, priceTop, actionTop, height }) => ({ name, titleHeight, titleScrollHeight, priceTop, actionTop, cardHeight: height }));
          const uniqueCardHeights = [...new Set(cards.map((card) => card.height))];
          const titleAreaMinHeight = Math.min(...cards.map((card) => card.titleHeight));
          const failures = [];
          if (cards.length < 200) failures.push('card-count-under-200');
          if (uniqueCardHeights.length > 1) failures.push('card-height-not-unified');
          if (badRows.length > 0) failures.push('row-alignment-mismatch');
          if (titleAreaMinHeight < 56) failures.push('title-area-under-3-lines');
          if (longNameCards.some((card) => card.titleScrollHeight > card.titleHeight + 1)) failures.push('long-name-clipped');
          return { viewport: ${JSON.stringify(viewport.label)}, cardCount: cards.length, uniqueCardHeights, badRows, titleAreaMinHeight, longNameCards, failures };
        })()`
      );
      reports.push(report);
    }
    console.log(JSON.stringify(reports, null, 2));
    const failures = reports.flatMap((report) => report.failures.map((failure) => `${report.viewport}:${failure}`));
    if (failures.length > 0) throw new Error(`Layout verification failed: ${failures.join(", ")}`);
    cdp.close();
  } finally {
    chrome.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

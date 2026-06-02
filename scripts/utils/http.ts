import { execFile } from "node:child_process";
import { promisify } from "node:util";

export type FetchOptions = {
  timeoutMs?: number;
  retries?: number;
  delayMs?: number;
};

const defaultHeaders = {
  "user-agent": "Mozilla/5.0 (compatible; UnibaFoodListCrawler/1.0; +non-commercial fan app; respects robots and low frequency)",
  accept: "text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8",
  "accept-language": "ja,en-US;q=0.8,en;q=0.6"
};

let lastRequestAt = 0;
const execFileAsync = promisify(execFile);

export async function politeFetch(url: string, options: FetchOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 15000;
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? Number(process.env.CRAWL_DELAY_MS ?? 700);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await rateLimit(delayMs);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timeout);
      if (response.ok) return response;
      if (response.status >= 400 && response.status < 500) return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === retries) throw error;
    }
    await sleep(1000 * (attempt + 1));
  }
  throw new Error(`Fetch failed: ${url}`);
}

export async function fetchText(url: string, options?: FetchOptions) {
  try {
    const response = await politeFetch(url, options);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    return response.text();
  } catch (error) {
    if (isCurlFallbackAllowed(url)) {
      const fallback = await fetchTextWithCurl(url, options?.timeoutMs);
      if (fallback.trim()) return fallback;
    }
    throw error;
  }
}

export async function fetchBuffer(url: string, options?: FetchOptions) {
  const response = await politeFetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimit(delayMs: number) {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < delayMs) await sleep(delayMs - elapsed);
  lastRequestAt = Date.now();
}

function isCurlFallbackAllowed(url: string) {
  return /^https:\/\/(?:www\.)?usj\.co\.jp\//.test(url) || /^https:\/\/castel\.jp\//.test(url);
}

async function fetchTextWithCurl(url: string, timeoutMs = 15000) {
  const timeoutSeconds = Math.max(5, Math.ceil(timeoutMs / 1000));
  const { stdout } = await execFileAsync("curl", ["-L", "-s", "--max-time", String(timeoutSeconds), url], {
    maxBuffer: 12 * 1024 * 1024
  });
  return stdout;
}

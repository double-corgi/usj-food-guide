import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { ChildProcess, spawn } from "node:child_process";

const port = 3000;
const baseUrl = `http://localhost:${port}`;
const routes = ["/", "/foods", "/eaten", "/areas"];
const nextBin = resolve(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

let child: ChildProcess | null = null;
let stopping = false;
let restarting = false;
let healthTimer: NodeJS.Timeout | null = null;
let unhealthyCount = 0;

function run(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolvePromise, reject) => {
    execFile(command, args, { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }));
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
}

async function pidsUsingPort() {
  try {
    const { stdout } = await run("lsof", ["-ti", `tcp:${port}`]);
    return stdout
      .split(/\s+/)
      .map((value) => Number(value))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
}

async function killPortUsers() {
  const initialPids = await pidsUsingPort();
  if (initialPids.length === 0) return;

  console.log(`[dev:auto] port ${port} is in use. stopping pid(s): ${initialPids.join(", ")}`);
  for (const pid of initialPids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process may already be gone.
    }
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(250);
    const remaining = await pidsUsingPort();
    if (remaining.length === 0) return;
  }

  const remaining = await pidsUsingPort();
  if (remaining.length > 0) {
    console.log(`[dev:auto] forcing pid(s): ${remaining.join(", ")}`);
    for (const pid of remaining) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // The process may already be gone.
      }
    }
  }
}

async function requestStatus(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "HEAD",
      signal: controller.signal
    });
    return response.status;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyRoutes() {
  const results: Array<{ path: string; status: number | "ERR" }> = [];
  for (const route of routes) {
    try {
      results.push({ path: route, status: await requestStatus(route) });
    } catch {
      results.push({ path: route, status: "ERR" });
    }
  }
  return results;
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 120 && !stopping; attempt += 1) {
    const results = await verifyRoutes();
    const allOk = results.every((result) => result.status === 200);
    if (allOk) {
      console.log(`[dev:auto] ready: ${baseUrl}`);
      for (const result of results) {
        console.log(`[dev:auto] ${result.path} ${result.status}`);
      }
      unhealthyCount = 0;
      return true;
    }
    await delay(1000);
  }
  return false;
}

function stopHealthMonitor() {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}

function startHealthMonitor() {
  stopHealthMonitor();
  healthTimer = setInterval(() => {
    void (async () => {
      if (stopping || restarting || !child || child.killed) return;
      const results = await verifyRoutes();
      const allOk = results.every((result) => result.status === 200);
      if (allOk) {
        unhealthyCount = 0;
        return;
      }
      unhealthyCount += 1;
      console.warn(`[dev:auto] health check failed (${unhealthyCount}/3): ${results.map((result) => `${result.path}=${result.status}`).join(" ")}`);
      if (unhealthyCount >= 3) {
        await restartServer("health check failed");
      }
    })();
  }, 10000);
}

async function startServer() {
  if (!existsSync(nextBin)) {
    throw new Error(`Next.js binary not found: ${nextBin}. Run npm install first.`);
  }

  await killPortUsers();
  console.log(`[dev:auto] starting Next.js dev server on ${baseUrl}`);
  child = spawn(nextBin, ["dev", "--port", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  child.on("exit", (code, signal) => {
    if (stopping || restarting) return;
    console.warn(`[dev:auto] dev server exited (code=${code ?? "null"} signal=${signal ?? "null"}). restarting...`);
    void restartServer("process exited");
  });

  const ready = await waitUntilReady();
  if (!ready && !stopping) {
    await restartServer("server did not become ready");
    return;
  }
  startHealthMonitor();
}

async function stopChild(signal: NodeJS.Signals = "SIGTERM") {
  if (!child || child.killed) return;
  const current = child;
  current.kill(signal);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (current.killed || current.exitCode !== null || current.signalCode !== null) return;
    await delay(250);
  }
  if (current.exitCode === null && current.signalCode === null) {
    current.kill("SIGKILL");
  }
}

async function restartServer(reason: string) {
  if (stopping || restarting) return;
  restarting = true;
  stopHealthMonitor();
  console.warn(`[dev:auto] restarting: ${reason}`);
  await stopChild();
  child = null;
  unhealthyCount = 0;
  restarting = false;
  await startServer();
}

async function shutdown(signal: NodeJS.Signals) {
  if (stopping) return;
  stopping = true;
  stopHealthMonitor();
  console.log(`[dev:auto] received ${signal}. stopping dev server...`);
  await stopChild();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error(`[dev:auto] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
